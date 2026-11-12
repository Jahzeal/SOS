import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TheftReportsService } from './theft-reports.service';
import {
  CreateTheftReportDto,
  ResolveTheftReportDto,
  ReporterSessionDto,
} from './dto/create-theft-report.dto';
import { AuthService } from '../auth/auth.service';
import { ReporterGuard, VerifiedReporter } from './reporter.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('theft-reports')
export class TheftReportsController {
  constructor(
    private readonly theftReportsService: TheftReportsService,
    private readonly authService: AuthService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Exchanges a Google ID token (verified with Google on the server) for a
   * reporter session. This is what proves who owns a report.
   */
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'theft-session', limit: 20, windowSeconds: 15 * 60 })
  @Post('session')
  async createSession(@Body() dto: ReporterSessionDto) {
    const profile = await this.authService.verifyGoogleCredential(dto.credential);
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Device Owner';

    const token = this.jwt.sign(
      { type: 'reporter', email: profile.email, name },
      { expiresIn: '30d' },
    );

    return {
      token,
      email: profile.email,
      name,
      avatarUrl: profile.picture || null,
    };
  }

  @UseGuards(RateLimitGuard, ReporterGuard)
  @RateLimit({ name: 'theft-report', limit: 10, windowSeconds: 60 * 60 })
  @Post('public-report')
  async createReport(@Req() req: any, @Body() dto: CreateTheftReportDto) {
    return this.theftReportsService.createReport(dto, req.reporter as VerifiedReporter);
  }

  @UseGuards(ReporterGuard)
  @Post('resolve/:id')
  async resolveReport(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveTheftReportDto) {
    return this.theftReportsService.resolveReport(id, req.reporter as VerifiedReporter, dto?.resolvedNote);
  }

  /** Lists only the signed-in reporter's own reports. */
  @UseGuards(ReporterGuard)
  @Get('user-reports')
  async getUserReports(@Req() req: any) {
    return this.theftReportsService.getUserReports((req.reporter as VerifiedReporter).email);
  }

  /** Public lookup: says whether a device is reported, without exposing the owner. */
  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'theft-check', limit: 60, windowSeconds: 60 })
  @Get('check/:identifier')
  async checkReport(@Param('identifier') identifier: string) {
    const report = await this.theftReportsService.findActiveReportByIdentifier(identifier);
    if (!report) {
      return { isStolen: false, report: null };
    }
    return { isStolen: true, report: this.theftReportsService.toPublicReport(report) };
  }
}
