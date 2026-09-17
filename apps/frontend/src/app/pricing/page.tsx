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
  ChevronUp,
  Loader2,
  CreditCard,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { Logo } from '@/components/ui/Logo';

import { usePublicPlans } from '@/hooks/useDashboardQueries';

export default function DedicatedPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('/dashboard');
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<any | null>(null);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});

  const togglePlanExpand = (planKey: string) => {
    setExpandedPlanIds((prev) => ({
      ...prev,
      [planKey]: !prev[planKey],
    }));
  };

  // Cached public plans query (instant 0ms)
  const { data: plans = [], isLoading: loading } = usePublicPlans();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vf_access_token');
      if (token) {
        setIsLoggedIn(true);
      }
      try {
        const storedUser = localStorage.getItem('vf_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'ADMIN') {
            setDashboardUrl('/admin/dashboard');
          } else {
            setDashboardUrl('/dashboard');
          }
        }
      } catch {}
    }
  }, []);

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
            <Link href={dashboardUrl}>
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
        ) : plans.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-800">No active subscription packages available</h3>
            <p className="text-xs text-slate-500 font-medium">Please check back shortly or reach out to support.</p>
          </div>
        ) : (
          /* Pricing Cards Grid (4 Responsive Columns) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch pt-2">
            {plans.map((plan, idx) => {
              const isFree = plan.code === 'FREE' || (!plan.monthlyPriceNgn && !plan.annualPriceNgn);
              const monthlyPrice = plan.monthlyPriceNgn || 0;
              const annualPrice = plan.annualPriceNgn && plan.annualPriceNgn > 0 ? plan.annualPriceNgn : monthlyPrice * 10;
              const displayMonthlyEquivalent = isFree ? 0 : billingCycle === 'annual' ? Math.round(annualPrice / 12) : monthlyPrice;
              const isPopular = plan.popular || plan.code === 'BUSINESS';

              return (
                <div
                  key={plan.code || plan.id}
                  className={`rounded-3xl bg-white border p-6 flex flex-col justify-between relative transition-all duration-200 ${
                    isPopular
                      ? 'border-2 border-teal-600 shadow-2xl ring-4 ring-teal-500/10'
                      : 'border-slate-200/90 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-teal-600 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Plan Name & Price */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                        {isFree && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-snug min-h-[36px]">
                        {plan.description || 'Verified device tracking, POS checkout, and thermal receipts.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                          ₦{displayMonthlyEquivalent.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{isFree ? '/ forever' : '/ month'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {isFree
                          ? 'Zero credit card required'
                          : billingCycle === 'annual'
                          ? `₦${annualPrice.toLocaleString()} / year (Save 20%)`
                          : 'Billed monthly'}
                      </p>
                    </div>

                    {/* Feature Checklist with Collapsible See More */}
                    {(() => {
                      const allFeatures = Array.isArray(plan.features) && plan.features.length > 0 ? plan.features : [];
                      const planKey = plan.id || plan.code || idx.toString();
                      const isExpanded = Boolean(expandedPlanIds[planKey]);
                      const PREVIEW_LIMIT = 5;
                      const hasMore = allFeatures.length > PREVIEW_LIMIT;
                      const displayedFeatures = hasMore && !isExpanded ? allFeatures.slice(0, PREVIEW_LIMIT) : allFeatures;

                      return (
                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                              Included Features ({allFeatures.length > 0 ? allFeatures.length : 3})
                            </span>
                            {hasMore && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {isExpanded ? 'All features shown' : `+${allFeatures.length - PREVIEW_LIMIT} more`}
                              </span>
                            )}
                          </div>

                          <ul className="space-y-2 text-xs text-slate-700 font-medium transition-all duration-200">
                            {allFeatures.length > 0 ? (
                              displayedFeatures.map((feat: string, fIdx: number) => (
                                <li key={fIdx} className="flex items-start gap-2 animate-in fade-in duration-150">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="leading-snug">{feat}</span>
                                </li>
                              ))
                            ) : (
                              <>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>
                                    {plan.maxDevices && plan.maxDevices > 0
                                      ? `Up to ${plan.maxDevices.toLocaleString()} Phone Registrations`
                                      : 'Unlimited Phone Registrations'}
                                  </span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>IMEI & Barcode Ledger</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>POS Receipts</span>
                                </li>
                              </>
                            )}
                          </ul>

                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => togglePlanExpand(planKey)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline pt-1 cursor-pointer transition select-none"
                            >
                              <span>
                                {isExpanded
                                  ? 'Show less'
                                  : `+ Show ${allFeatures.length - PREVIEW_LIMIT} more features`}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Call to Action Button */}
                  <div className="pt-6">
                    {isLoggedIn ? (
                      isFree ? (
                        <Button
                          variant="secondary"
                          size="md"
                          fullWidth
                          disabled
                          className="font-bold text-xs py-2.5 bg-slate-100 text-slate-600"
                        >
                          <span>Standard Tier</span>
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          onClick={() => handlePlanAction(plan)}
                          className={`font-bold text-xs py-2.5 ${
                            isPopular
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          <span>Subscribe →</span>
                        </Button>
                      )
                    ) : (
                      <Link href={`/onboarding?plan=${(plan.code || plan.id || 'FREE').toUpperCase()}`}>
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          className={`font-bold text-xs py-2.5 ${
                            isFree
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                              : isPopular
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isFree ? 'Start Free Forever →' : 'Start 14-Day Free Trial →'}
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
