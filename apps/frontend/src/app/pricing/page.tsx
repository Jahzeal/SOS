'use client';

import React, { useState, useEffect } from 'react';
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
  Loader2,
  CreditCard,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { Logo } from '@/components/ui/Logo';

export default function DedicatedPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vf_access_token');
      if (token) {
        setIsLoggedIn(true);
      }
    }

    // Fetch dynamic database plans
    api
      .getPlans()
      .then((res) => {
        if (res?.success && Array.isArray(res.plans) && res.plans.length > 0) {
          setPlans(res.plans);
        } else {
          setPlans(getFallbackPlans());
        }
      })
      .catch((err) => {
        console.warn('Failed to load database plans, using fallback:', err);
        setPlans(getFallbackPlans());
      })
      .finally(() => setLoading(false));
  }, []);

  const getFallbackPlans = () => [
    {
      code: 'STARTER',
      name: 'Starter Store',
      description: 'Ideal for independent phone retailers & repair shops',
      monthlyPriceNgn: 15000,
      annualPriceNgn: 144000,
      maxDevices: 250,
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
      code: 'BUSINESS',
      name: 'Business Scale',
      description: 'Built for multi-branch phone stores & active retailers',
      monthlyPriceNgn: 45000,
      annualPriceNgn: 432000,
      maxDevices: 2000,
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
      code: 'ENTERPRISE',
      name: 'Enterprise OS',
      description: 'For high-volume distributors & phone chains',
      monthlyPriceNgn: 95000,
      annualPriceNgn: 912000,
      maxDevices: 999999,
      popular: false,
      features: [
        'Unlimited Phone Registrations',
        'Unlimited Branch Workspaces',
        'Custom QR Thermal Receipts & Branding',
        'Multi-Staff Role Permissions (Owner, Manager, Tech)',
        'Full REST API & Database Sync',
        'Dedicated Account Manager',
        'SLA 99.9% Uptime Guarantee',
      ],
    },
  ];

  const handlePlanAction = (plan: any) => {
    if (isLoggedIn) {
      setSelectedCheckoutPlan(plan);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      
      {/* Header Navigation */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <Logo size="md" />

        <div className="flex items-center gap-2 sm:gap-3">
          <PwaInstallButton variant="header" />
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                Dashboard →
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border-slate-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
                  Start Free Trial →
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-10">
        
        {/* Page Title & Billing Cycle Selector */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-slate-200/80">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-extrabold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Transparent Merchant Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Flexible plans tailored to your retail scale
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Every plan includes a <strong className="text-slate-900">14-Day Free Trial</strong> with zero credit card required. Upgrade, downgrade, or switch billing cycles anytime.
            </p>
          </div>

          {/* Billing Cycle Switch */}
          <div className="shrink-0 inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/60">
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

        {/* Dynamic Loading State */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading live subscription packages...</p>
          </div>
        ) : (
          /* Pricing Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-2">
            {plans.map((plan) => {
              const monthlyPrice = plan.monthlyPriceNgn || 0;
              const annualPrice = plan.annualPriceNgn && plan.annualPriceNgn > 0 ? plan.annualPriceNgn : monthlyPrice * 10;
              const displayMonthlyEquivalent = billingCycle === 'annual' ? Math.round(annualPrice / 12) : monthlyPrice;
              const isPopular = plan.popular || plan.code === 'BUSINESS';

              return (
                <div
                  key={plan.code || plan.id}
                  className={`rounded-3xl bg-white border p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-200 ${
                    isPopular
                      ? 'border-2 border-teal-600 shadow-2xl ring-4 ring-teal-500/10'
                      : 'border-slate-200/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-teal-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                      MOST POPULAR RETAIL PLAN
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Plan Name & Price */}
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {plan.description || 'Designed for retail gadget stores seeking verified device tracking, POS, and thermal receipts.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
                          ₦{displayMonthlyEquivalent.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">/ month</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">
                        {billingCycle === 'annual'
                          ? `Billed annually (₦${annualPrice.toLocaleString()} / year — save 20%)`
                          : 'Billed monthly'}
                      </p>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                        Included Features
                      </div>
                      <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                        {Array.isArray(plan.features) && plan.features.length > 0 ? (
                          plan.features.map((feat: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))
                        ) : (
                          <>
                            <li className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Up to {plan.maxDevices?.toLocaleString() || 500} Phone Registrations</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>IMEI & Barcode Verification Ledger</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>POS Checkout & Thermal Receipts</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Call to Action Button */}
                  <div className="pt-8">
                    {isLoggedIn ? (
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        onClick={() => handlePlanAction(plan)}
                        className={`font-bold text-xs py-3 ${
                          isPopular
                            ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        <span>Subscribe with Paystack →</span>
                      </Button>
                    ) : (
                      <Link href={`/onboarding?plan=${(plan.code || plan.id || 'BUSINESS').toUpperCase()}`}>
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          className={`font-bold text-xs py-3 ${
                            isPopular
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          Start 14-Day Free Trial →
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Paystack Checkout Modal for Logged In Users */}
      {selectedCheckoutPlan && (
        <PaystackCheckoutModal
          isOpen={Boolean(selectedCheckoutPlan)}
          onClose={() => setSelectedCheckoutPlan(null)}
          plan={selectedCheckoutPlan}
          onSuccess={() => {
            setSelectedCheckoutPlan(null);
            if (typeof window !== 'undefined') {
              window.location.href = '/dashboard';
            }
          }}
        />
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
      </footer>

    </div>
  );
}
