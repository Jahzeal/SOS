import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { RegisterPhoneDto } from './dto/phone-record.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async registerPhone(@CurrentUser() user: any, @Body() dto: RegisterPhoneDto) {
    return this.verificationService.registerPhone(user.businessId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('phones')
  async getPhones(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.verificationService.getPhones(user.businessId, search);
  }

  @UseGuards(JwtAuthGuard)
  @Get('phones/:id')
  async getPhoneDetails(@CurrentUser() user: any, @Param('id') id: string) {
    return this.verificationService.getPhoneDetails(user.businessId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/imei')
  async searchByImei(@CurrentUser() user: any, @Query('imei') imei: string) {
    return this.verificationService.searchByImei(user.businessId, imei);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search/serial')
  async searchBySerial(@CurrentUser() user: any, @Query('serial') serial: string) {
    return this.verificationService.searchBySerial(user.businessId, serial);
  }

  // Public Endpoint — No Guard Required
  @Get('public/:identifier')
  async publicVerify(@Param('identifier') identifier: string) {
    return this.verificationService.publicVerify(identifier);
  }
}
