import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminSubscriptionsService } from './admin-subscriptions.service';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: AdminSubscriptionsService) {}

  @Get()
  async getSubscriptions() {
    return this.subscriptionsService.getSubscriptionAnalytics();
  }

  @Patch(':businessId/plan')
  async changePlan(
    @Param('businessId') businessId: string,
    @Body('plan') plan: string,
  ) {
    return this.subscriptionsService.updateSubscriberPlan(businessId, plan);
  }
}

