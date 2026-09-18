import { Module } from '@nestjs/common';
import { TheftReportsService } from './theft-reports.service';
import { TheftReportsController } from './theft-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TheftReportsController],
  providers: [TheftReportsService],
  exports: [TheftReportsService],
})
export class TheftReportsModule {}
