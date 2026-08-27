import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscriptionAnalytics() {
    const [businesses, dbPlans] = await Promise.all([
      this.prisma.business.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          email: true,
          phone: true,
          publicVerificationEnabled: true,
          createdAt: true,
          updatedAt: true,
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
      const planCode = (b.plan || 'STARTER').toUpperCase();
      const planConfig = planMap.get(planCode) || {
        name: planCode,
        monthlyPriceNgn: 15000,
        maxStaffAccounts: 2,
        maxMonthlyLookups: 500,
      };

      const monthlyFee = planConfig.monthlyPriceNgn || 0;
      tierCounts[planCode.toLowerCase()] = (tierCounts[planCode.toLowerCase()] || 0) + 1;
      totalMRR += monthlyFee;

      return {
        id: b.id,
        businessName: b.name,
        slug: b.slug,
        plan: planCode,
        planDisplayName: planConfig.name,
        price: monthlyFee,
        currency: 'NGN',
        status: b.publicVerificationEnabled ? 'Active' : 'Suspended',
        memberSince: b.createdAt,
        updatedAt: b.updatedAt,
        limits: {
          maxStaff: planConfig.maxStaffAccounts || 1,
          maxLookups: planConfig.maxMonthlyLookups || 500,
        },
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

