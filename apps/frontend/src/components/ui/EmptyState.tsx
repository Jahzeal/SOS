'use client';

import React from 'react';
import { Button } from './Button';
import { ShieldCheck } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      {/* Icon / Isometric Container */}
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-subtle">
        {icon || <ShieldCheck className="w-8 h-8 text-blue-600" />}
      </div>

      <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-2.5 flex-wrap w-full">
          {secondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
