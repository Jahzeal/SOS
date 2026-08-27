import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminSettingsService, AdminPlatformSettingsDto } from './admin-settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  async updateSettings(@Body() body: Partial<AdminPlatformSettingsDto>) {
    return this.settingsService.updateSettings(body);
  }
}
