'use client';

import React, { useState } from 'react';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { AlertTriangle, Clock, CreditCard, Sparkles, ArrowRight, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionStatusBanner() {
  const {
    business,
    isLoading,
    isTrialExpired,
    isTrialActive,
    trialDaysRemaining,
    formattedTrialEndDate,
    selectedPlan,
    openPaywall,
    switchToFreePlan,
    isFreePlan,
    isPaidActive,
  } = useSubscriptionGuard();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  // Strictly do not show any banner if loading, if business data is not yet verified from DB, or if on Free / Paid Active plans
  if (isLoading || !business || isDismissed || isFreePlan || isPaidActive) return null;

  const planName = selectedPlan?.name || 'Starter';
  const monthlyPrice = selectedPlan?.monthlyPriceNgn || 5000;

  // 1. Trial has Expired Banner
  if (isTrialExpired) {
    return (
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-b border-amber-300/60 px-4 py-2.5 sm:px-6 sticky top-16 z-10 backdrop-blur-md shadow-xs animate-in slide-in-from-top-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-start sm:items-center gap-2.5 text-amber-950 font-medium">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="leading-snug">
              <strong className="font-extrabold text-amber-900">14-Day Free Trial Ended:</strong>{' '}
              <span>
                Your trial of the <strong className="font-bold text-slate-900">{planName} Plan</strong> ended on{' '}
                <strong className="text-amber-900">{formattedTrialEndDate}</strong>. Pay for your selected plan to keep adding inventory and issuing receipts, or continue with Free Basic.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => openPaywall('banner')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay & Activate {planName} (₦{monthlyPrice.toLocaleString()}/mo)</span>
            </button>

            <button
              onClick={() => openPaywall('free_details')}
              className="px-3 py-1.5 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 font-bold border border-slate-300/80 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Continue with Free Basic →</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 2. Trial is Active but Ending Soon (1 to 3 days remaining)
  if (isTrialActive && trialDaysRemaining > 0 && trialDaysRemaining <= 3) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-blue-500/10 border-b border-blue-200/80 px-4 py-2 sm:px-6 sticky top-16 z-10 backdrop-blur-md text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>14-Day Free Trial:</strong> You have{' '}
              <strong className="text-blue-700 font-extrabold">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left
              </strong>{' '}
              on your {planName} Plan trial.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPaywall('trial_expiring')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-xs cursor-pointer"
            >
              Pay & Activate Early
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-400 hover:text-slate-600 transition"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
