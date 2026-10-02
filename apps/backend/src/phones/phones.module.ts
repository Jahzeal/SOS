import { Module } from '@nestjs/common';
import { PhonesService } from './phones.service';
import { PhonesController } from './phones.controller';
import { DeviceLookupService } from './device-lookup.service';

@Module({
  controllers: [PhonesController],
  providers: [PhonesService, DeviceLookupService],
  exports: [PhonesService, DeviceLookupService],
})
export class PhonesModule {}
