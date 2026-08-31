'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';

interface PaystackCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    code: string;
    name: string;
    description?: string;
    monthlyPriceNgn: number;
    annualPriceNgn?: number;
    maxDevices?: number;
    features?: string[];
  };
  onSuccess: (updatedBusiness: any) => void;
}

export function PaystackCheckoutModal({ isOpen, onClose, plan, onSuccess }: PaystackCheckoutModalProps) {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen || !plan) return null;

  const monthlyPrice = plan.monthlyPriceNgn || 0;
  const annualPrice = plan.annualPriceNgn && plan.annualPriceNgn > 0 ? plan.annualPriceNgn : monthlyPrice * 10;
  const currentPrice = billingCycle === 'ANNUAL' ? annualPrice : monthlyPrice;
  const savingsNgn = billingCycle === 'ANNUAL' ? monthlyPrice * 12 - annualPrice : 0;

  const handlePayWithPaystack = async () => {
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      const initRes = await api.initializeSubscriptionPayment({
        planCode: plan.code,
        billingCycle,
      });

      if (!initRes?.success || !initRes.reference) {
        throw new Error('Failed to initialize Paystack checkout.');
      }

      const reference = initRes.reference;
      const accessCode = initRes.accessCode;
      const authorizationUrl = initRes.authorizationUrl;

      // Check if Paystack Inline JS is available or load it dynamically
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
                setSuccessData(verifyRes.business);
                onSuccess(verifyRes.business);
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
        // Fallback: Redirect to Paystack hosted authorization URL
        if (authorizationUrl) {
          window.location.href = authorizationUrl;
        } else {
          throw inlineErr;
        }
      }
    } catch (err: any) {
      console.error('Paystack initialization error:', err);
      setErrorMessage(err.message || 'Unable to connect to Paystack payment gateway. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Upgrade Store Subscription</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">{plan.name} Tier</h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            {plan.description || 'Unlock advanced inventory capacities, receipts, and platform features.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Success State */}
          {successData ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Subscription Active!</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Your store has been successfully upgraded to the <strong>{plan.name}</strong> tier.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Return to Dashboard
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
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-extrabold">
                      Save ₦{savingsNgn.toLocaleString()}
                    </span>
                  )}
                </button>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Amount</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    ₦{currentPrice.toLocaleString()}
                    <span className="text-xs text-slate-400 font-medium ml-1">
                      /{billingCycle === 'ANNUAL' ? 'year' : 'month'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {plan.maxDevices ? `${plan.maxDevices.toLocaleString()} Devices Limit` : 'Unlimited Devices'}
                  </div>
                </div>
              </div>

              {/* Feature Checklist */}
              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Included Benefits:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-700">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">✕</button>
                </div>
              )}

              {/* Payment CTA */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handlePayWithPaystack}
                  disabled={isInitializing || isVerifying}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isInitializing || isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isVerifying ? 'Verifying with Paystack...' : 'Connecting to Paystack...'}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₦{currentPrice.toLocaleString()} via Paystack</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Secured 256-bit encrypted checkout powered by Paystack</span>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
