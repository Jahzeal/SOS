'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth-context';
import { WifiOff, CheckCircle2 } from 'lucide-react';

function NetworkStatusListener() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-slate-900 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 border-b border-slate-800 shadow-md animate-in slide-in-from-top duration-200">
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Network Disconnected — VerifyFlow is operating in offline mode. Changes will sync when reconnected.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-emerald-700 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
        <span>Connection Restored — Reconnected to VerifyFlow services.</span>
      </div>
    );
  }

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NetworkStatusListener />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
