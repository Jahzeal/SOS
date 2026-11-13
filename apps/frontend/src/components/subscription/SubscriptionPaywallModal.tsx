'use client';
import { Button } from '@/components/ui/Button';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Check,
  ChevronRight,
  Gift,
  ArrowLeft,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useSubscriptionGuard, PlanDetails } from '@/hooks/useSubscriptionGuard';
import { api } from '@/lib/api';
import Link from 'next/link';

export function SubscriptionPaywallModal() {
  const {
    isPaywallOpen,
    closePaywall,
    selectedPlan,
    formattedTrialEndDate,
    isLegacyTrial,
    paywallContextAction,
    switchToFreePlan,
    refreshSubscription,
  } = useSubscriptionGuard();

  const [viewMode, setViewMode] = useState<'PAY_PLAN' | 'FREE_DETAILS'>('PAY_PLAN');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<any>(null);
  const [successDowngrade, setSuccessDowngrade] = useState(false);

  // Sync view mode when modal opens
  useEffect(() => {
    if (isPaywallOpen) {
      setErrorMessage(null);
      setSuccessPayment(null);
      setSuccessDowngrade(false);
      if (paywallContextAction === 'free_details') {
        setViewMode('FREE_DETAILS');
      } else {
        setViewMode('PAY_PLAN');
      }
    }
  }, [isPaywallOpen, paywallContextAction]);

  if (!isPaywallOpen || !selectedPlan) return null;

  const planName = selectedPlan.name || 'Starter';
  const monthlyPrice = selectedPlan.monthlyPriceNgn || 5000;
  const annualPrice =
    selectedPlan.annualPriceNgn && selectedPlan.annualPriceNgn > 0
      ? selectedPlan.annualPriceNgn
      : monthlyPrice * 10;
  const currentPrice = billingCycle === 'ANNUAL' ? annualPrice : monthlyPrice;
  const savingsNgn = billingCycle === 'ANNUAL' ? monthlyPrice * 12 - annualPrice : 0;

  const getActionReason = () => {
    switch (paywallContextAction) {
      case 'register_device':
        return 'to register new devices in inventory';
      case 'create_sale':
        return 'to issue sales receipts and process checkouts';
      case 'create_quote':
        return 'to generate and dispatch client price quotations';
      case 'add_staff':
        return 'to add more staff members and operators';
      default:
        return 'to continue registering devices and issuing digital receipts';
    }
  };

  const handlePayWithPaystack = async () => {
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      const initRes = await api.initializeSubscriptionPayment({
        planCode: selectedPlan.code,
        billingCycle,
      });

      if (!initRes?.success || !initRes.reference) {
        throw new Error('Failed to initialize Paystack checkout.');
      }

      const reference = initRes.reference;
      const accessCode = initRes.accessCode;
      const authorizationUrl = initRes.authorizationUrl;

      // Check if Paystack Inline JS is available or load dynamically
      const loadPaystackInline = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).PaystackPop) {
            resolve((window as any).PaystackPop);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://js.paystack.co/v1/inline.js';
          script.async = true;
          script.onload = () => resolve((window as any).PaystackPop);
          script.onerror = () => reject(new Error('Failed to load Paystack popup'));
          document.body.appendChild(script);
        });
      };

      try {
        const PaystackPop = await loadPaystackInline();
        const handler = PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder_key',
          access_code: accessCode,
          onClose: () => {
            setIsInitializing(false);
          },
          callback: async (response: any) => {
            setIsVerifying(true);
            try {
              const verifyRes = await api.verifySubscriptionPayment(reference);
              if (verifyRes?.success) {
                setSuccessPayment(verifyRes.business);
                await refreshSubscription();
              }
            } catch (vErr: any) {
              setErrorMessage(vErr.message || 'Payment completed but verification failed. Please refresh.');
            } finally {
              setIsVerifying(false);
            }
          },
        });
        handler.openIframe();
      } catch (inlineErr) {
        if (authorizationUrl) {
          window.location.href = authorizationUrl;
        } else {
          throw inlineErr;
        }
      }
    } catch (err: any) {
      console.error('Paystack checkout error:', err);
      setErrorMessage(err.message || 'Unable to connect to Paystack payment gateway. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleConfirmSwitchToFree = async () => {
    setIsDowngrading(true);
    setErrorMessage(null);
    try {
      const ok = await switchToFreePlan();
      if (ok) {
        setSuccessDowngrade(true);
        await refreshSubscription();
      } else {
        setErrorMessage('Could not switch to the Free plan. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while switching to the Free plan.');
    } finally {
      setIsDowngrading(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* VIEW 1: PAY & ACTIVATE REGISTERED PLAN (Default)                          */}
        {/* ========================================================================= */}
        {viewMode === 'PAY_PLAN' && (
          <>
            {/* Header Ribbon with Brand Teal Theme */}
            <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-accent-950 text-white relative shrink-0 border-b border-accent-500/20">
              <button
                onClick={closePaywall}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning-500/20 text-warning-300 border border-warning-500/30 text-xs font-extrabold uppercase tracking-wider mb-2.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isLegacyTrial ? 'Trial Ended' : 'Plan Expired'}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pay for your {planName} Plan
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                {isLegacyTrial ? (
                  <>
                    Your trial of the <strong className="text-accent-300">{planName} Plan</strong> ended on{' '}
                    <strong className="text-warning-200">{formattedTrialEndDate}</strong>.
                  </>
                ) : (
                  <>
                    Your <strong className="text-accent-300">{planName} Plan</strong> is no longer active.
                  </>
                )}{' '}
                Pay for the plan {getActionReason()}, or move to the Free plan (free forever, up to 10 devices).
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Success Payment State */}
              {successPayment ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-accent-50 text-accent-600 rounded-2xl flex items-center justify-center mx-auto border border-accent-200 shadow-lg shadow-accent-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Subscription Active!</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Your store subscription for <strong>{planName}</strong> has been successfully activated.
                    </p>
                  </div>
                  <Button variant="primary" size="lg" fullWidth
                    onClick={closePaywall}>
                    Continue Working
                  </Button>
                </div>
              ) : (
                <>
                  {/* Billing Cycle Switcher */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('MONTHLY')}
                      className={`flex-1 py-2 rounded-lg transition ${
                        billingCycle === 'MONTHLY'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('ANNUAL')}
                      className={`flex-1 py-2 rounded-lg transition relative ${
                        billingCycle === 'ANNUAL'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Annual Billing</span>
                      {savingsNgn > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-accent-100 text-accent-800 font-extrabold">
                          Save ₦{savingsNgn.toLocaleString()}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Selected Plan Summary Card with Brand Teal Scheme */}
                  <div className="p-4 bg-accent-50/40 border-2 border-accent-200/90 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase text-accent-800 bg-accent-100/90 px-2 py-0.5 rounded tracking-wider">
                          Your Plan
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">{planName} Plan</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900 font-mono">
                          ₦{currentPrice.toLocaleString()}
                        </div>
                        <div className="text-xs font-bold text-slate-500">
                          /{billingCycle === 'ANNUAL' ? 'year' : 'month'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-accent-100 grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-accent-600 shrink-0" />
                        <span>{selectedPlan.maxDevices ? `${selectedPlan.maxDevices.toLocaleString()} Devices Limit` : 'Unlimited Devices'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-accent-600 shrink-0" />
                        <span>Thermal POS Receipts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-accent-600 shrink-0" />
                        <span>Digital Warranty QR</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-accent-600 shrink-0" />
                        <span>Commercial Quotes</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 text-xs font-bold rounded-xl flex items-center justify-between">
                      <span>{errorMessage}</span>
                      <Button variant="ghostDanger" size="icon" aria-label="Dismiss message" onClick={() => setErrorMessage(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-1">
                    {/* Primary CTA: Pay for selected plan */}
                    <Button variant="primary" size="lg" fullWidth
                      type="button"
                      onClick={handlePayWithPaystack}
                      disabled={isInitializing || isVerifying}>
                      {isInitializing || isVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isVerifying ? 'Verifying payment...' : 'Connecting Paystack...'}</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay & Activate {planName} Plan (₦{currentPrice.toLocaleString()}{billingCycle === 'ANNUAL' ? '/yr' : '/mo'})</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>

                    {/* Secondary Option: Learn about and use the Free plan */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
                      <Button variant="secondary" size="sm" fullWidth
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setViewMode('FREE_DETAILS');
                        }}>
                        <span>Use the Free plan →</span>
                      </Button>
                      <span className="text-xs text-slate-400 font-medium text-center">
                        See what the Free plan includes and its limits before deciding.
                      </span>
                    </div>

                    {/* View other plans link */}
                    <div className="text-center pt-1">
                      <Link
                        href="/dashboard/settings?tab=subscription"
                        onClick={closePaywall}
                        className="text-xs font-bold text-accent-700 hover:text-accent-900 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Need a different tier? Explore All Plans</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium pt-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Secured 256-bit encrypted checkout powered by Paystack</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WHAT FREE BASIC OFFERS (Detailed Breakdown & Confirmation)        */}
        {/* ========================================================================= */}
        {viewMode === 'FREE_DETAILS' && (
          <>
            {/* Header Ribbon with Brand Teal Theme */}
            <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-accent-950 text-white relative shrink-0 border-b border-accent-500/20">
              <button
                onClick={closePaywall}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 border border-accent-500/30 text-xs font-extrabold uppercase tracking-wider mb-2.5">
                <Gift className="w-3.5 h-3.5" />
                <span>Free Plan Overview</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                What the Free Plan Offers
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Review what is included and the limits before switching your store to the Free plan. It is free forever.
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {successDowngrade ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-accent-50 text-accent-600 rounded-2xl flex items-center justify-center mx-auto border border-accent-200 shadow-lg shadow-accent-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Free Plan Active!</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Your store has been switched to the <strong>Free</strong> plan. All your past records, devices, and receipts remain safe.
                    </p>
                  </div>
                  <Button variant="primary" size="lg" fullWidth
                    onClick={closePaywall}>
                    Continue to Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  {/* Included Features Card */}
                  <div className="p-4 bg-accent-50/60 border border-accent-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-600 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-accent-900">
                        Included in the Free plan:
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Up to 10 Devices:</strong>
                          <span className="text-slate-600"> Full IMEI & SKU inventory tracking.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">POS Thermal Receipts:</strong>
                          <span className="text-slate-600"> 58mm & 80mm sales receipts & customer lookup.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Digital Warranty & Anti-Theft QR:</strong>
                          <span className="text-slate-600"> Public `/verify` lookups and verification passports.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">All Existing Data Kept:</strong>
                          <span className="text-slate-600"> All your past records and sales stay completely safe.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paused / Restricted Features Comparison */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Paused from your {planName} Plan:
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                        <span>More than 10 devices in your stock records</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                        <span>Commercial Price Quotations generator (PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                        <span>Custom store logo & branding on verification seals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                        <span>Multi-staff cashier and technician accounts</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 text-xs font-bold rounded-xl flex items-center justify-between">
                      <span>{errorMessage}</span>
                      <Button variant="ghostDanger" size="icon" aria-label="Dismiss message" onClick={() => setErrorMessage(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2.5 pt-1">
                    <Button variant="primary" size="lg" fullWidth
                      type="button"
                      onClick={handleConfirmSwitchToFree}
                      disabled={isDowngrading}>
                      {isDowngrading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Switching to the Free plan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Switch to the Free Plan</span>
                        </>
                      )}
                    </Button>

                    <Button variant="secondary" size="sm" fullWidth
                      type="button"
                      onClick={() => setViewMode('PAY_PLAN')}>
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Pay for {planName} Plan (₦{currentPrice.toLocaleString()}{billingCycle === 'ANNUAL' ? '/yr' : '/mo'})</span>
                    </Button>
                  </div>
                </>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
}
