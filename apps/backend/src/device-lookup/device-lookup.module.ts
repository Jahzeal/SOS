import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeviceLookupService } from './device-lookup.service';
import { DeviceLookupController } from './device-lookup.controller';
import { HPProvider } from './providers/hp.provider';
import { LenovoProvider } from './providers/lenovo.provider';
import { DellProvider } from './providers/dell.provider';
import { AppleProvider } from './providers/apple.provider';
import { ImeiProvider } from './providers/imei.provider';

@Module({
  imports: [ConfigModule],
  controllers: [DeviceLookupController],
  providers: [
    DeviceLookupService,
    HPProvider,
    LenovoProvider,
    DellProvider,
    AppleProvider,
    ImeiProvider,
  ],
  exports: [DeviceLookupService],
})
export class DeviceLookupModule {}
