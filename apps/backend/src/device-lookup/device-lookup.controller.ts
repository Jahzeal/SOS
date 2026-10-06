import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { DeviceLookupService } from './device-lookup.service';
import { LookupDeviceDto } from './dto/lookup-device.dto';
import { NormalizedLookupResponse } from './interfaces/device-lookup-provider.interface';

@Controller('devices')
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
