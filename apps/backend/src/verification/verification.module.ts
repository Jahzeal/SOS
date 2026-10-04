import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { DeviceLookupService } from '../phones/device-lookup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VerificationController],
  providers: [VerificationService, DeviceIntelligenceService, DeviceLookupService],
  exports: [VerificationService, DeviceIntelligenceService, DeviceLookupService],
})
export class VerificationModule {}
