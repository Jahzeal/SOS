'use client';

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
        setErrorMessage('Failed to switch to Free Basic plan. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while switching to the Free plan.');
    } finally {
      setIsDowngrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* VIEW 1: PAY & ACTIVATE REGISTERED PLAN (Default)                          */}
        {/* ========================================================================= */}
        {viewMode === 'PAY_PLAN' && (
          <>
            {/* Header Ribbon with Brand Teal Theme */}
            <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white relative shrink-0 border-b border-teal-500/20">
              <button
                onClick={closePaywall}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-extrabold uppercase tracking-wider mb-2.5">
                <Clock className="w-3.5 h-3.5" />
                <span>14-Day Free Trial Ended</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pay for your {planName} Plan
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Your 14-day free trial of the <strong className="text-teal-300">{planName} Plan</strong> ended on{' '}
                <strong className="text-amber-200">{formattedTrialEndDate}</strong>. Pay for your selected plan {getActionReason()}, or continue with the Free Basic Plan.
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Success Payment State */}
              {successPayment ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-200 shadow-lg shadow-teal-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Subscription Active!</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Your store subscription for <strong>{planName}</strong> has been successfully activated.
                    </p>
                  </div>
                  <button
                    onClick={closePaywall}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer"
                  >
                    Continue Working
                  </button>
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
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-teal-100 text-teal-800 font-extrabold">
                          Save ₦{savingsNgn.toLocaleString()}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Selected Plan Summary Card with Brand Teal Scheme */}
                  <div className="p-4 bg-teal-50/40 border-2 border-teal-200/90 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded tracking-wider">
                          Selected At Registration
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">{planName} Plan</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900 font-mono">
                          ₦{currentPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          /{billingCycle === 'ANNUAL' ? 'year' : 'month'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-teal-100 grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{selectedPlan.maxDevices ? `${selectedPlan.maxDevices.toLocaleString()} Devices Limit` : 'Unlimited Devices'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Thermal POS Receipts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Digital Warranty QR</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Commercial Quotes</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between">
                      <span>{errorMessage}</span>
                      <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-1">
                    {/* Primary CTA: Pay for selected plan */}
                    <button
                      type="button"
                      onClick={handlePayWithPaystack}
                      disabled={isInitializing || isVerifying}
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 active:scale-[0.99] text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
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
                    </button>

                    {/* Secondary Option: Learn & Continue with Free Basic */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setViewMode('FREE_DETAILS');
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Continue with Free Basic Plan →</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium text-center">
                        See what Free Basic includes & limits before deciding.
                      </span>
                    </div>

                    {/* View other plans link */}
                    <div className="text-center pt-1">
                      <Link
                        href="/dashboard/settings?tab=subscription"
                        onClick={closePaywall}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Need a different tier? Explore All Plans</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
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
            <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white relative shrink-0 border-b border-teal-500/20">
              <button
                onClick={closePaywall}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-extrabold uppercase tracking-wider mb-2.5">
                <Gift className="w-3.5 h-3.5" />
                <span>Free Basic Plan Overview</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                What the Free Basic Plan Offers
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Review what is included and the limits before switching your store to the Free Basic tier.
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {successDowngrade ? (
                <div className="text-center py-6 space-y-4 animate-in zoom-in duration-200">
                  <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-200 shadow-lg shadow-teal-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Free Basic Plan Active!</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Your store has been switched to the <strong>Free Basic</strong> tier. All your past records, devices, and receipts remain safe.
                    </p>
                  </div>
                  <button
                    onClick={closePaywall}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  {/* Included Features Card */}
                  <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                        Included in Free Basic:
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Up to 25 Devices / Month:</strong>
                          <span className="text-slate-600"> Full IMEI & SKU inventory tracking.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">POS Thermal Receipts:</strong>
                          <span className="text-slate-600"> 58mm & 80mm sales receipts & customer lookup.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Digital Warranty & Anti-Theft QR:</strong>
                          <span className="text-slate-600"> Public `/verify` lookups and verification passports.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
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
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Paused from your {planName} Plan:
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>High-volume device additions (&gt; 25/month)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Commercial Price Quotations generator (PDF)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Custom store logo & branding on verification seals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Multi-staff cashier and technician accounts</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between">
                      <span>{errorMessage}</span>
                      <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmSwitchToFree}
                      disabled={isDowngrading}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isDowngrading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Switching to Free Basic...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Switch to Free Basic Plan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('PAY_PLAN')}
                      className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Pay for {planName} Plan (₦{currentPrice.toLocaleString()}{billingCycle === 'ANNUAL' ? '/yr' : '/mo'})</span>
                    </button>
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
