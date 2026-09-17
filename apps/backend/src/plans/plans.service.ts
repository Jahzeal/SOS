import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_PLANS = [
  {
    code: 'FREE',
    name: 'Free Forever',
    description: 'Essential IMEI ledger and POS receipts for solo phone technicians and micro shops.',
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    maxDevices: 25,
    customBranding: false,
    prioritySupport: false,
    features: [
      'Up to 25 Devices Registered / Month',
      'IMEI & Serial Number Ledger',
      'Standard POS Thermal Receipts (80mm/58mm)',
      'Digital Warranty QR Passports',
      'Customer Directory & History',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 1,
  },
  {
    code: 'STARTER',
    name: 'Starter Store',
    description: 'Perfect for growing independent phone retailers and active repair counters.',
    monthlyPriceNgn: 15000,
    annualPriceNgn: 150000,
    maxDevices: 250,
    customBranding: true,
    prioritySupport: false,
    features: [
      'Up to 250 Device Registrations',
      'Commercial PDF Invoices & Bank Details',
      'Store Logo & Receipt Customization',
      'Live Repair Ticket Diagnostics',
      'Standard Email & WhatsApp Support',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 2,
  },
  {
    code: 'BUSINESS',
    name: 'Business Hub',
    description: 'Designed for high-volume retail hubs and multi-counter phone stores.',
    monthlyPriceNgn: 45000,
    annualPriceNgn: 450000,
    maxDevices: 2000,
    customBranding: true,
    prioritySupport: true,
    features: [
      'Up to 2,000 Device Registrations',
      'Up to 3 Store Branch Workspaces',
      'White-label Brand Receipts & Invoices',
      'Advanced Sales, Revenue & Profit Analytics',
      'Priority Phone & Helpdesk Support',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 3,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise Chain',
    description: 'For phone distributors, wholesalers, and multi-branch retail chains.',
    monthlyPriceNgn: 120000,
    annualPriceNgn: 1200000,
    maxDevices: 10000,
    customBranding: true,
    prioritySupport: true,
    features: [
      'Unlimited / High-volume Device Ledger',
      'Unlimited Multi-Branch Workspaces',
      'Wholesaler Stock Allocation & Transfers',
      'Dedicated Account Manager',
      '99.9% Uptime SLA Guarantee',
    ],
    isActive: true,
    isPublic: true,
    sortOrder: 4,
  },
];

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private prisma: PrismaService) {}

  async seedDefaultPlansIfEmpty() {
    try {
      for (const p of DEFAULT_PLANS) {
        const existing = await this.prisma.subscriptionPlan.findUnique({
          where: { code: p.code },
        });
        if (!existing) {
          await this.prisma.subscriptionPlan.create({
            data: p,
          });
        }
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
