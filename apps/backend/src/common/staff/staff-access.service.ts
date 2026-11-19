import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionService } from '../services/subscription.service';
import { assignableRolesForPlan, defaultLimits, StoreRoleName } from './store-roles';
import { requestContext } from './request-context';

export interface StoreLimits {
  planCode: string;
  planName: string;
  /** 0 = unlimited */
  maxStaff: number;
  /** 0 = unlimited */
  maxBranches: number;
  assignableRoles: StoreRoleName[];
}

/**
 * Staff seats, branch allowances and each store's main branch.
 *
 * Limits come from the store's plan. If a paid plan has run out, the store falls
 * back to Free limits: nobody is deleted, but extra staff are paused (cannot sign
 * in) until the owner renews. The owner is never paused.
 */
@Injectable()
export class StaffAccessService {
  private mainBranchCache = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  async limitsFor(businessId: string): Promise<StoreLimits> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        subscriptionPlan: { select: { code: true, name: true, maxStaff: true, maxBranches: true } },
      },
    });

    const active = business ? this.subscriptions.evaluate(business).active : false;
    const paidCode = String(business?.subscriptionPlan?.code || business?.plan || 'FREE').toUpperCase();
    const code = active ? paidCode : 'FREE';

    let row = active ? business?.subscriptionPlan : null;
    if (!row || String(row.code).toUpperCase() !== code) {
      row = await this.prisma.subscriptionPlan.findUnique({
        where: { code },
        select: { code: true, name: true, maxStaff: true, maxBranches: true },
      });
    }
    const fallback = defaultLimits(code);

    return {
      planCode: code,
      planName: row?.name || (code === 'FREE' ? 'Free' : code),
      maxStaff: row?.maxStaff ?? fallback.maxStaff,
      maxBranches: row?.maxBranches ?? fallback.maxBranches,
      assignableRoles: assignableRolesForPlan(code),
    };
  }

  /** The store's main branch, created on first use for stores made before branches existed. */
  async mainBranchId(businessId: string): Promise<string> {
    const cached = this.mainBranchCache.get(businessId);
    if (cached) return cached;

    let branch = await requestContext.outside(() =>
      this.prisma.branch.findFirst({ where: { businessId, isMain: true }, select: { id: true } }),
    );
    if (!branch) {
      branch = await this.prisma.branch
        .create({ data: { businessId, name: 'Main branch', isMain: true }, select: { id: true } })
        .catch(async () =>
          // Two requests at once: the other one created it.
          this.prisma.branch.findFirstOrThrow({ where: { businessId, isMain: true }, select: { id: true } }),
        );
    }
    this.mainBranchCache.set(businessId, branch.id);
    return branch.id;
  }

  /**
   * Throws if this staff member may not work right now: switched off by the owner,
   * or their seat or role is not covered by the store's current plan.
   */
  async assertCanWork(user: { id: string; businessId?: string | null; role?: string; storeRole?: string | null; isActive?: boolean | null; createdAt?: Date }) {
    if (user.role === 'ADMIN' || !user.businessId) return;

    if (user.isActive === false) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'STAFF_DISABLED',
        message: (user as any).business?.isMarketerStore
          ? 'Your marketer account has been switched off. Please contact NoxGuarda.'
          : 'Your account has been switched off by the store owner. Please contact them.',
      });
    }

    const role = (user.storeRole || 'OWNER') as StoreRoleName;
    if (role === 'OWNER') return;

    const limits = await this.limitsFor(user.businessId);
    const paused = () =>
      new ForbiddenException({
        statusCode: 403,
        code: 'STAFF_SEAT_PAUSED',
        message: `Your store's ${limits.planName} plan does not cover your account right now. Ask the store owner to upgrade the plan.`,
      });

    if (!limits.assignableRoles.includes(role)) throw paused();
    if (limits.maxStaff === 0) return;

    // Seats go to the earliest staff added; the owner always holds one seat.
    const staffSeats = Math.max(0, limits.maxStaff - 1);
    const earlier = await this.prisma.user.findMany({
      where: { businessId: user.businessId, isActive: true, storeRole: { not: 'OWNER' } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
      take: staffSeats,
    });
    if (!earlier.some((u) => u.id === user.id)) throw paused();
  }

  /** Active staff (owner included) plus invitations still waiting to be accepted. */
  async seatsInUse(businessId: string): Promise<number> {
    const [users, invites] = await Promise.all([
      this.prisma.user.count({ where: { businessId, isActive: true } }),
      this.prisma.staffInvite.count({ where: { businessId, acceptedAt: null, expiresAt: { gt: new Date() } } }),
    ]);
    return users + invites;
  }
}
