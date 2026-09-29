'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Sparkles, X, ArrowUpCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PwaRegister() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Prevent infinite reload loop when controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    });

    const handleRegistration = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);

      // 1. If there's already a worker waiting, show modal immediately
      if (reg.waiting) {
        setShowUpdateModal(true);
      }

      // 2. Listen for new updatefound events
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed & ready
            setShowUpdateModal(true);
          }
        });
      });
    };

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          handleRegistration(reg);

          // Periodically check for updates every 30 minutes
          const interval = setInterval(() => {
            reg.update().catch(() => {});
          }, 30 * 60 * 1000);

          // Also check when window regains focus or comes back online
          window.addEventListener('focus', () => reg.update().catch(() => {}));
          window.addEventListener('online', () => reg.update().catch(() => {}));

          return () => clearInterval(interval);
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration error:', err);
        });
    });
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.waiting.postMessage({ type: 'CLEAR_CACHE' });
    } else {
      // Fallback reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdateModal(false);
  };

  if (!showUpdateModal) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 sm:bottom-6 sm:right-6 sm:left-auto z-[99999] p-4 max-w-md w-full animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto font-sans">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white rounded-2xl shadow-2xl p-5 space-y-4 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-white tracking-tight">
                  New Version Available
                </h4>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  Update
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                NoxGuarda Retail OS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss update for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          A newer update is available with invoice editing, print improvements, and performance upgrades. Update now to ensure seamless operation.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-1/3 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            Later
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleApplyUpdate}
            className="w-2/3 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating App...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update & Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

