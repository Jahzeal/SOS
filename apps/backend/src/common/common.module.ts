import { Global, Module } from '@nestjs/common';
import { RateLimitService } from './services/rate-limit.service';
import { DocumentNumberService } from './services/document-number.service';
import { SubscriptionService } from './services/subscription.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SubscriptionGuard } from './guards/subscription.guard';

@Global()
@Module({
  providers: [RateLimitService, DocumentNumberService, SubscriptionService, RateLimitGuard, SubscriptionGuard],
  exports: [RateLimitService, DocumentNumberService, SubscriptionService, RateLimitGuard, SubscriptionGuard],
})
export class CommonModule {}
