import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VerificationController],
  providers: [VerificationService, DeviceIntelligenceService],
  exports: [VerificationService, DeviceIntelligenceService],
})
export class VerificationModule {}

