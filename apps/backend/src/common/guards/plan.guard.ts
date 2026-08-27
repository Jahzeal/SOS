import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from '../decorators/roles.decorator';

const PLAN_HIERARCHY: Record<string, number> = {
  STARTER: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<string[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Admin role has unrestricted platform access
    if (user.role === 'ADMIN') {
      return true;
    }

    if (!user.business) {
      return true;
    }

    const userPlan = (user.business?.plan || 'STARTER').toUpperCase();
    const userLevel = PLAN_HIERARCHY[userPlan] || 1;

    const hasAccess = requiredPlans.some(
      (plan) => userLevel >= (PLAN_HIERARCHY[plan.toUpperCase()] || 1),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `Your store plan does not have access to this feature. Please upgrade your workspace.`,
      );
    }

    return true;
  }
}
