import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_PLANS = [
  {
    code: 'STARTER',
    name: 'Starter Store',
    description: 'Perfect for small single-counter phone shops and repair technicians.',
    monthlyPriceNgn: 15000,
    annualPriceNgn: 150000,
    maxDevices: 100,
    customBranding: false,
    prioritySupport: false,
    features: [
      'Inventory Ledger (up to 100 devices)',
      'Digital & thermal 80mm receipts',
      'Customer database management',
      'Sales and profit summaries',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 1,
  },
  {
    code: 'BUSINESS',
    name: 'Business Hub',
    description: 'Designed for high-volume retail hubs and active store counters.',
    monthlyPriceNgn: 45000,
    annualPriceNgn: 450000,
    maxDevices: 1000,
    customBranding: true,
    prioritySupport: true,
    features: [
      'Inventory Ledger (up to 1,000 devices)',
      'Custom receipt & thermal logo branding',
      'Repair ticket workflow & diagnostics',
      'Advanced sales analytics & reports',
      'Priority helpdesk support',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 2,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise Network',
    description: 'For distributors, phone wholesalers, and multi-branch retail stores.',
    monthlyPriceNgn: 120000,
    annualPriceNgn: 1200000,
    maxDevices: 10000,
    customBranding: true,
    prioritySupport: true,
    features: [
      'Unlimited / High-volume device inventory',
      'Custom white-label thermal receipt logo',
      'Wholesaler stock allocation tools',
      'Dedicated account manager',
      '99.9% uptime SLA guarantee',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 3,
  },
];

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private prisma: PrismaService) {}

  async seedDefaultPlansIfEmpty() {
    try {
      const count = await this.prisma.subscriptionPlan.count();
      if (count === 0) {
        this.logger.log('Seeding default subscription plans into database...');
        for (const p of DEFAULT_PLANS) {
          await this.prisma.subscriptionPlan.create({ data: p });
        }
        this.logger.log('Default subscription plans successfully seeded.');
      }
    } catch (err) {
      this.logger.warn('Could not auto-seed plans (table might be syncing):', err);
    }
  }

  async getPublicPlans() {
    await this.seedDefaultPlansIfEmpty();
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      success: true,
      plans,
    };
  }

  async getPlanByCode(code: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: code.toUpperCase() },
    });
    return plan;
  }
}
