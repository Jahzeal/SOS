import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('metrics')
  async getMetrics(@Query('timeRange') timeRange?: string) {
    return this.dashboardService.getOverviewMetrics(timeRange);
  }

  @Get('chart')
  async getChart(@Query('timeRange') timeRange?: 'today' | '7d' | '30d' | '90d') {
    return this.dashboardService.getVerificationTraffic(timeRange);
  }

  @Get('logs')
  async getLogs() {
    return this.dashboardService.getRecentSystemLogs();
  }
}
