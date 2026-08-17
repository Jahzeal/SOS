'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Check,
  Zap,
  Building,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

export default function DedicatedPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter Store',
      tagline: 'Ideal for independent phone retailers & repair shops',
      monthlyPrice: 15000,
      annualPrice: 12000,
      popular: false,
      features: [
        'Up to 250 Phone Registrations',
        '1 Store Branch Workspace',
        'IMEI & Serial Number Ledger',
        'Thermal Receipt Customization',
        'Basic Inventory Tracking',
        'Standard Email Support',
      ],
    },
    {
      id: 'business',
      name: 'Business Scale',
      tagline: 'Built for multi-branch phone stores & active retailers',
      monthlyPrice: 45000,
      annualPrice: 36000,
      popular: true,
      features: [
        'Up to 2,000 Phone Registrations',
        'Up to 3 Branch Workspaces',
        'POS Checkout & Commercial Invoices',
        'Customer Directory & History',
        'Repairs Management Center',
        'Advanced Revenue Analytics',
        'Priority Phone & WhatsApp Support',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise OS',
      tagline: 'For high-volume distributors & phone chains',
      monthlyPrice: 95000,
      annualPrice: 76000,
      popular: false,
      features: [
        'Unlimited Phone Registrations',
        'Unlimited Branch Workspaces',
        'Custom QR Thermal Receipts & Branding',
        'Multi-Staff Role Permissions (Owner, Manager, Tech)',
        'Full REST API & Supabase Database Sync',
        'Dedicated Account Manager',
        'SLA 99.9% Uptime Guarantee',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Header Navigation */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold shadow-md">
            VF
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none block">VerifyFlow</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border-slate-200">
              Sign In
            </Button>
          </Link>
          <Link href="/onboarding">
            <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Register Business →
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* Page Title & Billing Cycle Selector */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-2 border-b border-slate-200/80">
          <div className="space-y-2 max-w-2xl text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Flexible plans tailored to your retail scale
            </h1>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Start tracking your phone inventory and POS sales today. Upgrade or change your plan dynamically as you add branches and staff members.
            </p>
          </div>

          {/* Billing Cycle Switch */}
          <div className="shrink-0 inline-flex items-center gap-2 p-1 rounded-2xl bg-slate-200/80 border border-slate-300/60">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Billing
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl bg-white border p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-200 ${
                  plan.popular
                    ? 'border-2 border-blue-600 shadow-2xl ring-4 ring-blue-500/10'
                    : 'border-slate-200/90 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                    MOST POPULAR RETAIL PLAN
                  </div>
                )}

                <div className="space-y-6">
                  {/* Plan Name & Price */}
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{plan.tagline}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        ₦{price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">/ month</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      {billingCycle === 'annual' ? 'Billed annually (save 20%)' : 'Billed monthly'}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      Included Features
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-8">
                  <Link href={`/onboarding?plan=${plan.id}`}>
                    <Button
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="md"
                      fullWidth
                      className={`font-bold text-xs py-3 ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Get Started with {plan.name} →
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>



      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
      </footer>

    </div>
  );
}
