import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { Plan } from '@prisma/client';
import { PLAN_KEY } from '../decorators/roles.decorator';

const PLAN_HIERARCHY: Record<Plan, number> = {
  STARTER: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<Plan[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlans || requiredPlans.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.business) {
      throw new ForbiddenException('User context missing or invalid business');
    }

    const userPlan = user.business.plan as Plan;
    const userLevel = PLAN_HIERARCHY[userPlan] || 1;

    const hasAccess = requiredPlans.some(
      (plan) => userLevel >= (PLAN_HIERARCHY[plan] || 1),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `This feature requires a higher plan tier (${requiredPlans.join(' or ')}). Your current plan is ${userPlan}.`,
      );
    }

    return true;
  }
}
