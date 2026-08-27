import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}

@Injectable()
export class AdminSettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureInitialSettings();
  }

  private async ensureInitialSettings() {
    const defaultSettings: Record<string, string> = {
      platformName: process.env.PLATFORM_NAME || 'VerifyFlow Network HQ',
      maintenanceMode: 'false',
      allowPublicRegistrations: 'true',
      defaultTrialDays: '14',
      rateLimitPerMinute: '120',
      maxLookupsPerDayFree: '50',
      alertEmail: process.env.ALERT_EMAIL || 'security@verifyflow.ng',
      webhookSecret: process.env.WEBHOOK_SECRET || 'whsec_verifyflow_live_89410384',
      paystackLiveEnabled: process.env.PAYSTACK_LIVE_ENABLED || 'true',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      const existing = await this.prisma.platformSetting.findUnique({ where: { key } });
      if (!existing) {
        await this.prisma.platformSetting.create({
          data: { key, value },
        });
      }
    }
  }

  async getSettings() {
    const allSettings = await this.prisma.platformSetting.findMany();
    const map = new Map(allSettings.map((s) => [s.key, s.value]));

    const data: AdminPlatformSettingsDto = {
      platformName: map.get('platformName') || 'VerifyFlow Network HQ',
      maintenanceMode: map.get('maintenanceMode') === 'true',
      allowPublicRegistrations: map.get('allowPublicRegistrations') === 'true',
      defaultTrialDays: parseInt(map.get('defaultTrialDays') || '14', 10),
      rateLimitPerMinute: parseInt(map.get('rateLimitPerMinute') || '120', 10),
      maxLookupsPerDayFree: parseInt(map.get('maxLookupsPerDayFree') || '50', 10),
      alertEmail: map.get('alertEmail') || 'security@verifyflow.ng',
      webhookSecret: map.get('webhookSecret') || 'whsec_verifyflow_live_89410384',
      paystackLiveEnabled: map.get('paystackLiveEnabled') === 'true',
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
}
