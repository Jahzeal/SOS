import { Plan } from '@prisma/client';

export interface PlanConfig {
  name: string;
  code: Plan;
  monthlyPriceNgn: number;
  annualPriceNgn: number;
  maxStaffAccounts: number;
  maxMonthlyLookups: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  [Plan.STARTER]: {
    name: 'Starter Store',
    code: Plan.STARTER,
    monthlyPriceNgn: 15000,
    annualPriceNgn: 150000,
    maxStaffAccounts: 2,
    maxMonthlyLookups: 500,
    features: [
      'Digital Receipts (PDF & Print)',
      'Basic IMEI National Verification',
      'Inventory Management (up to 100 devices)',
      'Single Store Branch',
    ],
  },
  [Plan.BUSINESS]: {
    name: 'Business Hub',
    code: Plan.BUSINESS,
    monthlyPriceNgn: 45000,
    annualPriceNgn: 450000,
    maxStaffAccounts: 10,
    maxMonthlyLookups: 5000,
    features: [
      'Everything in Starter',
      'Bulk IMEI Verification API',
      'Repair Ticket Workflow & Diagnostics',
      'Thermal 58mm / 80mm Custom Receipt Branding',
      'Multi-Staff Role Permissions',
    ],
  },
  [Plan.ENTERPRISE]: {
    name: 'Enterprise Network',
    code: Plan.ENTERPRISE,
    monthlyPriceNgn: 120000,
    annualPriceNgn: 1200000,
    maxStaffAccounts: 50,
    maxMonthlyLookups: 50000,
    features: [
      'Everything in Business',
      'Unlimited Store Branches & POS Sync',
      'Dedicated Webhook & API Rate Limiting Bypass',
      'Automated Anti-Theft Police Blacklist Sync',
      '24/7 Priority SLA & Dedicated Account Manager',
    ],
  },
};

export const getPlanPrice = (plan: Plan): number => {
  return PLAN_CONFIGS[plan]?.monthlyPriceNgn ?? 0;
};
