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
      bg: 'bg-success-50',
      text: 'text-success-700',
      border: 'border-success-200/80',
      dot: 'bg-success-500',
    },
    warrantyActive: {
      bg: 'bg-success-50',
      text: 'text-success-700',
      border: 'border-success-200/80',
      dot: 'bg-success-500',
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-700',
      border: 'border-success-200/80',
      dot: 'bg-success-500',
    },
    pending: {
      bg: 'bg-warning-50',
      text: 'text-warning-800',
      border: 'border-warning-200/80',
      dot: 'bg-warning-500',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-800',
      border: 'border-warning-200/80',
      dot: 'bg-warning-500',
    },
    warrantyExpired: {
      bg: 'bg-danger-50',
      text: 'text-danger-700',
      border: 'border-danger-200/80',
      dot: 'bg-danger-500',
    },
    error: {
      bg: 'bg-danger-50',
      text: 'text-danger-700',
      border: 'border-danger-200/80',
      dot: 'bg-danger-500',
    },
    sold: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
    new: {
      bg: 'bg-accent-50',
      text: 'text-accent-700',
      border: 'border-accent-200/80',
      dot: 'bg-accent-500',
    },
    business: {
      bg: 'bg-accent-50',
      text: 'text-accent-700',
      border: 'border-accent-200/80',
      dot: 'bg-accent-600',
    },
    enterprise: {
      bg: 'bg-accent-100',
      text: 'text-accent-800',
      border: 'border-accent-300/80',
      dot: 'bg-accent-700',
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
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${selected.bg} ${selected.text} ${selected.border} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />}
      <span>{children}</span>
    </span>
  );
}
