import { Module } from '@nestjs/common';
import { AdminPushController, PushController, PushCronController } from './push.controller';
import { PushService } from './push.service';

@Module({
  controllers: [PushController, AdminPushController, PushCronController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
