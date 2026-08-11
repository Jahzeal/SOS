import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { CreateRepairTicketDto } from './dto/create-repair-ticket.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RepairStatus } from '@prisma/client';

@Controller('repairs')
@UseGuards(JwtAuthGuard)
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: RepairStatus,
  ) {
    const businessId = req.user.businessId;
    return this.repairsService.findAll(businessId, { search, status });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.repairsService.findOne(businessId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateRepairTicketDto) {
    const businessId = req.user.businessId;
    return this.repairsService.create(businessId, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateRepairStatusDto,
  ) {
    const businessId = req.user.businessId;
    return this.repairsService.updateStatus(businessId, id, dto);
  }
}
