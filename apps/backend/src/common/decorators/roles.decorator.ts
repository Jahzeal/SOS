import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PLAN_KEY = 'requiredPlan';
export const RequirePlan = (...plans: string[]) => SetMetadata(PLAN_KEY, plans);
