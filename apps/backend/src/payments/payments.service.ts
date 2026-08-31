import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder_key';

  constructor(private prisma: PrismaService) {}

  async initializeSubscription(businessId: string, userId: string, dto: InitializePaymentDto) {
    const [business, user] = await Promise.all([
      this.prisma.business.findUnique({
        where: { id: businessId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
      }),
    ]);

    if (!business || !user) {
      throw new NotFoundException('Business or user not found');
    }

    const cleanPlanCode = dto.planCode.toUpperCase();
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: cleanPlanCode },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan ${cleanPlanCode} was not found in database.`);
    }

    const billingCycle = dto.billingCycle || 'MONTHLY';
    const amountNgn =
      billingCycle === 'ANNUAL'
        ? plan.annualPriceNgn > 0
          ? plan.annualPriceNgn
          : plan.monthlyPriceNgn * 10
        : plan.monthlyPriceNgn;

    if (amountNgn <= 0) {
      throw new BadRequestException('Cannot initialize payment for a free or zero-amount plan.');
    }

    const reference = `VF-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amountInKobo = Math.round(amountNgn * 100);

    let paystackData: any = null;

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: business.email || user.email,
          amount: amountInKobo,
          reference,
          currency: 'NGN',
          callback_url: `${process.env.FRONTEND_URL || 'https://sos-frontend-indol.vercel.app'}/dashboard/settings?tab=subscription&ref=${reference}`,
          metadata: {
            businessId: business.id,
            businessName: business.name,
            userId: user.id,
            planCode: plan.code,
            billingCycle,
            amountNgn,
            custom_fields: [
              {
                display_name: 'Store Name',
                variable_name: 'store_name',
                value: business.name,
              },
              {
                display_name: 'Plan Tier',
                variable_name: 'plan_tier',
                value: `${plan.name} (${billingCycle})`,
              },
            ],
          },
        }),
      });

      paystackData = await response.json();
    } catch (err: any) {
      this.logger.error(`Failed to connect to Paystack API: ${err.message}`);
      throw new BadRequestException('Unable to reach Paystack payment gateway. Please check connection.');
    }

    if (!paystackData?.status || !paystackData?.data) {
      this.logger.error(`Paystack initialization failed: ${JSON.stringify(paystackData)}`);
      throw new BadRequestException(paystackData?.message || 'Failed to initialize Paystack payment.');
    }

    // Save pending subscription payment in database
    await this.prisma.subscriptionPayment.create({
      data: {
        businessId: business.id,
        reference,
        amountNgn,
        planCode: plan.code,
        billingCycle,
        status: 'PENDING',
        paystackAccessCode: paystackData.data.access_code,
        rawMetadata: paystackData.data,
      },
    });

    return {
      success: true,
      reference,
      accessCode: paystackData.data.access_code,
      authorizationUrl: paystackData.data.authorization_url,
      amountNgn,
      planCode: plan.code,
      planName: plan.name,
      billingCycle,
    };
  }

  async verifySubscription(businessId: string, reference: string) {
    let paystackRes: any = null;

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      paystackRes = await response.json();
    } catch (err: any) {
      this.logger.error(`Paystack verify API error: ${err.message}`);
      throw new BadRequestException('Unable to verify payment with Paystack.');
    }

    if (!paystackRes?.status || paystackRes?.data?.status !== 'success') {
      throw new BadRequestException(paystackRes?.data?.gateway_response || 'Payment has not been completed.');
    }

    const paystackData = paystackRes.data;
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { reference },
    });

    const planCode = payment?.planCode || paystackData.metadata?.planCode || 'BUSINESS';
    const billingCycle = payment?.billingCycle || paystackData.metadata?.billingCycle || 'MONTHLY';
    const durationDays = billingCycle === 'ANNUAL' ? 365 : 30;
    const subscriptionEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Update payment record to SUCCESS
    if (payment) {
      await this.prisma.subscriptionPayment.update({
        where: { reference },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(paystackData.paid_at || Date.now()),
          channel: paystackData.channel || 'card',
          rawMetadata: paystackData,
        },
      });
    }

    // Activate the business subscription
    const updatedBusiness = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        plan: planCode,
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt,
        paystackCustomerCode: paystackData.customer?.customer_code,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    return {
      success: true,
      message: `Subscription successfully activated for ${updatedBusiness.name}!`,
      business: updatedBusiness,
    };
  }

  async handleWebhook(rawBody: string, signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing Paystack webhook signature');
    }

    const hash = crypto.createHmac('sha512', this.paystackSecretKey).update(rawBody).digest('hex');

    if (hash !== signature) {
      this.logger.warn('Invalid Paystack webhook signature received.');
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody);
    this.logger.log(`Received Paystack Webhook Event: ${event.event}`);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata;
      const businessId = metadata?.businessId;
      const planCode = metadata?.planCode;
      const billingCycle = metadata?.billingCycle || 'MONTHLY';

      if (businessId && planCode) {
        const durationDays = billingCycle === 'ANNUAL' ? 365 : 30;
        const subscriptionEndsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        await this.prisma.$transaction([
          this.prisma.subscriptionPayment.upsert({
            where: { reference },
            update: {
              status: 'SUCCESS',
              paidAt: new Date(data.paid_at || Date.now()),
              channel: data.channel,
              rawMetadata: data,
            },
            create: {
              businessId,
              reference,
              amountNgn: (data.amount || 0) / 100,
              planCode,
              billingCycle,
              status: 'SUCCESS',
              channel: data.channel,
              paidAt: new Date(data.paid_at || Date.now()),
              rawMetadata: data,
            },
          }),
          this.prisma.business.update({
            where: { id: businessId },
            data: {
              plan: planCode,
              subscriptionStatus: 'ACTIVE',
              trialEndsAt: null,
              subscriptionEndsAt,
              paystackCustomerCode: data.customer?.customer_code,
            },
          }),
        ]);

        this.logger.log(`Webhook activated subscription for business ${businessId} on plan ${planCode}`);
      }
    }

    return { status: true };
  }
}
