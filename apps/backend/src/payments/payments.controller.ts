import { Controller, Post, Get, Body, Param, Req, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StoreRoleGuard, StoreRoles, SELLERS, MANAGERS } from '../common/staff/store-role.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @StoreRoles('OWNER')
  @Post('initialize')
  @UseGuards(JwtAuthGuard, StoreRoleGuard)
  async initializePayment(@Req() req: any, @Body() dto: InitializePaymentDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id || req.user.sub;
    return this.paymentsService.initializeSubscription(businessId, userId, dto);
  }

  @StoreRoles('OWNER')
  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard, StoreRoleGuard)
  async verifyPayment(@Req() req: any, @Param('reference') reference: string) {
    const businessId = req.user.businessId;
    return this.paymentsService.verifySubscription(businessId, reference);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Req() req: any,
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    // rawBody is enabled in main.ts / api/index.ts; the signature must be checked
    // against the exact bytes Paystack sent.
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
