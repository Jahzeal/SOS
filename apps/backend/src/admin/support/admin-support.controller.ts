import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminSupportService } from './admin-support.service';
import { TicketStatus } from '@prisma/client';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSupportController {
  constructor(private readonly supportService: AdminSupportService) {}

  @Get('tickets')
  async getTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.supportService.findAll({ status, priority, search });
  }

  @Get('tickets/:id')
  async getTicket(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.supportService.updateStatus(id, status);
  }
}
