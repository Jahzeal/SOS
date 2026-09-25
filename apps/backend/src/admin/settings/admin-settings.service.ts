import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

export interface AdminPlatformSettingsDto {
  platformName: string;
  maintenanceMode: boolean;
  allowPublicRegistrations: boolean;
  defaultTrialDays: number;
  rateLimitPerMinute: number;
  maxLookupsPerDayFree: number;
  alertEmail: string;
  webhookSecret: string;
  paystackLiveEnabled: boolean;
  // Email Customization
  welcomeEmailEnabled: boolean;
  welcomeEmailSubject: string;
  welcomeEmailHeading: string;
  welcomeEmailSubheading: string;
  welcomeEmailBody: string;
  welcomeEmailCtaText: string;
}

@Injectable()
export class AdminSettingsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    await this.ensureInitialSettings();
  }

  private async ensureInitialSettings() {
    const defaultSettings: Record<string, string> = {
      platformName: process.env.PLATFORM_NAME || 'NoxGuarda Network HQ',
      maintenanceMode: 'false',
      allowPublicRegistrations: 'true',
      defaultTrialDays: '14',
      rateLimitPerMinute: '120',
      maxLookupsPerDayFree: '50',
      alertEmail: process.env.ALERT_EMAIL || 'security@noxguarda.com',
      webhookSecret: process.env.WEBHOOK_SECRET || 'whsec_noxguarda_live_89410384',
      paystackLiveEnabled: process.env.PAYSTACK_LIVE_ENABLED || 'true',
      // Email defaults
      welcomeEmailEnabled: 'true',
      welcomeEmailSubject: 'Welcome to NoxGuarda - Your {{businessName}} Store is Ready!',
      welcomeEmailHeading: 'Welcome to NoxGuarda!',
      welcomeEmailSubheading: 'Your Verified Phone Inventory & Retail OS is Live',
      welcomeEmailBody:
        'Congratulations! Your store workspace "{{businessName}}" has been successfully created. You now have full access to our high-speed IMEI ledger, express POS checkout, and fraud prevention suite.',
      welcomeEmailCtaText: 'Go to Your Store Dashboard →',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      const existing = await this.prisma.platformSetting.findUnique({ where: { key } });
      if (!existing) {
        await this.prisma.platformSetting.create({
          data: { key, value },
        });
      } else if (existing.value && /verifyflow/i.test(existing.value)) {
        const cleanedValue = existing.value.replace(/verifyflow/gi, 'NoxGuarda');
        await this.prisma.platformSetting.update({
          where: { key },
          data: { value: cleanedValue },
        });
      }
    }
  }

  async getSettings() {
    const allSettings = await this.prisma.platformSetting.findMany();
    const map = new Map(allSettings.map((s) => [s.key, s.value]));

    const data: AdminPlatformSettingsDto = {
      platformName: map.get('platformName') || 'NoxGuarda Network HQ',
      maintenanceMode: map.get('maintenanceMode') === 'true',
      allowPublicRegistrations: map.get('allowPublicRegistrations') === 'true',
      defaultTrialDays: parseInt(map.get('defaultTrialDays') || '14', 10),
      rateLimitPerMinute: parseInt(map.get('rateLimitPerMinute') || '120', 10),
      maxLookupsPerDayFree: parseInt(map.get('maxLookupsPerDayFree') || '50', 10),
      alertEmail: map.get('alertEmail') || 'security@noxguarda.com',
      webhookSecret: map.get('webhookSecret') || 'whsec_noxguarda_live_89410384',
      paystackLiveEnabled: map.get('paystackLiveEnabled') === 'true',
      // Email fields
      welcomeEmailEnabled: map.get('welcomeEmailEnabled') !== 'false',
      welcomeEmailSubject:
        map.get('welcomeEmailSubject') || 'Welcome to NoxGuarda - Your {{businessName}} Store is Ready!',
      welcomeEmailHeading: map.get('welcomeEmailHeading') || 'Welcome to NoxGuarda!',
      welcomeEmailSubheading:
        map.get('welcomeEmailSubheading') || 'Your Verified Phone Inventory & Retail OS is Live',
      welcomeEmailBody:
        map.get('welcomeEmailBody') ||
        'Congratulations! Your store workspace "{{businessName}}" has been successfully created. You now have full access to our high-speed IMEI ledger, express POS checkout, and fraud prevention suite.',
      welcomeEmailCtaText: map.get('welcomeEmailCtaText') || 'Go to Your Store Dashboard →',
    };

    return {
      success: true,
      data,
    };
  }

  async updateSettings(partial: Partial<AdminPlatformSettingsDto>) {
    const entries = Object.entries(partial);

    for (const [key, value] of entries) {
      if (value !== undefined) {
        await this.prisma.platformSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    return this.getSettings();
  }

  async sendTestWelcomeEmail(payload: {
    email: string;
    template?: {
      subject?: string;
      heading?: string;
      subheading?: string;
      body?: string;
      ctaText?: string;
    };
  }) {
    const targetEmail = payload.email?.trim();
    if (!targetEmail) {
      throw new Error('Target email address is required to send a test email.');
    }

    const res: any = await this.mailService.sendWelcomeEmail(
      targetEmail,
      'Test Merchant',
      'Apex Digital Gadgets (Test)',
      'Enterprise Pro Trial',
      payload.template,
    );

    return {
      success: res.success,
      messageId: res.messageId,
      error: res.error,
      recipient: targetEmail,
    };
  }
}
