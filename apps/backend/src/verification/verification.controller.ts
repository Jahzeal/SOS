import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { VerificationService } from './verification.service';
import { RegisterPhoneDto } from './dto/phone-record.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('verification')
export class VerificationController {
  constructor(
    private verificationService: VerificationService,
    private jwt: JwtService,
  ) {}

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
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
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'public-verify', limit: 60, windowSeconds: 60 })
  @Get('public/:identifier')
  async publicVerify(@Req() req: any, @Param('identifier') identifier: string) {
    // Anonymous visitors get the owner's number masked. A signed-in store account
    // gets the full number so it can call the owner about a stolen device.
    let isSignedInAccount = false;
    const header: string = req.headers?.authorization || '';
    if (header.startsWith('Bearer ')) {
      try {
        const payload: any = this.jwt.verify(header.slice(7).trim());
        isSignedInAccount = !!payload?.sub && !payload?.type;
      } catch {
        isSignedInAccount = false;
      }
    }
    return this.verificationService.publicVerify(identifier, { revealContact: isSignedInAccount });
  }
}
