'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'teal' | 'dark' | 'white';
  showSubtitle?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
}

export function Logo({
  size = 'md',
  variant = 'teal',
  showSubtitle = false,
  subtitle = 'Security Registry',
  href = '/',
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-sm font-extrabold tracking-[0.18em]',
    md: 'text-base font-extrabold tracking-[0.2em]',
    lg: 'text-lg sm:text-xl font-extrabold tracking-[0.22em]',
  };

  const subtitleSizes = {
    sm: 'text-[9px] font-bold uppercase tracking-wider',
    md: 'text-[10px] font-bold uppercase tracking-wider',
    lg: 'text-[11px] font-bold uppercase tracking-wider',
  };

  const textColor = variant === 'white' ? 'text-white' : 'text-slate-900';
  const subtitleColor = variant === 'white' ? 'text-emerald-400' : 'text-[#2E6F5E]';

  const content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 shrink-0 select-none ${className}`}>
      {/* Brand Monogram Icon Container */}
      <div className="flex items-center justify-center transition-transform group-hover:scale-105">
        <BrandLogo
          variant={variant === 'white' ? 'white' : 'full'}
          size={size}
          className={sizeMap[size]}
        />
      </div>

      <div className="min-w-0">
        <span className={`${textColor} leading-none block font-space font-extrabold uppercase ${titleSizes[size]}`}>
          NOXGUARDA
        </span>
        {showSubtitle && (
          <span className={`${subtitleColor} leading-tight block mt-0.5 ${subtitleSizes[size]}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

