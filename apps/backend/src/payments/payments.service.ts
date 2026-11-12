import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import * as crypto from 'crypto';
import { frontendUrl } from '../common/config/env';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  /** No fallback key: without the real secret, payments must not work at all. */
  private get paystackSecretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key || !key.trim()) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured.');
      throw new ServiceUnavailableException('Payments are not configured on this server.');
    }
    return key.trim();
  }

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

    const reference = `NG-SUB-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
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
          callback_url: `${process.env.FRONTEND_URL ? frontendUrl() : 'https://sos-frontend-indol.vercel.app'}/dashboard/settings?tab=subscription&ref=${reference}`,
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
      if (err instanceof ServiceUnavailableException) throw err;
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
    // 1. The reference must be a payment THIS business started.
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { reference },
    });

    if (!payment || payment.businessId !== businessId) {
      throw new NotFoundException('Payment reference not found for this account.');
    }

    // 2. Already applied (by an earlier verify or the webhook): do not extend again.
    if (payment.status === 'SUCCESS') {
      return this.alreadyActivatedResponse(businessId);
    }

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
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error(`Paystack verify API error: ${err.message}`);
      throw new BadRequestException('Unable to verify payment with Paystack.');
    }

    if (!paystackRes?.status || paystackRes?.data?.status !== 'success') {
      throw new BadRequestException(paystackRes?.data?.gateway_response || 'Payment has not been completed.');
    }

    const updatedBusiness = await this.applySuccessfulPayment(payment.reference, paystackRes.data);

    return {
      success: true,
      message: `Subscription successfully activated for ${updatedBusiness.name}!`,
      business: updatedBusiness,
    };
  }

  private async alreadyActivatedResponse(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
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
      message: 'This payment has already been applied to your subscription.',
      business,
    };
  }

  /**
   * Single place where a Paystack charge turns into an active subscription.
   * Everything that decides WHAT is granted (business, plan, cycle, price) comes
   * from our own PENDING record, never from data the payer could influence.
   */
  private async applySuccessfulPayment(reference: string, paystackData: any) {
    const payment = await this.prisma.subscriptionPayment.findUnique({ where: { reference } });
    if (!payment) {
      throw new NotFoundException('Payment reference not found.');
    }

    const expectedKobo = Math.round(payment.amountNgn * 100);
    const paidKobo = Number(paystackData?.amount);
    const currency = String(paystackData?.currency || 'NGN').toUpperCase();

    if (String(paystackData?.reference || reference) !== reference) {
      throw new BadRequestException('Payment reference mismatch.');
    }
    if (currency !== 'NGN' || !Number.isFinite(paidKobo) || paidKobo < expectedKobo) {
      this.logger.warn(
        `Payment ${reference} amount mismatch: expected ${expectedKobo} kobo NGN, got ${paystackData?.amount} ${currency}`,
      );
      throw new BadRequestException('Amount paid does not match the selected plan.');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: payment.planCode } });
    const durationDays = payment.billingCycle === 'ANNUAL' ? 365 : 30;

    return this.prisma.$transaction(async (tx) => {
      // Claim the payment. If another request (webhook vs. verify) claimed it first,
      // count is 0 and we must not extend the subscription a second time.
      const claimed = await tx.subscriptionPayment.updateMany({
        where: { reference, status: { not: 'SUCCESS' } },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(paystackData?.paid_at || Date.now()),
          channel: paystackData?.channel || 'card',
          rawMetadata: paystackData ?? undefined,
        },
      });

      const select = {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      };

      if (claimed.count === 0) {
        return tx.business.findUniqueOrThrow({ where: { id: payment.businessId }, select });
      }

      // Renewing early adds time on top of what is already paid for.
      const current = await tx.business.findUniqueOrThrow({
        where: { id: payment.businessId },
        select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
      });
      const now = Date.now();
      const stillRunning =
        current.subscriptionStatus === 'ACTIVE' &&
        current.plan === payment.planCode &&
        current.subscriptionEndsAt &&
        current.subscriptionEndsAt.getTime() > now;
      const startFrom = stillRunning ? current.subscriptionEndsAt!.getTime() : now;
      const subscriptionEndsAt = new Date(startFrom + durationDays * 24 * 60 * 60 * 1000);

      return tx.business.update({
        where: { id: payment.businessId },
        data: {
          plan: payment.planCode,
          planId: plan ? plan.id : undefined,
          subscriptionStatus: 'ACTIVE',
          trialEndsAt: null,
          subscriptionEndsAt,
          paystackCustomerCode: paystackData?.customer?.customer_code || undefined,
        },
        select,
      });
    });
  }

  async handleWebhook(rawBody: string, signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing Paystack webhook signature');
    }

    const expected = crypto.createHmac('sha512', this.paystackSecretKey).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(String(signature), 'utf8');

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      this.logger.warn('Invalid Paystack webhook signature received.');
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody);
    this.logger.log(`Received Paystack Webhook Event: ${event.event}`);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = String(data?.reference || '');

      // Only charges we initialised ourselves can activate a subscription.
      const payment = reference
        ? await this.prisma.subscriptionPayment.findUnique({ where: { reference } })
        : null;

      if (!payment) {
        this.logger.warn(`Webhook charge.success for unknown reference "${reference}" ignored.`);
        return { status: true };
      }

      try {
        await this.applySuccessfulPayment(reference, data);
        this.logger.log(`Webhook activated subscription for business ${payment.businessId} on plan ${payment.planCode}`);
      } catch (err: any) {
        // Acknowledge so Paystack stops retrying; the mismatch is logged above.
        this.logger.warn(`Webhook payment ${reference} not applied: ${err?.message || err}`);
      }
    }

    return { status: true };
  }
}
