import { Controller, Get, Patch, Delete, Param, Query, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminNotificationsService } from './admin-notifications.service';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: AdminNotificationsService) {}

  @Get()
  async getAll(
    @Query('category') category?: string,
    @Query('status') status?: 'all' | 'unread' | 'read',
    @Query('search') search?: string,
  ) {
    return this.notificationsService.findAll({ category, status, search });
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('mark-all-read')
  async markAllRead() {
    return this.notificationsService.markAllAsRead();
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
