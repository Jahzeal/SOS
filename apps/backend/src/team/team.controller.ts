import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { StoreRoleGuard, StoreRoles, MANAGERS } from '../common/staff/store-role.guard';
import { TeamService } from './team.service';
import { AcceptInviteDto, BranchDto, InviteStaffDto, UpdateBranchDto, UpdateMemberDto } from './team.dto';

/** Staff accounts: owners and managers. */
@Controller('team')
@UseGuards(JwtAuthGuard, StoreRoleGuard, SubscriptionGuard)
@StoreRoles(...MANAGERS)
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  overview(@Request() req) {
    return this.team.overview(req.user);
  }

  @Post('invites')
  invite(@Request() req, @Body() dto: InviteStaffDto) {
    return this.team.invite(req.user, dto);
  }

  @Delete('invites/:id')
  revoke(@Request() req, @Param('id') id: string) {
    return this.team.revokeInvite(req.user, id);
  }

  @Patch('members/:id')
  updateMember(@Request() req, @Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.team.updateMember(req.user, id, dto);
  }
}

/** Branches: everyone can see the list; only the owner adds or changes branches. */
@Controller('branches')
@UseGuards(JwtAuthGuard, StoreRoleGuard, SubscriptionGuard)
export class BranchesController {
  constructor(private readonly team: TeamService) {}

  @Get()
  list(@Request() req) {
    return this.team.listBranches(req.user.businessId);
  }

  @Post()
  @StoreRoles('OWNER')
  create(@Request() req, @Body() dto: BranchDto) {
    return this.team.createBranch(req.user, dto);
  }

  @Patch(':id')
  @StoreRoles('OWNER')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.team.updateBranch(req.user, id, dto);
  }
}

/** Public: opening and accepting an emailed invitation. */
@Controller('join')
@UseGuards(RateLimitGuard)
export class JoinController {
  constructor(private readonly team: TeamService) {}

  @Get(':token')
  @RateLimit({ name: 'join-view', limit: 30, windowSeconds: 15 * 60 })
  describe(@Param('token') token: string) {
    return this.team.describeInvite(token);
  }

  @Post()
  @RateLimit({ name: 'join-accept', limit: 10, windowSeconds: 15 * 60 })
  accept(@Body() dto: AcceptInviteDto) {
    return this.team.acceptInvite(dto);
  }
}
