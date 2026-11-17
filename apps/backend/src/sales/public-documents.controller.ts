import { Controller, Get, Param, Response, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { QuotesService } from '../quotes/quotes.service';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@Controller('public/documents')
export class PublicDocumentsController {
  constructor(
    private readonly salesService: SalesService,
    private readonly quotesService: QuotesService,
  ) {}

  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'public-doc-pdf', limit: 60, windowSeconds: 60 })
  @Get('invoices/:id/pdf')
  async downloadInvoicePdf(@Param('id') id: string, @Response() res: any) {
    const { buffer, filename } = await this.salesService.generatePublicPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'public-doc-pdf', limit: 60, windowSeconds: 60 })
  @Get('receipts/:id/pdf')
  async downloadReceiptPdf(@Param('id') id: string, @Response() res: any) {
    const { buffer, filename } = await this.salesService.generatePublicPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @UseGuards(RateLimitGuard)
  @RateLimit({ name: 'public-doc-pdf', limit: 60, windowSeconds: 60 })
  @Get('quotes/:id/pdf')
  async downloadQuotePdf(@Param('id') id: string, @Response() res: any) {
    const { buffer, filename } = await this.quotesService.generatePublicPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
