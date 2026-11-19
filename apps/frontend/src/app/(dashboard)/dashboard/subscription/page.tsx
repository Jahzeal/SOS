'use client';

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Smartphone,
  Receipt,
  Check,
  RefreshCw,
  Building2,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBusinessProfile, usePublicPlans, useDashboardCacheUtils } from '@/hooks/useDashboardQueries';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';
import { useAuthStore } from '@/store/useAuthStore';
import { planFeatureLabel } from '@/lib/plan-features';

/** 0 (or nothing) means no limit on the plan. */
const isUnlimited = (n: any) => !(Number(n) > 0);
const limitText = (n: any) => (isUnlimited(n) ? 'Unlimited' : Number(n).toLocaleString('en-NG'));
const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

/** The plan's own limits and features exactly as set in Admin → Plans. */
function planLines(plan: any): string[] {
  const lines = [
    isUnlimited(plan?.maxDevices) ? 'Unlimited devices' : `Up to ${limitText(plan.maxDevices)} devices`,
    isUnlimited(plan?.maxStaff)
      ? 'Unlimited staff accounts'
      : `${limitText(plan.maxStaff)} staff account${Number(plan.maxStaff) === 1 ? '' : 's'} (owner included)`,
    isUnlimited(plan?.maxBranches)
      ? 'Unlimited branches'
      : `${limitText(plan.maxBranches)} branch${Number(plan.maxBranches) === 1 ? '' : 'es'}`,
  ];
  const features = (Array.isArray(plan?.features) ? plan.features : [])
    .map((f: string) => planFeatureLabel(String(f), plan))
    // The limits above already cover these.
    .filter((f: string) => !/devices$|^device capacity/i.test(f));
  return [...lines, ...features];
}

/** Monthly price, and the yearly price only when one is set (no guessing). */
function prices(plan: any) {
  const monthly = Number(plan?.monthlyPriceNgn) || 0;
  const annual = Number(plan?.annualPriceNgn) || 0;
  const savingPct = monthly > 0 && annual > 0 && annual < monthly * 12 ? Math.round((1 - annual / (monthly * 12)) * 100) : 0;
  return { monthly, annual, savingPct };
}

const STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'Active', tone: 'bg-success-100 text-success-800' },
  PENDING_PAYMENT: { label: 'Payment pending', tone: 'bg-warning-100 text-warning-800' },
  TRIAL: { label: 'Trial', tone: 'bg-warning-100 text-warning-800' },
  EXPIRED: { label: 'Expired', tone: 'bg-danger-100 text-danger-800' },
  PAST_DUE: { label: 'Expired', tone: 'bg-danger-100 text-danger-800' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-danger-100 text-danger-800' },
  FREE: { label: 'Free (old)', tone: 'bg-slate-100 text-slate-700' },
};

function UsageMeter({ icon, label, used, max }: { icon: React.ReactNode; label: string; used: number; max: any }) {
  const unlimited = isUnlimited(max);
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Number(max)) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-xs font-bold">
        <span className="text-slate-300 flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className={`font-mono ${pct >= 90 ? 'text-warning-400' : 'text-accent-400'}`}>
          {unlimited ? `${used.toLocaleString('en-NG')} (Unlimited)` : `${used.toLocaleString('en-NG')} / ${limitText(max)}`}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${unlimited ? 'bg-success-500 w-full' : pct >= 90 ? 'bg-warning-500' : 'bg-accent-500'}`}
          style={unlimited ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BusinessSubscriptionPage() {
  const { user } = useAuthStore();
  const { data: businessProfile, refetch: refetchProfile } = useBusinessProfile();
  const { data: publicPlans = [] } = usePublicPlans();
  const { invalidateBusinessProfile } = useDashboardCacheUtils();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [checkout, setCheckout] = useState<{ plan: any; cycle: 'MONTHLY' | 'ANNUAL' } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const business: any = businessProfile || user?.business;
  const currentPlanCode = String(business?.plan || '').toUpperCase();
  const subscriptionStatus = String(business?.subscriptionStatus || '').toUpperCase();
  const status = STATUS[subscriptionStatus] || { label: subscriptionStatus || '—', tone: 'bg-slate-100 text-slate-700' };

  // The store's plan as saved in Admin → Plans (its own row first, then the public list).
  const activePlan =
    business?.subscriptionPlan ||
    publicPlans.find((p: any) => p.id === business?.planId || String(p.code || '').toUpperCase() === currentPlanCode) ||
    null;

  const planName = activePlan?.name || currentPlanCode || 'No plan';
  const current = prices(activePlan);
  const endsAt = business?.subscriptionEndsAt ? new Date(business.subscriptionEndsAt) : null;
  const endsLabel = endsAt ? endsAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const daysLeft = endsAt ? Math.ceil((endsAt.getTime() - Date.now()) / 864e5) : null;

  const trialInfo = useMemo(() => {
    if (subscriptionStatus !== 'TRIAL' || !business?.trialEndsAt) return null;
    const end = new Date(business.trialEndsAt);
    const diffDays = Math.ceil((end.getTime() - Date.now()) / 864e5);
    return {
      endDate: end.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }),
      daysRemaining: Math.max(0, diffDays),
      isExpired: diffDays <= 0,
    };
  }, [subscriptionStatus, business?.trialEndsAt]);

  // Usage, counted on the server (switched-off staff are not counted).
  const deviceCount = business?._count?.phoneRecords ?? 0;
  const staffCount = business?._count?.users ?? 1;
  const branchCount = business?._count?.branches ?? 1;
  const salesCount = business?._count?.sales ?? 0;

  // Biggest real saving for paying yearly, from the prices set in Admin → Plans.
  const bestSaving = Math.max(0, ...publicPlans.map((p: any) => prices(p).savingPct));
  const anyAnnual = publicPlans.some((p: any) => prices(p).annual > 0);

  const showPlans = () => document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const openCheckout = (plan: any) => {
    setCheckout({ plan, cycle: billingCycle === 'annual' && prices(plan).annual > 0 ? 'ANNUAL' : 'MONTHLY' });
  };

  const handleCheckoutSuccess = () => {
    invalidateBusinessProfile();
    refetchProfile();
    setCheckout(null);
  };

  const faqs = [
    {
      q: 'What happens when my paid plan runs out?',
      a: 'Your devices, sales and receipts stay safe. To keep adding new records, renew the plan.',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Subscription & Business Plan</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Your plan, what it includes, and how much of it you are using.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => refetchProfile()} leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={showPlans} leftIcon={<Layers className="w-3.5 h-3.5" />}>
            See plans
          </Button>
        </div>
      </div>

      {/* Legacy trial notice. New stores never get a trial. */}
      {trialInfo && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            trialInfo.isExpired
              ? 'bg-danger-50 border-danger-200 text-danger-950'
              : trialInfo.daysRemaining <= 3
              ? 'bg-warning-50 border-warning-200 text-warning-950'
              : 'bg-accent-50/80 border-accent-200 text-accent-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-accent-600 text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base">
                {trialInfo.isExpired ? 'Your Trial Has Ended' : `${trialInfo.daysRemaining} Days Left on Your Trial`} · Ends {trialInfo.endDate}
              </span>
              <p className="text-xs font-medium opacity-90 mt-0.5">
                {trialInfo.isExpired ? 'Pay for a plan to keep adding stock and making sales.' : 'Pay for a plan before it ends to keep full access.'}
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" className="shrink-0 whitespace-nowrap" onClick={showPlans}>
            Choose a plan →
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current plan */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${status.tone}`}>{status.label}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{planName}</h2>
                {activePlan?.description && <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{activePlan.description}</p>}
                {endsLabel && subscriptionStatus === 'ACTIVE' && (
                  <p className={`text-xs font-bold mt-2 ${daysLeft !== null && daysLeft <= 7 ? 'text-warning-700' : 'text-slate-500'}`}>
                    Renews or ends on {endsLabel}
                    {daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : ''}
                  </p>
                )}
              </div>
              {current.monthly > 0 && (
                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-accent-600 block">{naira(current.monthly)}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase block">Per Month</span>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">What your plan includes</h3>
              {activePlan ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 font-medium">
                  {planLines(activePlan).map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">No plan yet. Choose one to start.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Store: <strong className="text-slate-900">{business?.name}</strong>
            </div>
            <div className="flex items-center gap-2">
              {activePlan && current.monthly > 0 && (
                <Button variant="secondary" size="sm" onClick={() => setCheckout({ plan: activePlan, cycle: 'MONTHLY' })}>
                  {subscriptionStatus === 'ACTIVE' ? 'Renew' : 'Pay now'}
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={showPlans} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Change plan
              </Button>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider">How much you are using</h3>
              <Badge variant="new" size="sm" className="bg-accent-500/20 text-accent-300 border-accent-500/30">
                Live
              </Badge>
            </div>
            <div className="mt-5 space-y-5">
              <UsageMeter icon={<Smartphone className="w-3.5 h-3.5 text-accent-400" />} label="Devices" used={deviceCount} max={activePlan?.maxDevices} />
              <UsageMeter icon={<Users className="w-3.5 h-3.5 text-accent-400" />} label="Staff accounts (owner included)" used={staffCount} max={activePlan?.maxStaff} />
              <UsageMeter icon={<Building2 className="w-3.5 h-3.5 text-accent-400" />} label="Branches" used={branchCount} max={activePlan?.maxBranches} />
              <UsageMeter icon={<Receipt className="w-3.5 h-3.5 text-accent-400" />} label="Invoices & Receipts" used={salesCount} max={0} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3 text-xs text-slate-300 font-medium">
            <ShieldCheck className="w-5 h-5 text-accent-400 shrink-0" />
            <span>All records have permanent cryptographically signed QR codes and IMEI fraud checks.</span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <section id="available-plans" className="space-y-5 pt-2 scroll-mt-24">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Plans</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Prices, limits and features as they are today.</p>
        </div>
        <div className="space-y-5">
        {anyAnnual && (
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              {bestSaving > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-success-100 text-success-800 text-[11px] font-black">Save up to {bestSaving}%</span>
              )}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {publicPlans.map((plan: any) => {
            const isCurrent = String(plan.code || '').toUpperCase() === currentPlanCode;
            const p = prices(plan);
            const yearly = billingCycle === 'annual' && p.annual > 0;
            return (
              <div
                key={plan.id || plan.code}
                className={`rounded-2xl p-5 flex flex-col justify-between relative ${
                  isCurrent ? 'bg-white border-2 border-accent-600 ring-4 ring-accent-500/10' : 'bg-white border border-slate-200'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-5 px-3 py-0.5 rounded-full bg-accent-600 text-white text-xs font-black uppercase tracking-wider">
                    Your plan
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                  {plan.description && <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{plan.description}</p>}
                  <div className="mt-3 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">{naira(yearly ? p.annual : p.monthly)}</span>
                      <span className="text-xs text-slate-400 font-bold">/ {yearly ? 'year' : 'month'}</span>
                    </div>
                    {yearly && p.savingPct > 0 && (
                      <span className="text-xs text-success-700 font-bold block mt-0.5">
                        Save {p.savingPct}% ({naira(p.monthly * 12 - p.annual)}) compared with monthly
                      </span>
                    )}
                    {billingCycle === 'annual' && p.annual <= 0 && (
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">Monthly only</span>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                    {planLines(plan).map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-accent-600 shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-5">
                  <Button variant={isCurrent ? 'secondary' : 'primary'} fullWidth size="md" onClick={() => openCheckout(plan)}>
                    {isCurrent ? (subscriptionStatus === 'ACTIVE' ? 'Renew this plan' : 'Pay for this plan') : `Choose ${plan.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </section>

      {/* FAQ */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-accent-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">Frequently Asked Questions</h3>
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
                {expandedFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {expandedFaq === idx && <p className="mt-2 text-xs text-slate-600 font-medium leading-relaxed">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Paystack payment */}
      {checkout && (
        <PaystackCheckoutModal
          isOpen={!!checkout}
          onClose={() => setCheckout(null)}
          plan={checkout.plan}
          initialBillingCycle={checkout.cycle}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}
