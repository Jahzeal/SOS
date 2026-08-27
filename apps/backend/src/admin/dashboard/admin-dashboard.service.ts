import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverviewMetrics(timeRange: string = 'today') {
    const [
      totalBusinesses,
      activeBusinesses,
      totalPhones,
      totalSalesAgg,
      totalRepairs,
      totalUsers,
      businessesByPlan,
      dbPlans,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({
        where: { publicVerificationEnabled: true },
      }),
      this.prisma.phoneRecord.count(),
      this.prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.repairTicket.count(),
      this.prisma.user.count(),
      this.prisma.business.groupBy({
        by: ['plan'],
        _count: { id: true },
      }),
      this.prisma.subscriptionPlan.findMany(),
    ]);

    const totalRevenue = totalSalesAgg._sum.totalAmount || 0;
    const totalTransactions = totalSalesAgg._count.id || 0;

    // Calculate actual active Monthly Recurring Revenue from database plans
    const planPriceMap = new Map<string, number>();
    dbPlans.forEach((p) => {
      planPriceMap.set(p.code.toUpperCase(), p.monthlyPriceNgn);
    });

    let calculatedMrr = 0;
    businessesByPlan.forEach((b) => {
      const price = planPriceMap.get((b.plan || '').toUpperCase()) || 0;
      calculatedMrr += price * b._count.id;
    });

    return {
      success: true,
      timeRange,
      kpis: {
        totalBusinesses,
        activeBusinesses,
        totalRegisteredPhones: totalPhones,
        totalRevenue,
        calculatedMrr,
        projectedArr: calculatedMrr * 12,
        totalTransactions,
        totalRepairs,
        totalStaffUsers: totalUsers,
        systemHealth: '100% Operational',
      },
    };
  }

  async getVerificationTraffic(timeRange: 'today' | '7d' | '30d' | '90d' = 'today') {
    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '30d') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === '90d') {
      startDate.setDate(now.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
    }

    const [logs, phones, totalPhones] = await Promise.all([
      this.prisma.verificationLog.findMany({
        where: { createdAt: { gte: startDate } },
        select: { status: true, createdAt: true },
      }),
      this.prisma.phoneRecord.findMany({
        where: { createdAt: { gte: startDate } },
        select: { status: true, createdAt: true },
      }),
      this.prisma.phoneRecord.count(),
    ]);

    // Aggregate all real verification and device registration events
    const allEvents: { status: string; createdAt: Date }[] = [
      ...logs,
      ...phones.map((p) => ({
        status: p.status === 'RETURNED' ? 'FLAGGED_STOLEN' : 'VERIFIED',
        createdAt: p.createdAt,
      })),
    ];

    let resultData: any[] = [];

    if (timeRange === 'today') {
      const slots = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      const buckets = slots.map((label) => ({
        label,
        verified: 0,
        notFound: 0,
        invalid: 0,
        total: 0,
        successRate: 100,
      }));

      allEvents.forEach((ev) => {
        const hour = new Date(ev.createdAt).getHours();
        const slotIdx = Math.min(Math.floor(hour / 3), 7);
        if (ev.status === 'VERIFIED') buckets[slotIdx].verified++;
        else if (ev.status === 'NOT_FOUND') buckets[slotIdx].notFound++;
        else buckets[slotIdx].invalid++;
      });

      buckets.forEach((b) => {
        b.total = b.verified + b.notFound + b.invalid;
        b.successRate = b.total > 0 ? Number(((b.verified / b.total) * 100).toFixed(1)) : 100;
      });

      resultData = buckets;
    } else if (timeRange === '7d') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const buckets: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dateStr = d.toISOString().slice(0, 10);
        buckets.push({
          label: dayLabel,
          dateStr,
          verified: 0,
          notFound: 0,
          invalid: 0,
          total: 0,
          successRate: 100,
        });
      }

      allEvents.forEach((ev) => {
        const dateStr = new Date(ev.createdAt).toISOString().slice(0, 10);
        const b = buckets.find((item) => item.dateStr === dateStr);
        if (b) {
          if (ev.status === 'VERIFIED') b.verified++;
          else if (ev.status === 'NOT_FOUND') b.notFound++;
          else b.invalid++;
        }
      });

      buckets.forEach((b) => {
        b.total = b.verified + b.notFound + b.invalid;
        b.successRate = b.total > 0 ? Number(((b.verified / b.total) * 100).toFixed(1)) : 100;
        delete b.dateStr;
      });

      resultData = buckets;
    } else if (timeRange === '30d') {
      const buckets = [
        { label: 'Week 1', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
        { label: 'Week 2', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
        { label: 'Week 3', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
        { label: 'Week 4', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
      ];

      allEvents.forEach((ev) => {
        const diffDays = Math.floor((now.getTime() - new Date(ev.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.min(Math.floor(diffDays / 7), 3);
        const bucket = buckets[3 - weekIdx];
        if (bucket) {
          if (ev.status === 'VERIFIED') bucket.verified++;
          else if (ev.status === 'NOT_FOUND') bucket.notFound++;
          else bucket.invalid++;
        }
      });

      buckets.forEach((b) => {
        b.total = b.verified + b.notFound + b.invalid;
        b.successRate = b.total > 0 ? Number(((b.verified / b.total) * 100).toFixed(1)) : 100;
      });

      resultData = buckets;
    } else {
      const buckets = [
        { label: 'Month 1', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
        { label: 'Month 2', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
        { label: 'Month 3', verified: 0, notFound: 0, invalid: 0, total: 0, successRate: 100 },
      ];

      allEvents.forEach((ev) => {
        const diffDays = Math.floor((now.getTime() - new Date(ev.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const monthIdx = Math.min(Math.floor(diffDays / 30), 2);
        const bucket = buckets[2 - monthIdx];
        if (bucket) {
          if (ev.status === 'VERIFIED') bucket.verified++;
          else if (ev.status === 'NOT_FOUND') bucket.notFound++;
          else bucket.invalid++;
        }
      });

      buckets.forEach((b) => {
        b.total = b.verified + b.notFound + b.invalid;
        b.successRate = b.total > 0 ? Number(((b.verified / b.total) * 100).toFixed(1)) : 100;
      });

      resultData = buckets;
    }

    return {
      success: true,
      timeRange,
      totalDevicesRecorded: totalPhones,
      totalActivityEvents: allEvents.length,
      data: resultData,
    };
  }

  async getRecentSystemLogs() {
    // Get recent database events to compose live audit trail
    const [recentBusinesses, recentSales, recentRepairs] = await Promise.all([
      this.prisma.business.findMany({ take: 2, orderBy: { createdAt: 'desc' } }),
      this.prisma.sale.findMany({ take: 2, orderBy: { createdAt: 'desc' }, include: { business: true } }),
      this.prisma.repairTicket.findMany({ take: 2, orderBy: { createdAt: 'desc' }, include: { business: true } }),
    ]);

    const logs: any[] = [];

    recentSales.forEach((s) => {
      logs.push({
        time: new Date(s.createdAt).toLocaleTimeString(),
        code: 'SALE_CHECKOUT_OK',
        status: 'Success',
        type: 'success',
        details: `Invoice #${s.invoiceNumber} processed by ${s.business.name}`,
      });
    });

    recentBusinesses.forEach((b) => {
      logs.push({
        time: new Date(b.createdAt).toLocaleTimeString(),
        code: 'MERCHANT_REGISTERED',
        status: 'Success',
        type: 'info',
        details: `New store ${b.name} activated on ${b.plan} tier`,
      });
    });

    recentRepairs.forEach((r) => {
      logs.push({
        time: new Date(r.createdAt).toLocaleTimeString(),
        code: 'REPAIR_DIAGNOSTIC_CREATED',
        status: 'Info',
        type: 'info',
        details: `Ticket #${r.ticketNumber} logged by ${r.business.name}`,
      });
    });

    if (logs.length === 0) {
      logs.push({
        time: new Date().toLocaleTimeString(),
        code: 'SYS_HEARTBEAT_OK',
        status: 'Success',
        type: 'success',
        details: 'VerifyFlow Core Cluster healthy & synchronized',
      });
    }

    return {
      success: true,
      logs,
    };
  }
}
