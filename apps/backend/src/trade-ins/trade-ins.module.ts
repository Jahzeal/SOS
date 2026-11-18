import { Module } from '@nestjs/common';
import { SalesModule } from '../sales/sales.module';
import { TradeInsController } from './trade-ins.controller';
import { TradeInsService } from './trade-ins.service';

@Module({
  imports: [SalesModule],
  controllers: [TradeInsController],
  providers: [TradeInsService],
  exports: [TradeInsService],
})
export class TradeInsModule {}
