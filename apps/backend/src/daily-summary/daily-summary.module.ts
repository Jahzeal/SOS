import { Module } from '@nestjs/common';
import { DailySummaryController, DailySummaryCronController } from './daily-summary.controller';
import { DailySummaryService } from './daily-summary.service';

@Module({
  controllers: [DailySummaryController, DailySummaryCronController],
  providers: [DailySummaryService],
  exports: [DailySummaryService],
})
export class DailySummaryModule {}
