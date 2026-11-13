'use client';
import { Button } from '@/components/ui/Button';

import React, { useState } from 'react';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { AlertTriangle, Clock, CreditCard, Sparkles, ArrowRight, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionStatusBanner() {
  const {
    business,
    isLoading,
    isTrialExpired,
    isLegacyTrial,
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

  // 1. Paid period ran out, or a legacy trial ended
  if (isTrialExpired) {
    return (
      <div className="bg-gradient-to-r from-warning-500/15 via-danger-500/10 to-warning-500/15 border-b border-warning-300/60 px-4 py-2.5 sm:px-6 sticky top-16 z-10 backdrop-blur-md shadow-xs animate-in slide-in-from-top-1">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-start sm:items-center gap-2.5 text-warning-950 font-medium">
            <span className="p-1 rounded-lg bg-warning-500/20 text-warning-800 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="leading-snug">
              <strong className="font-extrabold text-warning-900">
                {isLegacyTrial ? 'Your trial has ended:' : 'Your plan has expired:'}
              </strong>{' '}
              <span>
                {isLegacyTrial ? (
                  <>
                    Your trial of the <strong className="font-bold text-slate-900">{planName} Plan</strong> ended on{' '}
                    <strong className="text-warning-900">{formattedTrialEndDate}</strong>.
                  </>
                ) : (
                  <>
                    Your <strong className="font-bold text-slate-900">{planName} Plan</strong> is no longer active.
                  </>
                )}{' '}
                Pay for the plan to keep adding stock and issuing receipts, or move to the Free plan (free forever, up to 10 devices).
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 self-end md:self-auto shrink-0 pt-0.5 sm:pt-0">
            <button
              onClick={() => openPaywall('banner')}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-warning-600 hover:bg-warning-700 active:scale-95 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer text-xs sm:text-xs"
            >
              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Pay & Activate (₦{monthlyPrice.toLocaleString()}/mo)</span>
            </button>

            <Button variant="link"
              onClick={() => openPaywall('free_details')}>
              <span>Use the Free plan →</span>
            </Button>
          </div>

        </div>
      </div>
    );
  }

  // 2. Legacy trial ending soon (1 to 3 days remaining). New stores never get a trial.
  if (isTrialActive && trialDaysRemaining > 0 && trialDaysRemaining <= 3) {
    return (
      <div className="bg-gradient-to-r from-accent-500/10 via-accent-500/10 to-accent-500/10 border-b border-accent-200/80 px-4 py-2 sm:px-6 sticky top-16 z-10 backdrop-blur-md text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <Clock className="w-4 h-4 text-accent-600 shrink-0" />
            <span>
              <strong>Trial ending:</strong> You have{' '}
              <strong className="text-accent-700 font-extrabold">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left
              </strong>{' '}
              on your {planName} Plan trial.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm"
              onClick={() => openPaywall('trial_expiring')}>
              Pay & Activate
            </Button>
            <Button variant="ghost" size="icon" aria-label="Dismiss banner"
              onClick={() => setIsDismissed(true)}
              title="Dismiss banner">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
