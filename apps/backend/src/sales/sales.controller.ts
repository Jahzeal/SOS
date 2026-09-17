import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CheckoutSaleDto } from './dto/checkout-sale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentMethod } from '@prisma/client';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ==========================================
  // 1. INVOICES DEDICATED ENDPOINTS
  // ==========================================

  @Get('invoices')
  async findAllInvoices(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const businessId = req.user.businessId;
    return this.salesService.findAllInvoices(businessId, search, status);
  }

  @Get('invoices/:id')
  async findOneInvoice(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.salesService.findOneInvoice(businessId, id);
  }

  @Post('invoices')
  async createInvoice(@Request() req, @Body() dto: CheckoutSaleDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.salesService.checkout(businessId, userId, {
      ...dto,
      type: 'INVOICE',
      paymentStatus: dto.paymentStatus || 'PENDING',
    });
  }

  @Post('invoices/:id/pay')
  async markInvoiceAsPaid(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { paymentMethod?: PaymentMethod },
  ) {
    const businessId = req.user.businessId;
    return this.salesService.markInvoiceAsPaid(businessId, id, body?.paymentMethod);
  }

  @Post('invoices/:id/email')
  async sendInvoiceEmail(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { email?: string },
  ) {
    const businessId = req.user.businessId;
    return this.salesService.sendSaleEmail(businessId, id, body?.email);
  }

  // ==========================================
  // 2. RECEIPTS DEDICATED ENDPOINTS
  // ==========================================

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

  @Post('receipts')
  async createReceipt(@Request() req, @Body() dto: CheckoutSaleDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.salesService.checkout(businessId, userId, {
      ...dto,
      type: 'RECEIPT',
      paymentStatus: 'PAID',
    });
  }

  @Post('receipts/:id/email')
  async sendReceiptEmail(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { email?: string },
  ) {
    const businessId = req.user.businessId;
    return this.salesService.sendSaleEmail(businessId, id, body?.email);
  }

  // ==========================================
  // 3. BACKWARDS COMPATIBILITY ROUTES
  // ==========================================

  @Post('checkout')
  async checkout(@Request() req, @Body() dto: CheckoutSaleDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.salesService.checkout(businessId, userId, dto);
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
