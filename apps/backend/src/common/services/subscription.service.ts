import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SubscriptionState {
  /** May the store create or change records right now? */
  active: boolean;
  reason?: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED';
}

/**
 * The server-side source of truth for "is this store allowed to work".
 * The same rules used to live only in the browser, where they could be skipped.
 */
@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  evaluate(business: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    trialEndsAt?: Date | string | null;
    subscriptionEndsAt?: Date | string | null;
  }): SubscriptionState {
    const plan = String(business.plan || '').toUpperCase();
    const status = String(business.subscriptionStatus || '').toUpperCase();
    const now = Date.now();

    if (plan === 'FREE' || status === 'FREE') {
      return { active: true };
    }

    if (status === 'ACTIVE') {
      const endsAt = business.subscriptionEndsAt ? new Date(business.subscriptionEndsAt).getTime() : null;
      if (endsAt !== null && !Number.isNaN(endsAt) && endsAt <= now) {
        return { active: false, reason: 'SUBSCRIPTION_EXPIRED' };
      }
      return { active: true };
    }

    if (status === 'EXPIRED' || status === 'PAST_DUE') {
      return { active: false, reason: 'SUBSCRIPTION_EXPIRED' };
    }

    if (status === 'TRIAL') {
      const trialEndsAt = business.trialEndsAt ? new Date(business.trialEndsAt).getTime() : null;
      if (trialEndsAt !== null && !Number.isNaN(trialEndsAt) && trialEndsAt <= now) {
        return { active: false, reason: 'TRIAL_EXPIRED' };
      }
    }

    return { active: true };
  }

  /** Throws 402 when the store's trial or paid period has run out. */
  assertActive(business: Parameters<SubscriptionService['evaluate']>[0]) {
    const state = this.evaluate(business);
    if (state.active) return;

    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: state.reason,
        message:
          state.reason === 'TRIAL_EXPIRED'
            ? 'Your free trial has ended. Choose a plan to continue.'
            : 'Your subscription has expired. Renew your plan to continue.',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  /**
   * A paid period that has run out is written back as EXPIRED so the dashboard
   * shows the renewal screen instead of failing silently.
   */
  async syncExpiredStatus(business: {
    id: string;
    plan?: string | null;
    subscriptionStatus?: string | null;
    trialEndsAt?: Date | null;
    subscriptionEndsAt?: Date | null;
  }): Promise<string | null> {
    const state = this.evaluate(business);
    const status = String(business.subscriptionStatus || '').toUpperCase();
    if (!state.active && status === 'ACTIVE') {
      await this.prisma.business.update({
        where: { id: business.id },
        data: { subscriptionStatus: 'EXPIRED' },
      });
      return 'EXPIRED';
    }
    return null;
  }

  /** Enforces the plan's device allowance when adding a device to inventory. */
  async assertCanAddDevice(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: true, planId: true },
    });
    if (!business) return;

    const planCode = String(business.plan || '').toUpperCase();
    const plan =
      (business.planId
        ? await this.prisma.subscriptionPlan.findUnique({ where: { id: business.planId } })
        : null) || (planCode ? await this.prisma.subscriptionPlan.findUnique({ where: { code: planCode } }) : null);

    // No plan row: the free tier still gets a cap, anything else is not limited here.
    const maxDevices = plan ? plan.maxDevices : planCode === 'FREE' ? 10 : 0;
    if (!maxDevices || maxDevices <= 0) return; // 0 = unlimited

    const used = await this.prisma.phoneRecord.count({ where: { businessId } });
    if (used >= maxDevices) {
      throw new ForbiddenException(
        `Your ${plan?.name || planCode} plan allows up to ${maxDevices.toLocaleString()} devices and you have reached that limit. Upgrade your plan to register more.`,
      );
    }
  }
}
