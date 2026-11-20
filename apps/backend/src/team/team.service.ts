import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { StoreRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { StaffAccessService } from '../common/staff/staff-access.service';
import { requestContext } from '../common/staff/request-context';
import { canAssignRole, ROLE_LABELS, StoreRoleName } from '../common/staff/store-roles';
import { frontendUrl } from '../common/config/env';
import { AcceptInviteDto, BranchDto, InviteStaffDto, UpdateBranchDto, UpdateMemberDto } from './team.dto';

const INVITE_DAYS = 7;
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

type Actor = { id: string; businessId: string; storeRole?: string | null; firstName?: string; business?: { name?: string } };

/** Which plan to suggest when a limit is reached. */
function upgradeHint(planCode: string, need: 'staff' | 'manager' | 'branch'): string {
  if (need === 'manager') return 'Upgrade to Gold to add managers.';
  if (planCode === 'FREE') return need === 'branch' ? 'Upgrade to Gold to add a branch.' : 'Upgrade to Starter to add staff.';
  if (planCode === 'STARTER') return need === 'branch' ? 'Upgrade to Gold to add a branch.' : 'Upgrade to Gold to add more staff.';
  return 'Upgrade to Enterprise for more.';
}

/**
 * Staff accounts and branches for one store: invite, change role or branch,
 * switch off, and manage branches. Plan limits are checked here as well as at
 * sign-in. Nothing is ever deleted: switched-off staff keep their name on old
 * receipts and records.
 */
@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly staff: StaffAccessService,
    private readonly auth: AuthService,
  ) {}

  private role(actor: Actor): StoreRoleName {
    return (actor.storeRole || 'OWNER') as StoreRoleName;
  }

  /** Everything the Team screen needs in one call. */
  async overview(actor: Actor) {
    const businessId = actor.businessId;
    await this.staff.mainBranchId(businessId);
    const [limits, members, invites, branches] = await requestContext.outside(() =>
      Promise.all([
        this.staff.limitsFor(businessId),
        this.prisma.user.findMany({
          where: { businessId },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            storeRole: true,
            isActive: true,
            createdAt: true,
            branch: { select: { id: true, name: true } },
          },
        }),
        this.prisma.staffInvite.findMany({
          where: { businessId, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            storeRole: true,
            expiresAt: true,
            createdAt: true,
            branch: { select: { id: true, name: true } },
          },
        }),
        this.listBranches(businessId),
      ]),
    );

    const activeMembers = members.filter((m) => m.isActive).length;
    return {
      limits,
      seatsUsed: activeMembers + invites.length,
      branchesUsed: branches.filter((b) => b.isActive).length,
      members,
      invites,
      branches,
      canManage: ['OWNER', 'MANAGER'].includes(this.role(actor)),
      isOwner: this.role(actor) === 'OWNER',
    };
  }

  listBranches(businessId: string) {
    return requestContext.outside(() =>
      this.prisma.branch.findMany({
        where: { businessId },
        orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
        select: { id: true, name: true, address: true, phone: true, isMain: true, isActive: true },
      }),
    );
  }

  /** A branch id from the request, checked to belong to this store and be open. */
  private async ownBranch(businessId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, businessId, isActive: true } });
    if (!branch) throw new BadRequestException('That branch was not found or is closed.');
    return branch;
  }

  /** Sales staff and technicians always work in a branch; managers may cover all branches. */
  private async resolveBranch(businessId: string, role: StoreRoleName, branchId?: string | null) {
    if (branchId) return (await this.ownBranch(businessId, branchId)).id;
    if (role === 'MANAGER') return null;
    return this.staff.mainBranchId(businessId);
  }

  async invite(actor: Actor, dto: InviteStaffDto) {
    const businessId = actor.businessId;
    const role = dto.storeRole as StoreRoleName;
    const email = dto.email.trim().toLowerCase();

    if (!canAssignRole(this.role(actor), role)) {
      throw new ForbiddenException('You cannot give that role. Managers can add sales staff and technicians.');
    }

    const limits = await this.staff.limitsFor(businessId);
    if (!limits.assignableRoles.includes(role)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PLAN_ROLE_LIMIT',
        message:
          limits.assignableRoles.length === 0
            ? `Your ${limits.planName} plan is for the owner only. ${upgradeHint(limits.planCode, 'staff')}`
            : `Your ${limits.planName} plan does not include the ${ROLE_LABELS[role]} role. ${upgradeHint(limits.planCode, 'manager')}`,
      });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('This email already has a NoxGuarda account. Please use a different email address.');
    }

    // A new invitation for the same person replaces the old one.
    await this.prisma.staffInvite.deleteMany({ where: { businessId, email, acceptedAt: null } });

    if (limits.maxStaff > 0 && (await this.staff.seatsInUse(businessId)) >= limits.maxStaff) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'STAFF_LIMIT',
        message: `Your ${limits.planName} plan allows ${limits.maxStaff} staff accounts (owner included) and they are all in use. ${upgradeHint(limits.planCode, 'staff')}`,
      });
    }

    const branchId = await this.resolveBranch(businessId, role, dto.branchId);
    const token = randomBytes(32).toString('base64url');
    const invite = await this.prisma.staffInvite.create({
      data: {
        businessId,
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        storeRole: role as StoreRole,
        branchId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
        invitedById: actor.id,
      },
      include: { branch: { select: { name: true } } },
    });

    const link = `${frontendUrl()}/join?token=${encodeURIComponent(token)}`;
    const storeName = actor.business?.name || 'your store';
    const emailResult = await this.mail
      .dispatchEmail({
        to: email,
        subject: `You have been added to ${storeName} on NoxGuarda`.replace(/[\r\n]+/g, ' '),
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px 20px; color: #0f172a;">
            <h2 style="margin: 0 0 12px 0; font-size: 20px;">You have been added to ${escapeHtml(storeName)}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Hello ${escapeHtml(invite.firstName)}, ${escapeHtml(actor.firstName || 'the store owner')} has added you to
              <strong>${escapeHtml(storeName)}</strong> on NoxGuarda as <strong>${escapeHtml(ROLE_LABELS[role])}</strong>${
                invite.branch ? ` at <strong>${escapeHtml(invite.branch.name)}</strong>` : ''
              }.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">Tap the button to choose your password and start.</p>
            <p style="margin: 24px 0;">
              <a href="${escapeHtml(link)}" style="display: inline-block; padding: 12px 24px; background: #0d9488; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">Join ${escapeHtml(storeName)}</a>
            </p>
            <p style="font-size: 12px; color: #64748b;">This link works for ${INVITE_DAYS} days. If you were not expecting it, you can ignore this email.</p>
          </div>`,
        text: `${actor.firstName || 'The store owner'} has added you to ${storeName} on NoxGuarda as ${ROLE_LABELS[role]}. Choose your password here (valid ${INVITE_DAYS} days): ${link}`,
      })
      .catch((err) => ({ success: false, error: err?.message }));

    if (!emailResult?.success) {
      this.logger.warn(`Staff invite email not sent: ${(emailResult as any)?.error || 'unknown'}`);
    }

    // The link is returned to the owner too, so it can also be shared on WhatsApp.
    return {
      id: invite.id,
      email,
      inviteLink: link,
      emailSent: !!emailResult?.success,
      expiresAt: invite.expiresAt,
    };
  }

  async revokeInvite(actor: Actor, inviteId: string) {
    const invite = await this.prisma.staffInvite.findFirst({
      where: { id: inviteId, businessId: actor.businessId, acceptedAt: null },
    });
    if (!invite) throw new NotFoundException('Invitation not found.');
    if (this.role(actor) === 'MANAGER' && !canAssignRole('MANAGER', invite.storeRole as StoreRoleName)) {
      throw new ForbiddenException('Only the owner can cancel this invitation.');
    }
    await this.prisma.staffInvite.delete({ where: { id: invite.id } });
    return { success: true };
  }

  async updateMember(actor: Actor, memberId: string, dto: UpdateMemberDto) {
    const businessId = actor.businessId;
    const member = await this.prisma.user.findFirst({ where: { id: memberId, businessId } });
    if (!member) throw new NotFoundException('Staff member not found.');
    if (member.storeRole === 'OWNER') throw new ForbiddenException('The owner account cannot be changed here.');
    if (member.id === actor.id) throw new ForbiddenException('You cannot change your own role or access.');

    const actorRole = this.role(actor);
    const currentRole = member.storeRole as StoreRoleName;
    if (!canAssignRole(actorRole, currentRole)) {
      throw new ForbiddenException('Only the owner can change a manager.');
    }

    const data: { storeRole?: StoreRole; branchId?: string | null; isActive?: boolean } = {};
    const newRole = (dto.storeRole || currentRole) as StoreRoleName;

    if (dto.storeRole && dto.storeRole !== currentRole) {
      if (!canAssignRole(actorRole, newRole)) throw new ForbiddenException('You cannot give that role.');
      const limits = await this.staff.limitsFor(businessId);
      if (!limits.assignableRoles.includes(newRole)) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'PLAN_ROLE_LIMIT',
          message: `Your ${limits.planName} plan does not include the ${ROLE_LABELS[newRole]} role. ${upgradeHint(limits.planCode, 'manager')}`,
        });
      }
      data.storeRole = newRole as StoreRole;
    }

    if (dto.branchId !== undefined || data.storeRole) {
      const wanted = dto.branchId !== undefined ? dto.branchId : member.branchId;
      data.branchId = await this.resolveBranch(businessId, newRole, wanted);
    }

    if (dto.isActive !== undefined && dto.isActive !== member.isActive) {
      if (dto.isActive) {
        // Switching someone back on takes a seat.
        const limits = await this.staff.limitsFor(businessId);
        if (limits.maxStaff > 0 && (await this.staff.seatsInUse(businessId)) >= limits.maxStaff) {
          throw new ForbiddenException({
            statusCode: 403,
            code: 'STAFF_LIMIT',
            message: `Your ${limits.planName} plan allows ${limits.maxStaff} staff accounts and they are all in use. ${upgradeHint(limits.planCode, 'staff')}`,
          });
        }
      }
      data.isActive = dto.isActive;
    }

    return this.prisma.user.update({
      where: { id: member.id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        storeRole: true,
        isActive: true,
        branch: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Deletes a staff login for good, so that person can use their email elsewhere
   * (for example to open their own store). The store keeps everything they did:
   * sales and payments stay, and quotes/invoices they made move to the owner.
   */
  async removeMember(actor: Actor, memberId: string) {
    const businessId = actor.businessId;
    const member = await this.prisma.user.findFirst({ where: { id: memberId, businessId } });
    if (!member) throw new NotFoundException('Staff member not found.');
    if (member.storeRole === 'OWNER') throw new ForbiddenException('The owner account cannot be deleted here.');
    if (member.id === actor.id) throw new ForbiddenException('You cannot delete your own account here.');
    if (member.role === 'ADMIN') throw new ForbiddenException('This account cannot be deleted here.');
    if (!canAssignRole(this.role(actor), member.storeRole as StoreRoleName)) {
      throw new ForbiddenException('Only the owner can delete a manager.');
    }
    const owner = await this.prisma.user.findFirst({
      where: { businessId, storeRole: 'OWNER' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!owner) throw new ForbiddenException('This store has no owner account, so staff cannot be deleted.');
    await this.prisma.$transaction(async (tx) => {
      await tx.quote.updateMany({ where: { createdById: member.id }, data: { createdById: owner.id } });
      await tx.user.delete({ where: { id: member.id } });
    });
    return { success: true };
  }

  async createBranch(actor: Actor, dto: BranchDto) {
    const businessId = actor.businessId;
    const limits = await this.staff.limitsFor(businessId);
    await this.staff.mainBranchId(businessId);
    const open = await this.prisma.branch.count({ where: { businessId, isActive: true } });
    if (limits.maxBranches > 0 && open >= limits.maxBranches) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'BRANCH_LIMIT',
        message: `Your ${limits.planName} plan allows ${limits.maxBranches} branch${limits.maxBranches === 1 ? '' : 'es'}. ${upgradeHint(limits.planCode, 'branch')}`,
      });
    }
    return this.prisma.branch
      .create({
        data: {
          businessId,
          name: dto.name.trim(),
          address: dto.address?.trim() || null,
          phone: dto.phone?.trim() || null,
        },
      })
      .catch((err) => {
        if (err?.code === 'P2002') throw new ConflictException('You already have a branch with this name.');
        throw err;
      });
  }

  async updateBranch(actor: Actor, branchId: string, dto: UpdateBranchDto) {
    const businessId = actor.businessId;
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, businessId } });
    if (!branch) throw new NotFoundException('Branch not found.');

    if (dto.isActive === false) {
      if (branch.isMain) throw new BadRequestException('The main branch cannot be closed.');
      const staffHere = await this.prisma.user.count({ where: { businessId, branchId, isActive: true } });
      if (staffHere > 0) {
        throw new BadRequestException(
          `${staffHere} staff member${staffHere === 1 ? ' works' : 's work'} in this branch. Move them to another branch first.`,
        );
      }
    }
    if (dto.isActive === true && !branch.isActive) {
      const limits = await this.staff.limitsFor(businessId);
      const open = await this.prisma.branch.count({ where: { businessId, isActive: true } });
      if (limits.maxBranches > 0 && open >= limits.maxBranches) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'BRANCH_LIMIT',
          message: `Your ${limits.planName} plan allows ${limits.maxBranches} branch${limits.maxBranches === 1 ? '' : 'es'}. ${upgradeHint(limits.planCode, 'branch')}`,
        });
      }
    }

    return this.prisma.branch
      .update({
        where: { id: branch.id },
        data: {
          name: dto.name?.trim() || undefined,
          address: dto.address !== undefined ? dto.address.trim() || null : undefined,
          phone: dto.phone !== undefined ? dto.phone.trim() || null : undefined,
          isActive: dto.isActive,
        },
      })
      .catch((err) => {
        if (err?.code === 'P2002') throw new ConflictException('You already have a branch with this name.');
        throw err;
      });
  }

  /* --------------------------------------------- Joining from an invitation */

  private async findOpenInvite(token: string) {
    const invite = await this.prisma.staffInvite.findUnique({
      where: { tokenHash: hashToken(String(token || '')) },
      include: {
        business: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });
    if (!invite || invite.acceptedAt) {
      throw new NotFoundException('This invitation link is not valid. Ask the store owner to send a new one.');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired. Ask the store owner to send a new one.');
    }
    return invite;
  }

  async describeInvite(token: string) {
    const invite = await this.findOpenInvite(token);
    return {
      storeName: invite.business.name,
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      role: ROLE_LABELS[invite.storeRole as StoreRoleName],
      branch: invite.branch?.name || null,
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.findOpenInvite(dto.token);

    const taken = await this.prisma.user.findFirst({
      where: { email: { equals: invite.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (taken) throw new ConflictException('This email already has a NoxGuarda account. Please sign in instead.');

    // The plan may have changed since the invitation was sent.
    const limits = await this.staff.limitsFor(invite.businessId);
    if (!limits.assignableRoles.includes(invite.storeRole as StoreRoleName)) {
      throw new ForbiddenException("The store's plan no longer includes this role. Ask the store owner to upgrade.");
    }
    if (limits.maxStaff > 0) {
      const active = await this.prisma.user.count({ where: { businessId: invite.businessId, isActive: true } });
      if (active >= limits.maxStaff) {
        throw new ForbiddenException("The store has no free staff accounts left. Ask the store owner to upgrade.");
      }
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.staffInvite.updateMany({
        where: { id: invite.id, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count !== 1) throw new ConflictException('This invitation has already been used.');
      return tx.user.create({
        data: {
          email: invite.email,
          password,
          firstName: invite.firstName,
          lastName: invite.lastName,
          businessId: invite.businessId,
          storeRole: invite.storeRole,
          branchId: invite.branchId,
        },
        include: { business: true, branch: { select: { id: true, name: true } } },
      });
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
}
