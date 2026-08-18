'use client';

import React from 'react';
import { WifiOff, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ApiErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
  className?: string;
}

export function ApiErrorState({
  title = 'Connection Interrupted',
  message = 'Unable to communicate with VerifyFlow servers. Please check your network connection and try again.',
  onRetry,
  isRetrying = false,
  compact = false,
  className = '',
}: ApiErrorStateProps) {
  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            isLoading={isRetrying}
            leftIcon={<RotateCcw className="w-3 h-3" />}
            className="shrink-0 bg-white hover:bg-rose-100 text-rose-900 border-rose-200"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4 max-w-md mx-auto my-6 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
        <WifiOff className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            isLoading={isRetrying}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="shadow-sm"
          >
            {isRetrying ? 'Reconnecting...' : 'Retry Connection'}
          </Button>
        </div>
      )}
    </div>
  );
}
