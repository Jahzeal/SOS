import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { DeviceIntelligenceService } from './device-intelligence.service';
import { DeviceLookupService } from '../phones/device-lookup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TacSuggestionService } from '../device-lookup/tac-suggestion.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VerificationController],
  providers: [VerificationService, DeviceIntelligenceService, DeviceLookupService, TacSuggestionService],
  exports: [VerificationService, DeviceIntelligenceService, DeviceLookupService],
})
export class VerificationModule {}
