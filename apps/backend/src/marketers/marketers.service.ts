import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { frontendUrl } from '../common/config/env';
import { AcceptMarketerInviteDto, AddReferralDto, CreateMarketerDto } from './marketers.dto';

const INVITE_DAYS = 7;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const cleanEmail = (email: string) => String(email || '').trim().toLowerCase();

/** What a marketer sees for each shop they added. */
export type ReferralStatus = 'NOT_SIGNED_UP' | 'PAYMENT_PENDING' | 'PAID' | 'EXPIRED' | 'ALREADY_CUSTOMER';

const referralBusinessSelect = {
  id: true,
  name: true,
  plan: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  createdAt: true,
  subscriptionPlan: { select: { name: true } },
} as const;

function referralStatus(r: { alreadyCustomer: boolean; business?: any }): ReferralStatus {
  if (r.alreadyCustomer) return 'ALREADY_CUSTOMER';
  const b = r.business;
  if (!b) return 'NOT_SIGNED_UP';
  const status = String(b.subscriptionStatus || '').toUpperCase();
  if (status === 'ACTIVE') {
    const ends = b.subscriptionEndsAt ? new Date(b.subscriptionEndsAt).getTime() : null;
    return ends !== null && ends <= Date.now() ? 'EXPIRED' : 'PAID';
  }
  if (status === 'EXPIRED' || status === 'PAST_DUE' || status === 'CANCELLED') return 'EXPIRED';
  return 'PAYMENT_PENDING';
}

function shapeReferral(r: any) {
  const status = referralStatus(r);
  return {
    id: r.id,
    email: r.email,
    shopName: r.shopName || r.business?.name || null,
    phone: r.phone,
    status,
    // Only the store's name and plan, never its records.
    storeName: r.business?.name || null,
    planName: r.business ? r.business.subscriptionPlan?.name || r.business.plan : null,
    signedUpAt: r.business?.createdAt || null,
    addedAt: r.createdAt,
  };
}

function tally(referrals: { status: ReferralStatus }[]) {
  return {
    added: referrals.length,
    signedUp: referrals.filter((r) => r.status === 'PAYMENT_PENDING' || r.status === 'PAID' || r.status === 'EXPIRED').length,
    paid: referrals.filter((r) => r.status === 'PAID').length,
  };
}

/**
 * Marketers: people who show NoxGuarda to shops. An admin adds them by email; they
 * set a password from the emailed link and get their own store on Gold, free, to demo
 * with. In that store they list the shops they onboarded (by the owner's email); a
 * shop is linked to them when it signs up with that email.
 */
@Injectable()
export class MarketersService {
  private readonly logger = new Logger(MarketersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly auth: AuthService,
  ) {}

  /* ------------------------------------------------------------------ Admin */

  async list() {
    const marketers = await this.prisma.marketer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        business: { select: { id: true, name: true } },
        referrals: { include: { business: { select: referralBusinessSelect } } },
      },
    });
    return marketers.map((m) => ({
      id: m.id,
      email: m.email,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone,
      status: this.inviteStatus(m),
      storeName: m.business?.name || null,
      createdAt: m.createdAt,
      activatedAt: m.activatedAt,
      counts: tally(m.referrals.map(shapeReferral)),
    }));
  }

  async detail(id: string) {
    const m = await this.prisma.marketer.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        referrals: { orderBy: { createdAt: 'desc' }, include: { business: { select: referralBusinessSelect } } },
      },
    });
    if (!m) throw new NotFoundException('Marketer not found.');
    const referrals = m.referrals.map(shapeReferral);
    return {
      id: m.id,
      email: m.email,
      firstName: m.firstName,
      lastName: m.lastName,
      phone: m.phone,
      status: this.inviteStatus(m),
      store: m.business,
      createdAt: m.createdAt,
      activatedAt: m.activatedAt,
      inviteExpiresAt: m.status === 'INVITED' ? m.inviteExpiresAt : null,
      counts: tally(referrals),
      referrals,
    };
  }

  /** INVITED links past their date show as EXPIRED_INVITE so the admin knows to resend. */
  private inviteStatus(m: { status: string; inviteExpiresAt: Date | null }) {
    if (m.status === 'INVITED' && m.inviteExpiresAt && m.inviteExpiresAt.getTime() < Date.now()) return 'INVITE_EXPIRED';
    return m.status;
  }

  async create(dto: CreateMarketerDto) {
    const email = cleanEmail(dto.email);
    const [user, existing] = await Promise.all([
      this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } }),
      this.prisma.marketer.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (existing) throw new ConflictException('This email is already on your marketers list.');
    if (user) {
      throw new ConflictException(
        'This email already has a NoxGuarda account. Marketers need an email that has not been used on NoxGuarda.',
      );
    }

    const token = randomBytes(32).toString('base64url');
    const marketer = await this.prisma.marketer.create({
      data: {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim() || null,
        tokenHash: hashToken(token),
        inviteExpiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return { id: marketer.id, ...(await this.sendInvite(marketer, token)) };
  }

  async resendInvite(id: string) {
    const m = await this.prisma.marketer.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Marketer not found.');
    if (m.status !== 'INVITED') throw new BadRequestException('This marketer has already set their password.');
    const token = randomBytes(32).toString('base64url');
    const updated = await this.prisma.marketer.update({
      where: { id },
      data: { tokenHash: hashToken(token), inviteExpiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000) },
    });
    return { id, ...(await this.sendInvite(updated, token)) };
  }

  private async sendInvite(m: { email: string; firstName: string }, token: string) {
    const link = `${frontendUrl()}/marketer-join?token=${encodeURIComponent(token)}`;
    const result = await this.mail
      .dispatchEmail({
        to: m.email,
        subject: 'You are invited to market NoxGuarda',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px 20px; color: #0f172a;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">Welcome to the NoxGuarda marketing team</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Hello ${escapeHtml(m.firstName)}, you have been added as a NoxGuarda marketer. You get your own store on the
              <strong>Gold plan</strong>, free, so you can show businesses how NoxGuarda works.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Tap the button to choose your password and open your store.</p>
            <p style="margin: 24px 0;">
              <a href="${escapeHtml(link)}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">Set my password</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">This link works for ${INVITE_DAYS} days. If you were not expecting it, you can ignore this email.</p>
          </div>`,
        text: `Hello ${m.firstName}, you have been added as a NoxGuarda marketer, with your own store on the Gold plan for free. Choose your password here (valid ${INVITE_DAYS} days): ${link}`,
      })
      .catch((err) => ({ success: false, error: err?.message }));
    if (!result?.success) this.logger.warn(`Marketer invite email not sent: ${(result as any)?.error || 'unknown'}`);
    // Returned to the admin too, so it can be sent on WhatsApp.
    return { email: m.email, inviteLink: link, emailSent: !!result?.success };
  }

  /** Switching a marketer off locks them out of their store at once; switching on lets them back in. */
  async setActive(id: string, active: boolean) {
    const m = await this.prisma.marketer.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Marketer not found.');
    const status = active ? (m.businessId ? 'ACTIVE' : 'INVITED') : 'DISABLED';
    await this.prisma.$transaction(async (tx) => {
      await tx.marketer.update({ where: { id }, data: { status } });
      if (m.businessId) {
        await tx.user.updateMany({ where: { businessId: m.businessId }, data: { isActive: active } });
        if (!active) {
          await tx.refreshToken.updateMany({ where: { user: { businessId: m.businessId }, revoked: false }, data: { revoked: true } });
        }
      }
    });
    return { id, status };
  }

  /** Only an invitation nobody has used yet can be withdrawn. */
  async cancelInvite(id: string) {
    const m = await this.prisma.marketer.findUnique({ where: { id }, select: { status: true, businessId: true } });
    if (!m) throw new NotFoundException('Marketer not found.');
    if (m.businessId) throw new BadRequestException('This marketer already has a store. Switch them off instead.');
    await this.prisma.marketer.delete({ where: { id } });
    return { success: true };
  }

  async adminRemoveReferral(marketerId: string, referralId: string) {
    const r = await this.prisma.marketerReferral.findFirst({ where: { id: referralId, marketerId }, select: { id: true } });
    if (!r) throw new NotFoundException('Business not found on this marketer.');
    await this.prisma.marketerReferral.delete({ where: { id: r.id } });
    return { success: true };
  }

  /* --------------------------------------------------- Joining from the link */

  private async openInvite(token: string) {
    const m = await this.prisma.marketer.findUnique({ where: { tokenHash: hashToken(String(token || '')) } });
    if (!m || m.status !== 'INVITED') {
      throw new NotFoundException('This link is not valid. Ask NoxGuarda to send you a new one.');
    }
    if (!m.inviteExpiresAt || m.inviteExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This link has expired. Ask NoxGuarda to send you a new one.');
    }
    return m;
  }

  async describeInvite(token: string) {
    const m = await this.openInvite(token);
    return { firstName: m.firstName, lastName: m.lastName, email: m.email };
  }

  private async goldPlan() {
    const code = String(process.env.MARKETER_PLAN_CODE || '').trim().toUpperCase();
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: code ? { code, isActive: true } : { code: { startsWith: 'GOLD' }, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true },
    });
    if (!plan) throw new BadRequestException('The Gold plan is not set up yet. Please contact NoxGuarda.');
    return plan;
  }

  private async uniqueSlug(name: string) {
    const base =
      String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'store';
    let slug = base;
    for (let i = 0; i < 5; i++) {
      if (!(await this.prisma.business.findUnique({ where: { slug }, select: { id: true } }))) return slug;
      slug = `${base}-${randomBytes(3).toString('hex')}`;
    }
    return `${base}-${randomBytes(6).toString('hex')}`;
  }

  async acceptInvite(dto: AcceptMarketerInviteDto) {
    const m = await this.openInvite(dto.token);

    const taken = await this.prisma.user.findFirst({
      where: { email: { equals: m.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (taken) throw new ConflictException('This email already has a NoxGuarda account. Please sign in instead.');

    const plan = await this.goldPlan();
    const storeName = dto.storeName?.trim() || `${m.firstName}'s Store`;
    const slug = await this.uniqueSlug(storeName);
    const password = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      // Claim the invitation first so the same link cannot make two stores.
      const claimed = await tx.marketer.updateMany({
        where: { id: m.id, status: 'INVITED', tokenHash: m.tokenHash },
        data: { status: 'ACTIVE', tokenHash: null, inviteExpiresAt: null, activatedAt: new Date() },
      });
      if (claimed.count !== 1) throw new ConflictException('This link has already been used.');

      const business = await tx.business.create({
        data: {
          name: storeName,
          slug,
          email: m.email,
          phone: m.phone,
          plan: plan.code,
          planId: plan.id,
          subscriptionStatus: 'ACTIVE',
          subscriptionEndsAt: null,
          isMarketerStore: true,
          users: {
            create: {
              email: m.email,
              password,
              firstName: m.firstName,
              lastName: m.lastName,
              role: UserRole.BUSINESS,
            },
          },
        },
        include: { users: { include: { business: true, branch: { select: { id: true, name: true } } } } },
      });
      await tx.marketer.update({ where: { id: m.id }, data: { businessId: business.id } });
      return business.users[0];
    });

    const tokens = await this.auth.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        storeRole: user.storeRole,
        branch: user.branch,
        business: user.business,
      },
      ...tokens,
    };
  }

  /* ---------------------------------------- The marketer's own onboarded list */

  async marketerFor(businessId: string) {
    const m = await this.prisma.marketer.findUnique({ where: { businessId } });
    if (!m || m.status !== 'ACTIVE') throw new ForbiddenException('This page is only for NoxGuarda marketers.');
    return m;
  }

  async myReferrals(businessId: string) {
    const m = await this.marketerFor(businessId);
    const rows = await this.prisma.marketerReferral.findMany({
      where: { marketerId: m.id },
      orderBy: { createdAt: 'desc' },
      include: { business: { select: referralBusinessSelect } },
    });
    const referrals = rows.map(shapeReferral);
    return { counts: tally(referrals), referrals };
  }

  async addReferral(businessId: string, dto: AddReferralDto) {
    const m = await this.marketerFor(businessId);
    const email = cleanEmail(dto.email);
    if (email === m.email) throw new BadRequestException('That is your own email. Add the email of the business owner.');

    const already = await this.prisma.marketerReferral.findUnique({ where: { email }, select: { marketerId: true } });
    if (already) {
      throw new ConflictException(
        already.marketerId === m.id ? 'You have already added this business.' : 'Another marketer has already added this business.',
      );
    }

    // Has this email already signed up?
    const owner = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        role: true,
        storeRole: true,
        businessId: true,
        business: { select: { id: true, subscriptionStatus: true, isMarketerStore: true } },
      },
    });

    let businessId_: string | null = null;
    let alreadyCustomer = false;
    if (owner) {
      if (owner.role === 'ADMIN' || !owner.business || owner.business.isMarketerStore) {
        throw new BadRequestException('This email belongs to a NoxGuarda team account, not a business.');
      }
      if (owner.storeRole && owner.storeRole !== 'OWNER') {
        throw new BadRequestException("This email belongs to a staff member of a store. Add the store owner's email instead.");
      }
      // Signed up but never paid (for example during the marketer's visit): it counts.
      // A store that was already a paying customer does not.
      if (owner.business.subscriptionStatus === 'PENDING_PAYMENT') {
        const linkedElsewhere = await this.prisma.marketerReferral.findFirst({
          where: { businessId: owner.business.id },
          select: { id: true },
        });
        if (linkedElsewhere) throw new ConflictException('Another marketer has already added this business.');
        businessId_ = owner.business.id;
      } else {
        alreadyCustomer = true;
      }
    }

    try {
      const r = await this.prisma.marketerReferral.create({
        data: {
          marketerId: m.id,
          email,
          shopName: dto.shopName?.trim() || null,
          phone: dto.phone?.trim() || null,
          businessId: businessId_,
          linkedAt: businessId_ ? new Date() : null,
          alreadyCustomer,
        },
        include: { business: { select: referralBusinessSelect } },
      });
      return shapeReferral(r);
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ConflictException('Another marketer has already added this business.');
      throw err;
    }
  }

  /** A marketer may take back a business only while it has not signed up. */
  async removeReferral(businessId: string, referralId: string) {
    const m = await this.marketerFor(businessId);
    const r = await this.prisma.marketerReferral.findFirst({ where: { id: referralId, marketerId: m.id } });
    if (!r) throw new NotFoundException('Business not found on your list.');
    if (r.businessId) throw new BadRequestException('This business has signed up, so it stays on your list.');
    await this.prisma.marketerReferral.delete({ where: { id: r.id } });
    return { success: true };
  }
}
