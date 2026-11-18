import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';
import { StoreRoleGuard, StoreRoles, SELLERS } from '../common/staff/store-role.guard';
import { TradeInsService } from './trade-ins.service';
import { CreateTradeInDto } from './dto/create-trade-in.dto';

/** Swaps and trade-ins. Anyone who can sell (owner, manager, sales staff) can use them. */
@Controller('trade-ins')
@UseGuards(JwtAuthGuard, StoreRoleGuard, SubscriptionGuard)
@StoreRoles(...SELLERS)
export class TradeInsController {
  constructor(private readonly tradeIns: TradeInsService) {}

  /** Live check while staff type or scan the device the customer is giving in. */
  @Get('check')
  check(@Request() req, @Query('identifier') identifier: string, @Query('category') category?: string) {
    return this.tradeIns.check(
      req.user.businessId,
      req.user.id,
      identifier || '',
      String(category || '').toUpperCase() === 'LAPTOP' ? 'LAPTOP' : 'PHONE',
    );
  }

  @Post()
  create(@Request() req, @Body() dto: CreateTradeInDto) {
    return this.tradeIns.create(req.user.businessId, req.user.id, dto);
  }

  @Get()
  list(@Request() req, @Query('filter') filter?: string, @Query('search') search?: string) {
    return this.tradeIns.list(req.user, { filter, search });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.tradeIns.findOne(req.user, id);
  }
}
