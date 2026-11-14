import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamService } from './team.service';
import { BranchesController, JoinController, TeamController } from './team.controller';

@Module({
  imports: [AuthModule],
  controllers: [TeamController, BranchesController, JoinController],
  providers: [TeamService],
})
export class TeamModule {}
