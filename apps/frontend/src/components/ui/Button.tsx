'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghostDanger' | 'dangerOutline' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // The keyboard focus ring comes from globals.css (:focus-visible), so none is set here.
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-control transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 shadow-sm border border-accent-600 hover:border-accent-500',
      secondary:
        'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-subtle',
      ghost:
        'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 border border-transparent',
      destructive:
        'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-sm border border-danger-600 hover:border-danger-700',
      // Quiet until hovered, then red: sign out, remove row, clear.
      ghostDanger:
        'bg-transparent text-slate-500 hover:text-danger-600 hover:bg-danger-50 border border-transparent',
      // Risky but secondary: flag stolen, remove, revoke.
      dangerOutline:
        'bg-white text-danger-600 hover:bg-danger-50 active:bg-danger-100 border border-danger-200 shadow-subtle',
      // Text-only action inside a sentence, table row or card footer.
      link: 'bg-transparent text-accent-600 hover:text-accent-700 hover:underline',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
      md: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[46px]',
      // Square button holding a single icon. Always pass aria-label.
      icon: 'p-2 text-sm min-h-[36px] min-w-[36px]',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    // Link buttons sit inline with text, so they take no padding or minimum height.
    const sizeClass = variant === 'link' ? 'gap-1 text-xs' : sizes[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={`${baseStyles} ${variants[variant]} ${sizeClass} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children != null && children !== false && (
          <span className="inline-flex items-center justify-center gap-1.5">{children}</span>
        )}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
