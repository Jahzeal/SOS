import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminBusinessesService } from './admin-businesses.service';
import { Plan } from '@prisma/client';

@Controller('admin/businesses')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminBusinessesController {
  constructor(private readonly businessesService: AdminBusinessesService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.businessesService.findAll({ search, plan, page, limit });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id/plan')
  async updatePlan(@Param('id') id: string, @Body('plan') plan: Plan) {
    return this.businessesService.updatePlan(id, plan);
  }

  @Patch(':id/toggle-verification')
  async toggleVerification(@Param('id') id: string) {
    return this.businessesService.togglePublicVerification(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.businessesService.delete(id);
  }
}
