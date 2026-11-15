import { Controller, Get, Put, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { BusinessService } from './business.service';
import { UpdateBusinessSettingsDto, UpdateTemplateSettingsDto, UpdatePlanDto, DeleteAccountDto } from './dto/business.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StoreRoleGuard, StoreRoles, SELLERS, MANAGERS } from '../common/staff/store-role.guard';

@Controller('business')
@UseGuards(JwtAuthGuard, StoreRoleGuard)
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.businessService.getBusinessProfile(user.businessId);
  }

  @StoreRoles(...MANAGERS)
  @Put('settings')
  async updateSettings(@CurrentUser() user: any, @Body() body: UpdateBusinessSettingsDto) {
    return this.businessService.updateBusinessProfile(user.businessId, body);
  }

  @StoreRoles('OWNER')
  @Put('plan')
  async updatePlan(@CurrentUser() user: any, @Body() body: UpdatePlanDto) {
    return this.businessService.updatePlan(user.businessId, body.plan);
  }

  @Get('templates')
  async getTemplates(@CurrentUser() user: any) {
    return this.businessService.getTemplateSettings(user.businessId);
  }

  @StoreRoles(...MANAGERS)
  @Put('templates')
  async updateTemplates(@CurrentUser() user: any, @Body() body: UpdateTemplateSettingsDto) {
    return this.businessService.updateTemplateSettings(user.businessId, body);
  }

  @StoreRoles('OWNER')
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: any, @Body() body: DeleteAccountDto) {
    return this.businessService.deleteAccount(user.businessId, user.id, body.password);
  }
}
