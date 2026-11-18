import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Put,
  Request,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreRoleGuard, StoreRoles, MANAGERS } from '../common/staff/store-role.guard';
import { DailySummaryService } from './daily-summary.service';

export class UpdateDailySummaryDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(5)
  @IsEmail({}, { each: true })
  extraEmails?: string[];
}

/** Today's numbers for the dashboard card, and the summary email settings. */
@Controller('daily-summary')
@UseGuards(JwtAuthGuard, StoreRoleGuard)
@StoreRoles(...MANAGERS)
export class DailySummaryController {
  constructor(private readonly summary: DailySummaryService) {}

  /** Everyone in the store sees today's numbers; what they see depends on their role. */
  @Get('today')
  @StoreRoles('MANAGER', 'SALES', 'TECHNICIAN')
  today(@Request() req) {
    return this.summary.today(req.user);
  }

  @Get('settings')
  getSettings(@Request() req) {
    return this.summary.getSettings(req.user.businessId);
  }

  @Put('settings')
  updateSettings(@Request() req, @Body() dto: UpdateDailySummaryDto) {
    return this.summary.updateSettings(req.user.businessId, dto);
  }
}

/**
 * Called by the scheduler every evening (Vercel Cron sends "Authorization: Bearer <CRON_SECRET>").
 * Without CRON_SECRET set on the server it refuses to run.
 */
@Controller('cron')
export class DailySummaryCronController {
  constructor(private readonly summary: DailySummaryService) {}

  @Get('daily-summary')
  run(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new ServiceUnavailableException('CRON_SECRET is not set on the server.');
    const expected = Buffer.from(`Bearer ${secret}`);
    const given = Buffer.from(String(authorization || ''));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new ForbiddenException();
    }
    return this.summary.runDue();
  }
}
