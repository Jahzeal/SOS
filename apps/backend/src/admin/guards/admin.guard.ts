import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Allow ADMIN role
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    throw new ForbiddenException('Access denied. Administrator privileges required.');
  }
}
