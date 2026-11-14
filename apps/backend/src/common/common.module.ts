import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RateLimitService } from './services/rate-limit.service';
import { DocumentNumberService } from './services/document-number.service';
import { SubscriptionService } from './services/subscription.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { StaffAccessService } from './staff/staff-access.service';
import { StoreRoleGuard } from './staff/store-role.guard';
import { RequestContextInterceptor } from './staff/request-context.interceptor';

@Global()
@Module({
  providers: [
    RateLimitService,
    DocumentNumberService,
    SubscriptionService,
    RateLimitGuard,
    SubscriptionGuard,
    StaffAccessService,
    StoreRoleGuard,
    // Every request: who is asking, which branch, and hiding costs from staff who may not see them.
    { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
  ],
  exports: [
    RateLimitService,
    DocumentNumberService,
    SubscriptionService,
    RateLimitGuard,
    SubscriptionGuard,
    StaffAccessService,
    StoreRoleGuard,
  ],
})
export class CommonModule {}
