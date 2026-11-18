import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SubscriptionService } from '../common/services/subscription.service';
import { requestContext } from '../common/staff/request-context';
import { frontendUrl } from '../common/config/env';

/** Nigeria is UTC+1 all year (no daylight saving). */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LagosDay {
  key: string; // YYYY-MM-DD
  start: Date;
  end: Date;
  hour: number;
  label: string; // e.g. "Mon 17 Nov"
}

export function lagosDay(now = new Date()): LagosDay {
  const local = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const start = new Date(Date.UTC(y, m, d) - LAGOS_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    key: `${y}-${pad(m + 1)}-${pad(d)}`,
    start,
    end: new Date(start.getTime() + DAY_MS),
    hour: local.getUTCHours(),
    label: local.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
  };
}

export interface DaySummary {
  salesCount: number;
  revenue: number;
  /** Only filled in for people allowed to see costs. */
  profit?: number;
  /** Items sold without a cost price, so they are not counted in profit. */
  itemsWithoutCost?: number;
  devicesSold: Array<{ description: string; price: number }>;
  devicesSoldCount: number;
  tradeInsCount: number;
  tradeInsValue: number;
  blockedCount: number;
  owed: number;
  topSeller: { name: string; sales: number } | null;
}

function esc(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function naira(n: number) {
  return `₦${Math.round(Math.abs(n)).toLocaleString('en-NG')}`;
}

const PAID_STATUSES = ['PAID', 'PARTIALLY_PAID'];

@Injectable()
export class DailySummaryService {
  private readonly logger = new Logger(DailySummaryService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private subscriptions: SubscriptionService,
  ) {}

  /**
   * The numbers for one store (or one branch) for one Lagos day.
   * Always runs store-wide with explicit filters, so it works the same from the
   * evening timer (no signed-in user) and from the dashboard.
   */
  async compute(businessId: string, day: LagosDay, opts: { branchId?: string | null; showProfit: boolean }): Promise<DaySummary> {
    return requestContext.outside(async () => {
      const branch = opts.branchId ? { branchId: opts.branchId } : {};
      const inDay = { gte: day.start, lt: day.end };

      const [sales, tradeIns, blockedCount, owed] = await Promise.all([
        this.prisma.sale.findMany({
          where: { businessId, ...branch, createdAt: inDay, paymentStatus: { in: PAID_STATUSES } },
          select: {
            totalAmount: true,
            soldById: true,
            items: {
              select: {
                description: true,
                quantity: true,
                totalPrice: true,
                phoneRecordId: true,
                phoneRecord: { select: { purchasePrice: true } },
              },
            },
          },
        }),
        this.prisma.tradeIn.aggregate({
          where: { businessId, ...branch, createdAt: inDay, status: 'COMPLETED' },
          _count: { _all: true },
          _sum: { tradeInValue: true },
        }),
        this.prisma.tradeIn.count({ where: { businessId, ...branch, createdAt: inDay, status: 'BLOCKED' } }),
        this.prisma.sale.aggregate({
          where: { businessId, ...branch, balanceDue: { gt: 0 } },
          _sum: { balanceDue: true },
        }),
      ]);

      let revenue = 0;
      let profit = 0;
      let itemsWithoutCost = 0;
      const devicesSold: Array<{ description: string; price: number }> = [];
      const bySeller = new Map<string, number>();

      for (const sale of sales) {
        revenue += sale.totalAmount || 0;
        bySeller.set(sale.soldById, (bySeller.get(sale.soldById) || 0) + 1);
        for (const item of sale.items) {
          const cost = item.phoneRecord?.purchasePrice;
          if (cost != null) profit += (item.totalPrice || 0) - cost * (item.quantity || 1);
          else itemsWithoutCost += 1;
          if (item.phoneRecordId) devicesSold.push({ description: item.description, price: item.totalPrice || 0 });
        }
      }

      let topSeller: DaySummary['topSeller'] = null;
      const best = [...bySeller.entries()].sort((a, b) => b[1] - a[1])[0];
      if (best) {
        const u = await this.prisma.user.findUnique({ where: { id: best[0] }, select: { firstName: true, lastName: true } });
        topSeller = { name: [u?.firstName, u?.lastName].filter(Boolean).join(' ') || 'Staff', sales: best[1] };
      }

      devicesSold.sort((a, b) => b.price - a.price);

      return {
        salesCount: sales.length,
        revenue,
        ...(opts.showProfit ? { profit, itemsWithoutCost } : {}),
        devicesSold: devicesSold.slice(0, 10),
        devicesSoldCount: devicesSold.length,
        tradeInsCount: tradeIns._count._all,
        tradeInsValue: tradeIns._sum.tradeInValue || 0,
        blockedCount,
        owed: owed._sum.balanceDue || 0,
        topSeller,
      };
    });
  }

  render(s: DaySummary, ctx: { storeName: string; branchName?: string | null; dayLabel: string }) {
    const where = ctx.branchName ? `${ctx.storeName}, ${ctx.branchName}` : ctx.storeName;
    const subject = `NoxGuarda: ${where}, ${ctx.dayLabel}`;
    const dashboard = `${frontendUrl()}/dashboard`;

    const rows: Array<[string, string]> = [];
    if (s.salesCount === 0) {
      rows.push(['Sales', 'No sales recorded today']);
    } else {
      rows.push(['Sales', `${s.salesCount} · ${naira(s.revenue)}`]);
      if (s.profit != null) rows.push(['Profit', `${s.profit < 0 ? '−' : ''}${naira(s.profit)}`]);
      rows.push(['Devices sold', String(s.devicesSoldCount)]);
    }
    if (s.tradeInsCount > 0) rows.push(['Swaps / trade-ins', `${s.tradeInsCount} · ${naira(s.tradeInsValue)} taken in`]);
    if (s.blockedCount > 0) rows.push(['Stolen devices stopped', String(s.blockedCount)]);
    if (s.owed > 0) rows.push(['Customers owe you', naira(s.owed)]);
    if (s.topSeller) rows.push(['Top seller', `${s.topSeller.name} (${s.topSeller.sales} sale${s.topSeller.sales === 1 ? '' : 's'})`]);

    const devices = s.devicesSold
      .map((d) => `<li style="margin:2px 0">${esc(d.description)} · ${esc(naira(d.price))}</li>`)
      .join('');
    const costNote =
      s.profit != null && s.itemsWithoutCost
        ? `<p style="color:#64748b;font-size:12px;margin:12px 0 0">${s.itemsWithoutCost} item${s.itemsWithoutCost === 1 ? '' : 's'} had no cost price, so ${s.itemsWithoutCost === 1 ? 'it is' : 'they are'} counted in sales but not in profit.</p>`
        : '';

    const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:22px">
    <p style="margin:0;color:#64748b;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.04em">Daily summary · ${esc(ctx.dayLabel)}</p>
    <h1 style="margin:6px 0 16px;font-size:20px">${esc(where)}</h1>
    <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;border-top:1px solid #f1f5f9;color:#475569">${esc(k)}</td><td style="padding:8px 0;border-top:1px solid #f1f5f9;text-align:right;font-weight:bold">${esc(v)}</td></tr>`,
        )
        .join('')}
    </table>
    ${devices ? `<p style="margin:16px 0 4px;font-weight:bold;font-size:13px">Devices sold</p><ul style="margin:0;padding-left:18px;font-size:13px;color:#334155">${devices}</ul>` : ''}
    ${costNote}
    <p style="margin:20px 0 0"><a href="${esc(dashboard)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:10px">Open dashboard</a></p>
  </div>
  <p style="color:#94a3b8;font-size:11px;text-align:center;margin:14px 0 0">You get this because daily summaries are on for this store. The owner can switch them off in Settings.</p>
</div></body></html>`;

    const text = [
      `${where}: ${ctx.dayLabel}`,
      ...rows.map(([k, v]) => `${k}: ${v}`),
      ...(s.devicesSold.length ? ['', 'Devices sold:', ...s.devicesSold.map((d) => `- ${d.description} (${naira(d.price)})`)] : []),
      '',
      `Open dashboard: ${dashboard}`,
    ].join('\n');

    return { subject, html, text };
  }

  /** Plans that include the daily summary: every paid plan (Starter and above). */
  private planIncludesSummary(b: { plan?: string | null; subscriptionStatus?: string | null; trialEndsAt?: Date | null; subscriptionEndsAt?: Date | null }) {
    const plan = String(b.plan || '').toUpperCase();
    if (!plan || plan === 'FREE' || String(b.subscriptionStatus || '').toUpperCase() === 'FREE') return false;
    return this.subscriptions.evaluate(b).active;
  }

  /**
   * Called by the evening timer. Sends today's summary to every store that is due
   * and has not had one today. Safe to call more than once: each store is marked
   * as sent before its emails go out.
   */
  async runDue(now = new Date()) {
    const day = lagosDay(now);
    const businesses = await requestContext.outside(() =>
      this.prisma.business.findMany({
        where: {
          dailySummaryEnabled: true,
          dailySummaryHour: { lte: day.hour },
          OR: [{ lastDailySummaryOn: null }, { lastDailySummaryOn: { not: day.key } }],
        },
        select: {
          id: true,
          name: true,
          plan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          dailySummaryEmails: true,
        },
      }),
    );

    let stores = 0;
    let emails = 0;
    for (const b of businesses) {
      if (!this.planIncludesSummary(b)) continue;

      // Claim the store for today first, so a second run cannot send it twice.
      const claimed = await this.prisma.business.updateMany({
        where: { id: b.id, OR: [{ lastDailySummaryOn: null }, { lastDailySummaryOn: { not: day.key } }] },
        data: { lastDailySummaryOn: day.key },
      });
      if (claimed.count === 0) continue;

      try {
        emails += await this.sendForBusiness(b, day);
        stores += 1;
      } catch (err: any) {
        this.logger.error(`Daily summary failed for store ${b.id}: ${err?.message}`);
      }
    }

    this.logger.log(`Daily summary ${day.key}: ${stores} store(s), ${emails} email(s).`);
    return { day: day.key, stores, emails };
  }

  private async sendForBusiness(b: { id: string; name: string; dailySummaryEmails: string[] }, day: LagosDay) {
    const people = await requestContext.outside(() =>
      this.prisma.user.findMany({
        where: { businessId: b.id, isActive: true, storeRole: { in: ['OWNER', 'MANAGER'] } },
        select: { email: true, storeRole: true, branchId: true, branch: { select: { name: true } } },
      }),
    );

    let sent = 0;
    const done = new Set<string>();
    const send = async (to: string, summary: DaySummary, branchName?: string | null) => {
      const key = to.trim().toLowerCase();
      if (!key || done.has(key)) return;
      done.add(key);
      const { subject, html, text } = this.render(summary, { storeName: b.name, branchName, dayLabel: day.label });
      const res = await this.mail.dispatchEmail({ to: to.trim(), subject, html, text });
      if (res?.success) sent += 1;
    };

    // Owners and anyone the owner added get the whole store, with profit.
    const ownerEmails = [...people.filter((p) => p.storeRole === 'OWNER').map((p) => p.email), ...(b.dailySummaryEmails || [])];
    if (ownerEmails.length) {
      const full = await this.compute(b.id, day, { showProfit: true });
      for (const e of ownerEmails) await send(e, full);
    }

    // Managers get their branch (or the whole store if they cover every branch), without profit.
    const managers = people.filter((p) => p.storeRole === 'MANAGER');
    const cache = new Map<string, DaySummary>();
    for (const m of managers) {
      const k = m.branchId || '__all__';
      if (!cache.has(k)) cache.set(k, await this.compute(b.id, day, { branchId: m.branchId, showProfit: false }));
      await send(m.email, cache.get(k)!, m.branch?.name);
    }

    return sent;
  }

  // ---------------------------------------------------------------------------
  // Dashboard and settings
  // ---------------------------------------------------------------------------

  async today(user: { businessId: string; storeRole?: string | null; branchId?: string | null }) {
    const role = String(user.storeRole || 'OWNER').toUpperCase();
    const day = lagosDay();
    const summary = await this.compute(user.businessId, day, {
      branchId: role === 'OWNER' ? null : user.branchId || null,
      showProfit: role === 'OWNER' || role === 'MANAGER',
    });
    return { day: day.key, dayLabel: day.label, summary };
  }

  async getSettings(businessId: string) {
    const b = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        dailySummaryEnabled: true,
        dailySummaryEmails: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
      },
    });
    return {
      enabled: b?.dailySummaryEnabled ?? true,
      extraEmails: b?.dailySummaryEmails || [],
      includedInPlan: b ? this.planIncludesSummary(b) : false,
      sendTime: '9:00 pm',
    };
  }

  async updateSettings(businessId: string, dto: { enabled?: boolean; extraEmails?: string[] }) {
    const data: any = {};
    if (typeof dto.enabled === 'boolean') data.dailySummaryEnabled = dto.enabled;
    if (Array.isArray(dto.extraEmails)) {
      data.dailySummaryEmails = [...new Set(dto.extraEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))].slice(0, 5);
    }
    await this.prisma.business.update({ where: { id: businessId }, data });
    return this.getSettings(businessId);
  }
}
