'use client';

import React from 'react';

export type BadgeVariant =
  | 'verified'
  | 'pending'
  | 'sold'
  | 'warrantyActive'
  | 'warrantyExpired'
  | 'new'
  | 'enterprise'
  | 'business'
  | 'starter'
  | 'success'
  | 'error'
  | 'warning'
  | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'neutral',
  children,
  showDot = true,
  className = '',
  size = 'md',
}: BadgeProps) {
  const styles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
    verified: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    warrantyActive: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
    },
    warrantyExpired: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      dot: 'bg-rose-500',
    },
    error: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      dot: 'bg-rose-500',
    },
    sold: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
    new: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      dot: 'bg-blue-500',
    },
    business: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      dot: 'bg-blue-600',
    },
    enterprise: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
      dot: 'bg-indigo-600',
    },
    starter: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
    neutral: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const selected = styles[variant];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${selected.bg} ${selected.text} ${selected.border} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />}
      <span>{children}</span>
    </span>
  );
}
