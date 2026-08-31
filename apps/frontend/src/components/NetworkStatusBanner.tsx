'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const checkConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return;
    }

    setIsRetrying(true);
    try {
      // Ping check to verify true internet connectivity
      const res = await fetch('/manifest.json', { method: 'HEAD', cache: 'no-store' });
      if (res.ok || res.status < 500) {
        if (!isOnline) {
          setIsOnline(true);
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 3500);
        }
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsRetrying(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat check if offline
    const interval = setInterval(() => {
      if (!navigator.onLine || !isOnline) {
        checkConnection();
      }
    }, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, isOnline]);

  // Don't render anything if connected and not showing the restored toast
  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[99999] px-4 py-2.5 transition-all duration-300 transform shadow-md"
    >
      {!isOnline ? (
        <div className="max-w-4xl mx-auto bg-amber-500 text-slate-950 border border-amber-400 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg shadow-amber-500/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
              <div className="text-xs font-extrabold tracking-tight text-slate-950">
                You are currently offline. <span className="font-semibold text-slate-900 hidden sm:inline">Please check your internet connection.</span>
              </div>
            </div>
          </div>

          <button
            onClick={checkConnection}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer shrink-0 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
          </button>
        </div>
      ) : (
        <div className="max-w-md mx-auto bg-emerald-600 text-white rounded-xl px-4 py-2 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <Wifi className="w-4 h-4 text-emerald-200" />
          <span className="text-xs font-extrabold">Internet connection restored</span>
        </div>
      )}
    </div>
  );
}
