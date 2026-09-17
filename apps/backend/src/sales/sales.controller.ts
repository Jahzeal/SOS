import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('checkout')
  async checkout(@Request() req, @Body() dto: CheckoutSaleDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.salesService.checkout(businessId, userId, dto);
  }

  @Get('invoices')
  async findAllInvoices(@Request() req, @Query('search') search?: string) {
    const businessId = req.user.businessId;
    return this.salesService.findAllInvoices(businessId, search);
  }

  @Get('receipts')
  async findAllReceipts(@Request() req, @Query('search') search?: string) {
    const businessId = req.user.businessId;
    return this.salesService.findAllReceipts(businessId, search);
  }

  @Get('receipts/:id')
  async findOneReceipt(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.salesService.findOneReceipt(businessId, id);
  }

  @Post(':id/email')
  async sendSaleEmail(@Request() req, @Param('id') id: string, @Body() body?: { email?: string }) {
    const businessId = req.user.businessId;
    return this.salesService.sendSaleEmail(businessId, id, body?.email);
  }

  @Post('email')
  async sendSaleEmailDirect(@Request() req, @Body() body: { id: string; email?: string }) {
    const businessId = req.user.businessId;
    return this.salesService.sendSaleEmail(businessId, body.id, body.email);
  }
}
