import { Controller, Post, Get, Body, Param, Req, Headers, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  async initializePayment(@Req() req: any, @Body() dto: InitializePaymentDto) {
    const businessId = req.user.businessId;
    const userId = req.user.id || req.user.sub;
    return this.paymentsService.initializeSubscription(businessId, userId, dto);
  }

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
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
    // If rawBody is not available on req, JSON.stringify body
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(body);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
