import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminTransactionsService } from './admin-transactions.service';

@Controller('admin/transactions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTransactionsController {
  constructor(private readonly transactionsService: AdminTransactionsService) {}

  @Get()
  async getAll(
    @Query('search') search?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('businessId') businessId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.findAll({ search, paymentMethod, businessId, page, limit });
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.transactionsService.getTransactionDetails(id);
  }
}
