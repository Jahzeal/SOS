'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Users,
  Smartphone,
  Receipt,
  FileSpreadsheet,
  QrCode,
  Check,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBusinessProfile, usePublicPlans, useDashboardCacheUtils } from '@/hooks/useDashboardQueries';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';
import { useAuthStore } from '@/store/useAuthStore';

export default function BusinessSubscriptionPage() {
  const { user } = useAuthStore();
  const { data: businessProfile, isLoading: isProfileLoading, refetch: refetchProfile } = useBusinessProfile();
  const { data: publicPlans = [], isLoading: isPlansLoading } = usePublicPlans();
  const { invalidateBusinessProfile } = useDashboardCacheUtils();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const business = businessProfile || user?.business;
  const currentPlanCode = (business?.plan || 'STARTER101').toUpperCase();
  const subscriptionStatus = (business?.subscriptionStatus || 'TRIAL').toUpperCase();

  // Dynamically match active plan from database publicPlans or business profile
  const activePlan = publicPlans.find((p: any) => 
    (p.code || '').toUpperCase() === currentPlanCode || 
    p.id === business?.planId
  ) || business?.subscriptionPlan || publicPlans[0];

  const planName = activePlan?.name || (currentPlanCode === 'STARTER101' ? 'Starter' : currentPlanCode);
  const planDescription = activePlan?.description || `Dedicated retail inventory & verification plan for ${business?.name || 'your store'}.`;
  const monthlyPrice = activePlan?.monthlyPriceNgn ?? 5000;
  const annualPrice = activePlan?.annualPriceNgn ?? monthlyPrice * 10;
  const maxDevices = activePlan?.maxDevices || 500;
  const maxUsers = activePlan?.maxUsers || 3;

  // Calculate Trial Days Remaining
  const getTrialInfo = () => {
    if (subscriptionStatus !== 'TRIAL') return null;
    if (!business?.trialEndsAt && !business?.createdAt) return null;

    const trialEnd = business?.trialEndsAt
      ? new Date(business.trialEndsAt)
      : new Date(new Date(business.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      endDate: trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysRemaining: Math.max(0, diffDays),
      isExpired: diffDays <= 0,
    };
  };

  const trialInfo = getTrialInfo();

  // Usage stats from database _count
  const deviceCount = business?._count?.phoneRecords ?? 0;
  const staffCount = business?._count?.users ?? 1;
  const salesCount = business?._count?.sales ?? 0;

  const handleCheckoutSuccess = (updatedBusiness: any) => {
    invalidateBusinessProfile();
    refetchProfile();
    setSelectedPlanForCheckout(null);
  };

  const faqs = [
    {
      q: 'How does the 14-day free trial work?',
      a: 'All new businesses receive full access to their chosen tier for 14 days with zero commitment and no credit card required. You can register devices, issue receipts, and print QR codes immediately.',
    },
    {
      q: 'What happens when my trial expires?',
      a: 'Your registered devices and inventory data remain completely safe and intact. To continue registering new items, creating quotes, and accessing advanced analytics, simply activate an active subscription.',
    },
    {
      q: 'Can I upgrade or switch my plan at any time?',
      a: 'Yes! When upgrading to a higher tier, your new device limits and multi-staff accounts activate instantly.',
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept Nigerian Naira (NGN) via Paystack: Bank Transfer, Debit/Credit Cards (Mastercard, Visa, Verve), and USSD codes.',
    },
  ];

  return (
    <div className="space-y-8 font-sans pb-24 md:pb-12 max-w-7xl mx-auto">
      
      {/* Top Breadcrumb & Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Subscription & Business Plan
            </h1>
            <Badge variant="new" size="sm">
              Billing Management
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Manage your store's plan tier, review active entitlements, monitor inventory quotas, and upgrade seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchProfile()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Trial Expiry Warning Banner (If Trial Active or Expiring) */}
      {trialInfo && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200 ${
          trialInfo.isExpired
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : trialInfo.daysRemaining <= 3
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-teal-50/80 border-teal-200 text-teal-950'
        }`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              trialInfo.isExpired ? 'bg-rose-600 text-white' : trialInfo.daysRemaining <= 3 ? 'bg-amber-600 text-white' : 'bg-teal-600 text-white'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base">
                  {trialInfo.isExpired
                    ? '14-Day Free Trial Has Expired'
                    : `${trialInfo.daysRemaining} Days Remaining in Free Trial`}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/80 border border-current text-[10px] font-black uppercase">
                  Ends {trialInfo.endDate}
                </span>
              </div>
              <p className="text-xs font-medium opacity-90 mt-0.5">
                {trialInfo.isExpired
                  ? 'Activate an active subscription below to restore full inventory ingestion and sales features.'
                  : 'Enjoy unlimited access during your trial period. Upgrade anytime to ensure zero interruption.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const target = activePlan || publicPlans[0];
              if (target) setSelectedPlanForCheckout(target);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition shrink-0 whitespace-nowrap"
          >
            Activate Subscription →
          </button>
        </div>
      )}

      {/* Hero Active Plan & Usage Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Active Plan Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    subscriptionStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : subscriptionStatus === 'TRIAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {subscriptionStatus}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {planName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {planDescription}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xl sm:text-2xl font-black text-teal-600 block">
                  ₦{monthlyPrice.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Per Month</span>
              </div>
            </div>

            {/* Plan Entitlements Matrix */}
            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Included Store Features & Entitlements:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Up to <strong>{maxDevices > 0 ? maxDevices.toLocaleString() : 'Unlimited'}</strong> Registered Devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>{maxUsers > 0 ? maxUsers : 'Unlimited'}</strong> Staff User Accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Full POS Checkout & Receipts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Direct WhatsApp PDF Invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>IMEI & Barcode Camera Scanner</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Custom Store Logo & Branding</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Store: <strong className="text-slate-900">{business?.name}</strong>
            </div>
            <a href="#available-plans" className="text-teal-600 hover:text-teal-700 font-extrabold flex items-center gap-1">
              <span>Change or Upgrade Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right 5 Cols: Real-time Quota & Usage Meters */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">
                Store Capacity Usage
              </h3>
              <Badge variant="new" size="sm" className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                Live Stats
              </Badge>
            </div>

            <div className="mt-5 space-y-5">
              {/* Meter 1: Devices Ingested */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                    Device Stock Ingested
                  </span>
                  <span className="text-teal-400 font-mono">
                    {deviceCount} / {maxDevices} ({Math.round((deviceCount / maxDevices) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((deviceCount / maxDevices) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Meter 2: Staff Seats */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    Active Staff Accounts
                  </span>
                  <span className="text-teal-400 font-mono">
                    {staffCount} / {maxUsers} ({Math.round((staffCount / maxUsers) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((staffCount / maxUsers) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Meter 3: POS Invoices & Receipts */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-teal-400" />
                    Invoices & Receipts
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {salesCount} Total (Unlimited)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <span>All records have permanent cryptographically signed QR codes and IMEI fraud checks.</span>
          </div>
        </div>

      </div>

      {/* Available Plans Switcher & Upgrade Section */}
      <section id="available-plans" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Explore Subscription Tiers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Select a plan that matches your monthly gadget turnover and store scale.
            </p>
          </div>

          {/* Billing Switcher (Monthly / Annual) */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 border border-slate-300/60 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Billing
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {publicPlans.map((plan: any) => {
            const isCurrent = (plan.code || '').toUpperCase() === currentPlanCode;
            const monthlyPrice = plan.monthlyPriceNgn || 0;
            const annualPrice = plan.annualPriceNgn && plan.annualPriceNgn > 0 ? plan.annualPriceNgn : monthlyPrice * 10;
            const displayPrice = billingCycle === 'annual' ? Math.round(annualPrice / 12) : monthlyPrice;

            return (
              <div
                key={plan.id || plan.code}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? 'bg-white border-2 border-teal-600 ring-4 ring-teal-500/10 shadow-md'
                    : 'bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                    Your Active Plan
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    {plan.code === 'PRO' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed min-h-[36px]">
                    {plan.description || 'Optimized retail management and verification tools.'}
                  </p>

                  <div className="mt-4 pb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        ₦{displayPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">/ month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                        Billed annually (₦{annualPrice.toLocaleString()} / year)
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-5 space-y-2.5 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>{plan.maxDevices || 100}</strong> Device Stock Ingestion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>{plan.maxUsers || 3}</strong> Staff User Logins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Full POS Checkout & Receipts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Direct WhatsApp PDF Share</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Custom Store Branding & QR</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    fullWidth
                    size="md"
                    onClick={() => setSelectedPlanForCheckout(plan)}
                    className={
                      isCurrent
                        ? 'font-extrabold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'font-extrabold text-xs bg-teal-600 hover:bg-teal-500 text-white shadow-sm border-none'
                    }
                  >
                    {isCurrent ? 'Renew / Extend Subscription' : `Upgrade to ${plan.name} →`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-teal-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3.5">
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-extrabold text-slate-900 gap-4"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {expandedFaq === idx && (
                <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed animate-in fade-in duration-150">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Paystack Checkout Modal */}
      {selectedPlanForCheckout && (
        <PaystackCheckoutModal
          isOpen={!!selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          plan={selectedPlanForCheckout}
          onSuccess={handleCheckoutSuccess}
        />
      )}

    </div>
  );
}
