import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { DeviceLookupService } from './device-lookup.service';
import { LookupDeviceDto } from './dto/lookup-device.dto';
import { NormalizedLookupResponse } from './interfaces/device-lookup-provider.interface';

@Controller('devices')
@UseGuards(RateLimitGuard)
@RateLimit({ name: 'device-lookup', limit: 30, windowSeconds: 60 })
export class DeviceLookupController {
  constructor(private readonly lookupService: DeviceLookupService) {}

  @Post('lookup')
  async lookupDevice(@Body() dto: LookupDeviceDto): Promise<NormalizedLookupResponse> {
    return this.lookupService.identifyDevice({
      identifier: dto.identifier,
      deviceType: dto.deviceType,
      identifierType: dto.identifierType,
      productNumber: dto.productNumber,
      brandHint: dto.brandHint,
    });
  }

  @Get('lookup')
  async lookupDeviceGet(
    @Query('identifier') identifier: string,
    @Query('deviceType') deviceType?: any,
    @Query('identifierType') identifierType?: any,
    @Query('productNumber') productNumber?: string,
    @Query('brandHint') brandHint?: string,
  ): Promise<NormalizedLookupResponse> {
    return this.lookupService.identifyDevice({
      identifier,
      deviceType,
      identifierType,
      productNumber,
      brandHint,
    });
  }
}
