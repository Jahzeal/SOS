import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PushCampaignKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { requestContext } from '../common/staff/request-context';
import { lagosDay } from '../daily-summary/daily-summary.service';

// web-push has no bundled types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpush = require('web-push');

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

export interface CampaignInput {
  name: string;
  kind?: 'REMINDER' | 'PLAN_EXPIRY';
  messages: PushMessage[];
  targetPlans?: string[];
  audience?: 'OWNERS' | 'OWNERS_MANAGERS' | 'ALL_STAFF';
  timesOfDay?: string[];
  daysOfWeek?: number[];
  daysBeforeExpiry?: number[];
  isActive?: boolean;
}

const AUDIENCE_ROLES: Record<string, string[]> = {
  OWNERS: ['OWNER'],
  OWNERS_MANAGERS: ['OWNER', 'MANAGER'],
  ALL_STAFF: ['OWNER', 'MANAGER', 'SALES', 'TECHNICIAN'],
};

/** A missed time is still sent if the scheduler is up to 90 minutes late, never later. */
const LATE_WINDOW_MIN = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function minutesOf(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (all, key) => (key in vars ? vars[key] : all));
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private ready = false;

  constructor(private prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (pub && priv) {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noxguarda@gmail.com', pub, priv);
      this.ready = true;
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set: push notifications are switched off.');
    }
  }

  publicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY || null, enabled: this.ready };
  }

  // ---------------------------------------------------------------------------
  // Devices
  // ---------------------------------------------------------------------------

  async subscribe(user: { id: string; businessId?: string | null }, dto: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
    if (!dto?.endpoint?.startsWith('https://') || !dto.keys?.p256dh || !dto.keys?.auth) {
      throw new BadRequestException('Invalid notification subscription.');
    }
    // The same device may change hands (shared shop phone): the latest person signed in owns it.
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId: user.id,
        businessId: user.businessId || null,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent?.slice(0, 300),
      },
      update: {
        userId: user.id,
        businessId: user.businessId || null,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent?.slice(0, 300),
      },
    });
    return { success: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Sending
  // ---------------------------------------------------------------------------

  /**
   * Sends to every device of these people. Each person can get their own wording
   * (e.g. their first name). Devices that no longer accept messages are removed.
   */
  private async deliver(
    targets: Array<{ userId: string; message: PushMessage }>,
  ): Promise<{ recipients: number; delivered: number }> {
    if (!this.ready || targets.length === 0) return { recipients: 0, delivered: 0 };

    const byUser = new Map(targets.map((t) => [t.userId, t.message]));
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId: { in: [...byUser.keys()] } } });

    let delivered = 0;
    const queue = [...subs];
    const worker = async () => {
      for (let sub = queue.shift(); sub; sub = queue.shift()) {
        const msg = byUser.get(sub.userId)!;
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: msg.title, body: msg.body, url: msg.url || '/dashboard' }),
            { TTL: 6 * 60 * 60 },
          );
          delivered += 1;
          await this.prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastSuccessAt: new Date() } }).catch(() => {});
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            this.logger.warn(`Push to one device failed: ${err?.statusCode || ''} ${err?.message || err}`);
          }
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(10, queue.length) }, worker));
    return { recipients: subs.length, delivered };
  }

  /** People who should get a campaign: active users, in stores on the chosen plans, with the chosen roles. */
  private async audience(c: { targetPlans: string[]; audience: string }, businessIds?: string[]) {
    const roles = AUDIENCE_ROLES[c.audience] || AUDIENCE_ROLES.OWNERS;
    const plans = (c.targetPlans || []).map((p) => p.toUpperCase());
    return requestContext.outside(() =>
      this.prisma.user.findMany({
        where: {
          isActive: true,
          storeRole: { in: roles as any },
          businessId: businessIds ? { in: businessIds } : { not: null },
          ...(plans.length ? { business: { plan: { in: plans } } } : {}),
          pushSubscriptions: { some: {} },
        },
        select: { id: true, firstName: true, businessId: true, business: { select: { name: true, plan: true } } },
      }),
    );
  }

  private messagesOf(c: { messages: Prisma.JsonValue }): PushMessage[] {
    const list = Array.isArray(c.messages) ? (c.messages as any[]) : [];
    return list
      .map((m) => ({ title: String(m?.title || '').trim(), body: String(m?.body || '').trim(), url: String(m?.url || '/dashboard') }))
      .filter((m) => m.title && m.body);
  }

  /** Sends the campaign's next message to everyone it targets. */
  private async sendReminder(c: any) {
    const messages = this.messagesOf(c);
    if (!messages.length) return { recipients: 0, delivered: 0 };
    const msg = messages[c.nextMessageIndex % messages.length];
    const people = await this.audience(c);
    const result = await this.deliver(
      people.map((p) => ({
        userId: p.id,
        message: {
          title: fill(msg.title, { firstName: p.firstName || '', store: p.business?.name || '' }),
          body: fill(msg.body, { firstName: p.firstName || '', store: p.business?.name || '' }),
          url: msg.url,
        },
      })),
    );
    await this.prisma.pushCampaign.update({
      where: { id: c.id },
      data: { nextMessageIndex: { increment: 1 }, sentCount: { increment: 1 }, lastSentAt: new Date() },
    });
    await this.prisma.pushLog.create({ data: { campaignId: c.id, title: msg.title, ...result } });
    return result;
  }

  /** Sends "your plan ends in N days" to each store that is due today (once per store per reminder day). */
  private async sendPlanExpiry(c: any, now: Date) {
    const messages = this.messagesOf(c);
    if (!messages.length) return { recipients: 0, delivered: 0 };
    const msg = messages[0];
    const today = lagosDay(now);
    const maxDays = Math.max(0, ...(c.daysBeforeExpiry || []));
    if (maxDays === 0) return { recipients: 0, delivered: 0 };

    const plans = (c.targetPlans || []).map((p: string) => p.toUpperCase());
    const stores = await requestContext.outside(() =>
      this.prisma.business.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          plan: plans.length ? { in: plans } : { not: 'FREE' },
          subscriptionEndsAt: { gte: today.start, lt: new Date(today.start.getTime() + (maxDays + 1) * DAY_MS) },
        },
        select: { id: true, name: true, plan: true, subscriptionEndsAt: true },
      }),
    );

    const planNames = new Map(
      (await this.prisma.subscriptionPlan.findMany({ select: { code: true, name: true } })).map((p) => [p.code.toUpperCase(), p.name]),
    );

    let recipients = 0;
    let delivered = 0;
    for (const s of stores) {
      const ends = lagosDay(s.subscriptionEndsAt!);
      const daysLeft = Math.round((ends.start.getTime() - today.start.getTime()) / DAY_MS);
      if (!(c.daysBeforeExpiry || []).includes(daysLeft)) continue;

      const dedupeKey = `${c.id}:${s.id}:${ends.key}:${daysLeft}`;
      const claimed = await this.prisma.pushLog
        .create({ data: { campaignId: c.id, businessId: s.id, dedupeKey, title: msg.title } })
        .catch(() => null); // already sent for this store and day
      if (!claimed) continue;

      const vars = {
        store: s.name,
        plan: planNames.get(String(s.plan).toUpperCase()) || String(s.plan),
        date: s.subscriptionEndsAt!.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' }),
        days: String(daysLeft),
      };
      const people = await this.audience(c, [s.id]);
      const r = await this.deliver(
        people.map((p) => ({
          userId: p.id,
          message: { title: fill(msg.title, { ...vars, firstName: p.firstName || '' }), body: fill(msg.body, { ...vars, firstName: p.firstName || '' }), url: msg.url },
        })),
      );
      recipients += r.recipients;
      delivered += r.delivered;
      await this.prisma.pushLog.update({ where: { id: claimed.id }, data: r });
    }

    await this.prisma.pushCampaign.update({ where: { id: c.id }, data: { sentCount: { increment: 1 }, lastSentAt: new Date() } });
    return { recipients, delivered };
  }

  /**
   * Called by the scheduler (every 15 minutes is ideal). For each active reminder, if one
   * of its times has just passed today and it has not gone out for that time yet, it goes out.
   */
  async runDue(now = new Date()) {
    const day = lagosDay(now);
    const local = new Date(now.getTime() + 60 * 60 * 1000);
    const nowMin = local.getUTCHours() * 60 + local.getUTCMinutes();
    const weekday = local.getUTCDay();

    const campaigns = await this.prisma.pushCampaign.findMany({ where: { isActive: true } });
    const ran: string[] = [];

    for (const c of campaigns) {
      if (c.daysOfWeek.length && !c.daysOfWeek.includes(weekday)) continue;
      const slot = [...c.timesOfDay]
        .filter((t) => /^\d{2}:\d{2}$/.test(t))
        .sort()
        .reverse()
        .find((t) => minutesOf(t) <= nowMin);
      if (!slot || nowMin - minutesOf(slot) > LATE_WINDOW_MIN) continue;

      const slotKey = `${day.key} ${slot}`;
      // Claim this time first so a second scheduler call cannot send it twice.
      const claimed = await this.prisma.pushCampaign.updateMany({
        where: { id: c.id, OR: [{ lastSlotKey: null }, { lastSlotKey: { not: slotKey } }] },
        data: { lastSlotKey: slotKey },
      });
      if (claimed.count === 0) continue;

      try {
        const r = c.kind === PushCampaignKind.PLAN_EXPIRY ? await this.sendPlanExpiry(c, now) : await this.sendReminder(c);
        ran.push(`${c.name}: ${r.delivered}/${r.recipients}`);
      } catch (err: any) {
        this.logger.error(`Reminder "${c.name}" failed: ${err?.message}`);
      }
    }

    if (ran.length) this.logger.log(`Push reminders ${day.key} ${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}: ${ran.join('; ')}`);
    return { ran };
  }

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  private clean(input: CampaignInput) {
    const name = String(input.name || '').trim();
    if (!name) throw new BadRequestException('Give the reminder a name.');
    const messages = (input.messages || [])
      .map((m) => ({ title: String(m.title || '').trim().slice(0, 80), body: String(m.body || '').trim().slice(0, 240), url: String(m.url || '/dashboard').trim() || '/dashboard' }))
      .filter((m) => m.title && m.body);
    if (!messages.length) throw new BadRequestException('Add at least one message with a title and text.');
    if (messages.some((m) => !m.url.startsWith('/'))) throw new BadRequestException('Links must be pages of NoxGuarda, starting with /.');

    const times = [...new Set((input.timesOfDay || []).filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)))].sort();
    if (!times.length) throw new BadRequestException('Add at least one time of day.');
    const kind = input.kind === 'PLAN_EXPIRY' ? PushCampaignKind.PLAN_EXPIRY : PushCampaignKind.REMINDER;
    const daysBefore = [...new Set((input.daysBeforeExpiry || []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 60))];
    if (kind === PushCampaignKind.PLAN_EXPIRY && !daysBefore.length) throw new BadRequestException('Choose how many days before the plan ends.');

    return {
      name: name.slice(0, 80),
      kind,
      messages,
      targetPlans: [...new Set((input.targetPlans || []).map((p) => String(p).toUpperCase()))],
      audience: AUDIENCE_ROLES[input.audience || ''] ? input.audience! : 'OWNERS',
      timesOfDay: times.slice(0, 12),
      daysOfWeek: [...new Set((input.daysOfWeek || []).map(Number).filter((d) => d >= 0 && d <= 6))].sort(),
      daysBeforeExpiry: daysBefore.sort((a, b) => b - a),
      isActive: input.isActive ?? true,
    };
  }

  async listCampaigns() {
    const [campaigns, devices] = await Promise.all([
      this.prisma.pushCampaign.findMany({ orderBy: { createdAt: 'asc' } }),
      this.deviceStats(),
    ]);
    return { campaigns, devices, enabled: this.ready };
  }

  /** How many devices have notifications on, per plan. */
  private async deviceStats() {
    const subs = await requestContext.outside(() =>
      this.prisma.pushSubscription.findMany({ select: { user: { select: { business: { select: { plan: true } } } } } }),
    );
    const byPlan: Record<string, number> = {};
    for (const s of subs) {
      const plan = String(s.user?.business?.plan || 'ADMIN').toUpperCase();
      byPlan[plan] = (byPlan[plan] || 0) + 1;
    }
    return { total: subs.length, byPlan };
  }

  createCampaign(input: CampaignInput) {
    return this.prisma.pushCampaign.create({ data: this.clean(input) });
  }

  async updateCampaign(id: string, input: CampaignInput) {
    await this.findCampaign(id);
    return this.prisma.pushCampaign.update({ where: { id }, data: this.clean(input) });
  }

  async setActive(id: string, isActive: boolean) {
    await this.findCampaign(id);
    return this.prisma.pushCampaign.update({ where: { id }, data: { isActive } });
  }

  async deleteCampaign(id: string) {
    await this.findCampaign(id);
    await this.prisma.pushCampaign.delete({ where: { id } });
    return { success: true };
  }

  private async findCampaign(id: string) {
    const c = await this.prisma.pushCampaign.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Reminder not found.');
    return c;
  }

  /** Sends the campaign's first message to the admin's own devices, to see how it looks. */
  async sendTest(id: string, admin: { id: string; firstName?: string }) {
    const c = await this.findCampaign(id);
    const msg = this.messagesOf(c)[0];
    const vars = { firstName: admin.firstName || 'Emeka', store: 'Sample Store', plan: 'Gold', date: 'Friday 21 Nov', days: '3' };
    const r = await this.deliver([{ userId: admin.id, message: { title: fill(msg.title, vars), body: fill(msg.body, vars), url: msg.url } }]);
    if (r.recipients === 0) {
      throw new BadRequestException('This device has not allowed notifications yet. Tap "Turn on notifications on this device" first.');
    }
    return r;
  }

  /** Sends the next message right away, outside the schedule. */
  async sendNow(id: string) {
    const c = await this.findCampaign(id);
    return c.kind === PushCampaignKind.PLAN_EXPIRY ? this.sendPlanExpiry(c, new Date()) : this.sendReminder(c);
  }

  /** Suggested reminders, added once when the admin asks for them. */
  async addStarterReminders() {
    const existing = await this.prisma.pushCampaign.count();
    if (existing > 0) throw new BadRequestException('You already have reminders.');
    const starters: CampaignInput[] = [
      {
        name: 'Good morning',
        messages: [
          { title: 'Good morning, {firstName} ☀️', body: 'Ready for today? Register new stock before customers arrive.', url: '/dashboard/register' },
          { title: 'Good morning, {firstName} ☀️', body: 'Record every sale today so your profit report is accurate.', url: '/dashboard/checkout' },
          { title: 'New week at {store} 💪', body: 'Check your stock and see what is selling fastest.', url: '/dashboard/inventory' },
        ],
        audience: 'OWNERS_MANAGERS',
        timesOfDay: ['08:00'],
        daysOfWeek: [1, 3, 5],
      },
      {
        name: 'Did you know?',
        messages: [
          { title: 'Did you know? 💡', body: 'You can swap phones at Checkout. NoxGuarda checks the old phone is not stolen first.', url: '/dashboard/checkout?mode=swap' },
          { title: 'Did you know? 💡', body: 'Your customers can scan the QR on their receipt to confirm the phone came from you.', url: '/dashboard/receipts' },
          { title: 'Did you know? 💡', body: 'You can share any receipt or invoice as a PDF on WhatsApp in one tap.', url: '/dashboard/receipts' },
          { title: 'Did you know? 💡', body: 'Add your sales staff so every sale shows who made it.', url: '/dashboard/settings' },
        ],
        audience: 'OWNERS',
        timesOfDay: ['13:00'],
        daysOfWeek: [2, 4],
      },
      {
        name: 'Plan ending',
        kind: 'PLAN_EXPIRY',
        messages: [{ title: 'Your {plan} plan ends {date}', body: 'Renew now to keep selling without interruption.', url: '/dashboard/subscription' }],
        audience: 'OWNERS',
        timesOfDay: ['10:00'],
        daysBeforeExpiry: [3, 1],
      },
    ];
    for (const s of starters) await this.prisma.pushCampaign.create({ data: this.clean(s) });
    return this.listCampaigns();
  }
}
