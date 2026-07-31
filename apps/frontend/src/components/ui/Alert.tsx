'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'info' | 'warning' | 'danger';

export interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function Alert({
  type = 'info',
  title,
  children,
  onClose,
  action,
  className = '',
}: AlertProps) {
  const configs: Record<
    AlertType,
    { bg: string; border: string; text: string; titleColor: string; icon: React.ReactNode }
  > = {
    success: {
      bg: 'bg-emerald-50/90',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      titleColor: 'text-emerald-950',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50/90',
      border: 'border-blue-200',
      text: 'text-blue-800',
      titleColor: 'text-blue-950',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50/90',
      border: 'border-amber-200',
      text: 'text-amber-800',
      titleColor: 'text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    danger: {
      bg: 'bg-rose-50/90',
      border: 'border-rose-200',
      text: 'text-rose-800',
      titleColor: 'text-rose-950',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
  };

  const config = configs[type];

  return (
    <div
      className={`p-4 rounded-card border ${config.bg} ${config.border} flex items-start gap-3 transition-all ${className}`}
    >
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className={`text-xs sm:text-sm font-semibold ${config.titleColor} mb-0.5`}>{title}</h4>}
        <div className={`text-xs sm:text-sm ${config.text} leading-relaxed`}>{children}</div>
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-2 text-xs font-semibold underline hover:no-underline ${config.titleColor}`}
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`p-1 rounded-md hover:bg-black/5 ${config.text} transition-colors shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
