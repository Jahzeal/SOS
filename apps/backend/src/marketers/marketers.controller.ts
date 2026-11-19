import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { StoreRoleGuard, StoreRoles } from '../common/staff/store-role.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { MarketersService } from './marketers.service';
import { AcceptMarketerInviteDto, AddReferralDto, CreateMarketerDto, SetMarketerActiveDto } from './marketers.dto';

/** Admin → Marketers. */
@Controller('admin/marketers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminMarketersController {
  constructor(private readonly marketers: MarketersService) {}

  @Get()
  list() {
    return this.marketers.list();
  }

  @Post()
  create(@Body() dto: CreateMarketerDto) {
    return this.marketers.create(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.marketers.detail(id);
  }

  @Post(':id/resend')
  resend(@Param('id') id: string) {
    return this.marketers.resendInvite(id);
  }

  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() dto: SetMarketerActiveDto) {
    return this.marketers.setActive(id, dto.active);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketers.deleteMarketer(id);
  }

  @Delete(':id/referrals/:referralId')
  removeReferral(@Param('id') id: string, @Param('referralId') referralId: string) {
    return this.marketers.adminRemoveReferral(id, referralId);
  }
}

/** The marketer's "Onboarded Businesses" tab, inside their own store. Owner only. */
@Controller('marketer/businesses')
@UseGuards(JwtAuthGuard, StoreRoleGuard)
@StoreRoles('OWNER')
export class MarketerReferralsController {
  constructor(private readonly marketers: MarketersService) {}

  @Get()
  list(@Request() req) {
    return this.marketers.myReferrals(req.user.businessId);
  }

  @Post()
  add(@Request() req, @Body() dto: AddReferralDto) {
    return this.marketers.addReferral(req.user.businessId, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.marketers.removeReferral(req.user.businessId, id);
  }
}

/** Public: the link a new marketer opens to choose a password. */
@Controller('marketer-join')
@UseGuards(RateLimitGuard)
export class MarketerJoinController {
  constructor(private readonly marketers: MarketersService) {}

  @Get(':token')
  @RateLimit({ name: 'marketer-join-view', limit: 30, windowSeconds: 15 * 60 })
  describe(@Param('token') token: string) {
    return this.marketers.describeInvite(token);
  }

  @Post()
  @RateLimit({ name: 'marketer-join-accept', limit: 10, windowSeconds: 15 * 60 })
  accept(@Body() dto: AcceptMarketerInviteDto) {
    return this.marketers.acceptInvite(dto);
  }
}
