import { Module } from '@nestjs/common';
import { TheftReportsService } from './theft-reports.service';
import { TheftReportsController } from './theft-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReporterGuard } from './reporter.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TheftReportsController],
  providers: [TheftReportsService, ReporterGuard],
  exports: [TheftReportsService],
})
export class TheftReportsModule {}
