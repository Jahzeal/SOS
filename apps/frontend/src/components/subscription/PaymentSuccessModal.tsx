'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

function formatPlanName(rawPlan?: string | null): string {
  if (!rawPlan) return 'Premium';
  const clean = rawPlan.trim().toUpperCase();
  if (clean === 'STARTER') return 'Starter';
  if (clean === 'BUSINESS') return 'Business';
  if (clean === 'ENTERPRISE') return 'Enterprise';
  if (clean === 'GOLD') return 'Gold';
  return rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1).toLowerCase();
}

export function PaymentSuccessModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [planName, setPlanName] = useState<string>('Premium');
  const { user, setAuth } = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      // Check for reference returned by Paystack
      const ref = params.get('ref') || params.get('reference') || params.get('trxref');
      const isPaymentSuccess = params.get('payment') === 'success';

      if (!ref && !isPaymentSuccess) return;

      const dedupeKey = ref ? `vf_sub_success_shown_${ref}` : `vf_sub_success_shown_${new Date().toDateString()}`;
      const alreadyShown = localStorage.getItem(dedupeKey);

      if (alreadyShown) {
        // Clean URL params silently so they don't linger
        cleanUrlParams(url);
        return;
      }

      // Mark as shown immediately so it appears only once
      localStorage.setItem(dedupeKey, 'true');

      // Grab initial plan name from URL parameter if present
      const urlPlan = params.get('plan');
      if (urlPlan) {
        setPlanName(formatPlanName(urlPlan));
      } else if (user?.business?.plan) {
        setPlanName(formatPlanName(user.business.plan));
      }

      // Show modal
      setIsOpen(true);

      // Clean the URL parameters without reloading
      cleanUrlParams(url);

      // Verify reference with backend and refresh the session in background
      if (ref) {
        api
          .verifySubscriptionPayment(ref)
          .then((res: any) => {
            if (res?.business?.plan) {
              setPlanName(formatPlanName(res.business.plan));
            }
            // Refresh current user info so plan limits and UI update in real time
            return api.getMe();
          })
          .then((freshUser: any) => {
            if (freshUser?.id) {
              const token = localStorage.getItem('vf_access_token');
              if (token) {
                setAuth(freshUser, token);
                localStorage.setItem('vf_user', JSON.stringify(freshUser));
              }
            }
          })
          .catch((err) => {
            console.warn('Subscription verify/sync in background:', err);
          });
      }
    } catch (e) {
      console.warn('Error reading payment return params:', e);
    }
  }, [user, setAuth]);

  const cleanUrlParams = (url: URL) => {
    url.searchParams.delete('ref');
    url.searchParams.delete('reference');
    url.searchParams.delete('trxref');
    url.searchParams.delete('payment');
    url.searchParams.delete('plan');
    const newRelativePath = url.pathname + (url.search ? url.search : '');
    window.history.replaceState({}, '', newRelativePath);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Icon Header */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 animate-ping opacity-75" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 rounded-full p-1.5 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Modal Title & Body */}
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          🎉 Payment Successful!
        </h2>
        
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Welcome to your <span className="font-bold text-emerald-600 dark:text-emerald-400">{planName}</span> plan. Your store is now active with all premium features.
        </p>

        {/* Feature badge */}
        <div className="my-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Full access to device registry, receipts & POS features</span>
        </div>

        {/* Proceed Action Button */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleClose}
          rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-600/25"
        >
          Proceed
        </Button>
      </div>
    </div>
  );
}
