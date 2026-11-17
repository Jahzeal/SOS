import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PublicDocumentsController } from './public-documents.controller';
import { QuotesModule } from '../quotes/quotes.module';

@Module({
  imports: [QuotesModule],
  controllers: [SalesController, PublicDocumentsController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
