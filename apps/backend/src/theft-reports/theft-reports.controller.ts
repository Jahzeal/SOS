import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { TheftReportsService } from './theft-reports.service';
import { CreateTheftReportDto, ResolveTheftReportDto } from './dto/create-theft-report.dto';

@Controller('theft-reports')
export class TheftReportsController {
  constructor(private readonly theftReportsService: TheftReportsService) {}

  @Post('public-report')
  async createReport(@Body() dto: CreateTheftReportDto) {
    return this.theftReportsService.createReport(dto);
  }

  @Post('resolve/:id')
  async resolveReport(@Param('id') id: string, @Body() dto: ResolveTheftReportDto) {
    return this.theftReportsService.resolveReport(id, dto);
  }

  @Get('user-reports')
  async getUserReports(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email query parameter is required');
    }
    return this.theftReportsService.getUserReports(email);
  }

  @Get('check/:identifier')
  async checkReport(@Param('identifier') identifier: string) {
    const report = await this.theftReportsService.findActiveReportByIdentifier(identifier);
    if (!report) {
      return { isStolen: false, report: null };
    }
    return { isStolen: true, report };
  }
}
