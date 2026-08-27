import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscriptionAnalytics() {
    const [businesses, dbPlans] = await Promise.all([
      this.prisma.business.findMany({
        include: {
          subscriptionPlan: true,
          _count: {
            select: {
              users: true,
              phoneRecords: true,
              sales: true,
              repairs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscriptionPlan.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Create a plan lookup map
    const planMap = new Map<string, any>();
    const tierCounts: Record<string, number> = {};
    const tierPricing: Record<string, number> = {};

    dbPlans.forEach((p) => {
      planMap.set(p.code.toUpperCase(), p);
      tierCounts[p.code.toLowerCase()] = 0;
      tierPricing[p.code.toUpperCase()] = p.monthlyPriceNgn;
    });

    let totalMRR = 0;

    const subscribers = businesses.map((b) => {
      const plan = b.subscriptionPlan || planMap.get((b.plan || '').toUpperCase());
      const planCode = plan?.code || b.plan;
      const planName = plan?.name || b.plan;
      const isPaidActive = b.subscriptionStatus === 'ACTIVE';
      const monthlyFee = (isPaidActive && plan) ? plan.monthlyPriceNgn : 0;

      if (planCode) {
        tierCounts[planCode.toLowerCase()] = (tierCounts[planCode.toLowerCase()] || 0) + 1;
      }
      totalMRR += monthlyFee;

      return {
        id: b.id,
        name: b.name,
        businessName: b.name,
        slug: b.slug,
        plan: planCode,
        planDisplayName: planName,
        monthlyPrice: monthlyFee,
        currency: 'NGN',
        status: b.subscriptionStatus || 'TRIAL',
        subscriptionStatus: b.subscriptionStatus || 'TRIAL',
        trialEndsAt: b.trialEndsAt,
        publicVerificationEnabled: b.publicVerificationEnabled,
        memberSince: b.createdAt,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        maxDevices: plan?.maxDevices || 0,
        phoneRecordsCount: b._count.phoneRecords,
        usage: {
          registeredDevices: b._count.phoneRecords,
          staffCount: b._count.users,
          salesCount: b._count.sales,
          repairsCount: b._count.repairs,
        },
      };
    });

    const totalSubscribers = businesses.length;
    const arpu = totalSubscribers > 0 ? Math.round(totalMRR / totalSubscribers) : 0;

    return {
      success: true,
      summary: {
        totalSubscribers,
        activeMRR: totalMRR,
        projectedARR: totalMRR * 12,
        averageRevenuePerUser: arpu,
        tierCounts,
        tierPricing,
      },
      data: subscribers,
      plans: dbPlans,
    };
  }

  async updateSubscriberPlan(businessId: string, newPlan: string) {
    const cleanPlan = (newPlan || 'STARTER').toUpperCase();
    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: { plan: cleanPlan },
      select: {
        id: true,
        name: true,
        plan: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: `Successfully updated ${updated.name} to ${updated.plan}`,
      data: updated,
    };
  }
}

