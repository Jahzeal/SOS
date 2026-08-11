import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.businessService.getBusinessProfile(user.businessId);
  }

  @Put('settings')
  async updateSettings(@CurrentUser() user: any, @Body() body: any) {
    return this.businessService.updateBusinessProfile(user.businessId, body);
  }

  @Put('plan')
  async updatePlan(@CurrentUser() user: any, @Body('plan') plan: any) {
    return this.businessService.updatePlan(user.businessId, plan);
  }

  @Get('templates')
  async getTemplates(@CurrentUser() user: any) {
    return this.businessService.getTemplateSettings(user.businessId);
  }

  @Put('templates')
  async updateTemplates(@CurrentUser() user: any, @Body() body: any) {
    return this.businessService.updateTemplateSettings(user.businessId, body);
  }
}
