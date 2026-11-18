'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw, X, ArrowUpCircle } from 'lucide-react';

/** Changes on every deploy (see next.config.mjs), so the installed app can tell a new version is out. */
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
const CHECK_EVERY_MS = 30 * 60 * 1000;

/** True when NoxGuarda runs as the installed app (home-screen / desktop app), not in a browser tab. */
function isInstalledApp() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    (navigator as any).standalone === true
  );
}

/**
 * Registers the app's background file (public/sw.js) and handles new deploys:
 *  - Installed app: shows "A new version is ready" and switches over when the person taps "Update now".
 *  - Browser tab: switches over silently, then reloads the next time the person moves to
 *    another page (never in the middle of what they are typing). A refresh also picks it up.
 */
export function PwaRegister() {
  const pathname = usePathname();
  const firstPathRef = useRef(pathname);
  // Browser tab: the new version has taken over; reload on the next page change.
  const silentReloadRef = useRef(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef(false);
  // Only reload when the person asked for the update (never on a first visit).
  const updateRequestedRef = useRef(false);
  // Browser tab: we switched to the new version ourselves, without asking.
  const silentUpdateRef = useRef(false);

  // Browser tab: once the new version has taken over, reload when the person moves to another page.
  useEffect(() => {
    if (pathname === firstPathRef.current) return;
    firstPathRef.current = pathname;
    if (silentReloadRef.current && !refreshingRef.current) {
      refreshingRef.current = true;
      window.location.reload();
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    // When the new version takes over after "Update now", reload once so the page runs on it.
    // In a browser tab the reload waits for the next page change instead (see below).
    const onControllerChange = () => {
      if (refreshingRef.current) return;
      if (updateRequestedRef.current) {
        refreshingRef.current = true;
        window.location.reload();
      } else if (silentUpdateRef.current) {
        silentReloadRef.current = true;
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const updateReady = (reg: ServiceWorkerRegistration) => {
      if (isInstalledApp()) {
        setShowUpdate(true);
        return;
      }
      // Browser tab: no message. Switch to the new version now; the page reloads on the next page change.
      const waiting = reg.waiting;
      if (!waiting || silentUpdateRef.current) return;
      silentUpdateRef.current = true;
      waiting.postMessage({ type: 'CLEAR_CACHE' });
      waiting.postMessage({ type: 'SKIP_WAITING' });
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      // A new version already downloaded and waiting (e.g. from a visit earlier today).
      if (reg.waiting && navigator.serviceWorker.controller) updateReady(reg);

      reg.addEventListener('updatefound', () => {
        const incoming = reg.installing;
        if (!incoming) return;
        incoming.addEventListener('statechange', () => {
          // "installed" while an older version is running = an update is ready.
          if (incoming.state === 'installed' && navigator.serviceWorker.controller) updateReady(reg);
        });
      });
    };

    const register = () => {
      navigator.serviceWorker
        .register(`/sw.js?v=${encodeURIComponent(APP_VERSION)}`)
        .then((reg) => {
          watch(reg);
          const check = () => reg.update().catch(() => {});
          interval = setInterval(check, CHECK_EVERY_MS);
          window.addEventListener('focus', check);
          window.addEventListener('online', check);
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') check();
          });
        })
        .catch((err) => console.warn('[PWA] Could not register the app worker:', err));
    };

    // Register now if the page has already finished loading, otherwise once it has.
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => {
      if (interval) clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('load', register);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyUpdate = () => {
    setIsUpdating(true);
    updateRequestedRef.current = true;
    const waiting = registration?.waiting;
    if (waiting) {
      // Old cached pages are cleared, then the new version takes over and the page reloads.
      waiting.postMessage({ type: 'CLEAR_CACHE' });
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 sm:bottom-6 sm:right-6 sm:left-auto z-[99999] p-4 max-w-sm w-full animate-in fade-in slide-in-from-bottom-6 duration-300 font-sans"
    >
      <div className="bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-2xl shadow-slate-900/15 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm tracking-tight">A new version of NoxGuarda is ready</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Update now to get the latest fixes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUpdate(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Not now"
            title="Not now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUpdate(false)}
            className="w-1/3 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Later
          </button>
          <button
            type="button"
            disabled={isUpdating}
            onClick={applyUpdate}
            className="w-2/3 py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Update now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
