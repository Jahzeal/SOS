import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminPlansService, CreatePlanDto } from './admin-plans.service';

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPlansController {
  constructor(private readonly plansService: AdminPlansService) {}

  @Get()
  async getAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.plansService.delete(id);
  }
}
