import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { PLAN_CONFIGS, getPlanPrice } from '../../common/constants/plans.constant';

@Injectable()
export class AdminSubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscriptionAnalytics() {
    const businesses = await this.prisma.business.findMany({
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
    });

    const tierCounts: Record<Plan, number> = {
      [Plan.STARTER]: 0,
      [Plan.BUSINESS]: 0,
      [Plan.ENTERPRISE]: 0,
    };

    let totalMRR = 0;

    const subscribers = businesses.map((b) => {
      const planCode = b.plan in PLAN_CONFIGS ? b.plan : Plan.STARTER;
      const planConfig = PLAN_CONFIGS[planCode];
      const monthlyFee = planConfig.monthlyPriceNgn;

      tierCounts[planCode] = (tierCounts[planCode] || 0) + 1;
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
          maxStaff: planConfig.maxStaffAccounts,
          maxLookups: planConfig.maxMonthlyLookups,
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
        tierCounts: {
          starter: tierCounts[Plan.STARTER],
          business: tierCounts[Plan.BUSINESS],
          enterprise: tierCounts[Plan.ENTERPRISE],
        },
        tierPricing: {
          [Plan.STARTER]: PLAN_CONFIGS[Plan.STARTER].monthlyPriceNgn,
          [Plan.BUSINESS]: PLAN_CONFIGS[Plan.BUSINESS].monthlyPriceNgn,
          [Plan.ENTERPRISE]: PLAN_CONFIGS[Plan.ENTERPRISE].monthlyPriceNgn,
        },
      },
      data: subscribers,
    };
  }

  async updateSubscriberPlan(businessId: string, newPlan: Plan) {
    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: { plan: newPlan },
      select: {
        id: true,
        name: true,
        plan: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: `Successfully updated ${updated.name} to ${PLAN_CONFIGS[newPlan]?.name || newPlan}`,
      data: {
        ...updated,
        planConfig: PLAN_CONFIGS[newPlan],
      },
    };
  }
}
