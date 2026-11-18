import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Request,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CampaignInput, PushService } from './push.service';

/** Store side: switch notifications on or off for this device. */
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('public-key')
  publicKey() {
    return this.push.publicKey();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@Request() req, @Body() body: any, @Headers('user-agent') ua?: string) {
    return this.push.subscribe(req.user, body, ua);
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(@Request() req, @Body() body: { endpoint?: string }) {
    return this.push.unsubscribe(req.user.id, String(body?.endpoint || ''));
  }
}

/** Admin → Reminders. */
@Controller('admin/push-campaigns')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPushController {
  constructor(private readonly push: PushService) {}

  @Get()
  list() {
    return this.push.listCampaigns();
  }

  @Post()
  create(@Body() body: CampaignInput) {
    return this.push.createCampaign(body);
  }

  @Post('starter')
  starter() {
    return this.push.addStarterReminders();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: CampaignInput) {
    return this.push.updateCampaign(id, body);
  }

  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.push.setActive(id, !!body?.isActive);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.push.deleteCampaign(id);
  }

  @Post(':id/test')
  test(@Request() req, @Param('id') id: string) {
    return this.push.sendTest(id, req.user);
  }

  @Post(':id/send-now')
  sendNow(@Param('id') id: string) {
    return this.push.sendNow(id);
  }
}

/** Called by the scheduler, ideally every 15 minutes, with "Authorization: Bearer <CRON_SECRET>". */
@Controller('cron')
export class PushCronController {
  constructor(private readonly push: PushService) {}

  @Get('push-reminders')
  run(@Headers('authorization') authorization?: string) {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new ServiceUnavailableException('CRON_SECRET is not set on the server.');
    const expected = Buffer.from(`Bearer ${secret}`);
    const given = Buffer.from(String(authorization || ''));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new ForbiddenException();
    return this.push.runDue();
  }
}
