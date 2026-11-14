import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_LABELS, StoreRoleName } from './store-roles';

export const STORE_ROLES_KEY = 'storeRoles';

/**
 * Which store roles may use a route. The owner may always use everything.
 * Routes without this mark are open to every signed-in member of the store.
 */
export const StoreRoles = (...roles: StoreRoleName[]) => SetMetadata(STORE_ROLES_KEY, roles);

/** Roles that run the shop day to day. */
export const SELLERS: StoreRoleName[] = ['MANAGER', 'SALES'];
export const MANAGERS: StoreRoleName[] = ['MANAGER'];

/**
 * Checks the signed-in person's store role against the route's @StoreRoles list.
 * Use after JwtAuthGuard: @UseGuards(JwtAuthGuard, StoreRoleGuard, ...)
 */
@Injectable()
export class StoreRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<StoreRoleName[]>(STORE_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!allowed || allowed.length === 0) return true;

    const user = context.switchToHttp().getRequest().user;
    if (!user || user.role === 'ADMIN') return true;

    const role = (user.storeRole || 'OWNER') as StoreRoleName;
    if (role === 'OWNER' || allowed.includes(role)) return true;

    throw new ForbiddenException({
      statusCode: 403,
      code: 'ROLE_NOT_ALLOWED',
      message: `Your role (${ROLE_LABELS[role] || role}) cannot do this. Ask the store owner or a manager.`,
    });
  }
}
