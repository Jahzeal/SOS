import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Blocks creating or changing records once a store's trial or paid period has
 * ended. Reading existing data stays available so nobody loses access to their
 * records, and the billing endpoints are not covered so they can still pay.
 *
 * Use after JwtAuthGuard: @UseGuards(JwtAuthGuard, SubscriptionGuard)
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptions: SubscriptionService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (READ_METHODS.has(String(req.method).toUpperCase())) return true;

    const user = req.user;
    if (!user || user.role === 'ADMIN' || !user.business) return true;

    this.subscriptions.assertActive(user.business);
    return true;
  }
}
