import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MarketersService } from './marketers.service';
import { AdminMarketersController, MarketerJoinController, MarketerReferralsController } from './marketers.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminMarketersController, MarketerReferralsController, MarketerJoinController],
  providers: [MarketersService],
})
export class MarketersModule {}
