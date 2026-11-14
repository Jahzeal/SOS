import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreRoleGuard, StoreRoles, SELLERS, MANAGERS } from '../common/staff/store-role.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, StoreRoleGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Request() req) {
    const businessId = req.user.businessId;
    return this.dashboardService.getSummary(businessId);
  }

  @StoreRoles(...MANAGERS)
  @Get('reports')
  async getReports(@Request() req, @Query('range') range?: string) {
    const businessId = req.user.businessId;
    return this.dashboardService.getReports(businessId, range);
  }

  @Get('notifications')
  async getNotifications(@Request() req) {
    const businessId = req.user.businessId;
    return this.dashboardService.getNotifications(businessId);
  }
}
