import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  Header,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentMethod } from '@prisma/client';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('stats')
  async getStats(@Request() req) {
    const businessId = req.user.businessId;
    return this.quotesService.getStats(businessId);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const businessId = req.user.businessId;
    return this.quotesService.findAll(businessId, search, status);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.quotesService.findOne(businessId, id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Request() req, @Param('id') id: string, @Response() res) {
    const businessId = req.user.businessId;
    const { buffer, filename } = await this.quotesService.generatePdf(businessId, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateQuoteDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.quotesService.create(businessId, userId, dto);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    const businessId = req.user.businessId;
    return this.quotesService.update(businessId, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const businessId = req.user.businessId;
    return this.quotesService.delete(businessId, id);
  }

  @Post(':id/email')
  async sendEmail(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { email?: string },
  ) {
    const businessId = req.user.businessId;
    return this.quotesService.sendQuoteEmail(businessId, id, body?.email);
  }

  @Post(':id/convert')
  async convertToSale(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { paymentMethod?: PaymentMethod; notes?: string; asInvoice?: boolean },
  ) {
    const businessId = req.user.businessId;
    const userId = req.user.id;
    return this.quotesService.convertToSale(businessId, userId, id, body);
  }
}
