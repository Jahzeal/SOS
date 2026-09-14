'use client';

import React from 'react';
import Link from 'next/link';

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
  showSubtitle = true,
  subtitle = 'Enterprise OS',
  href = '/',
  className = '',
}: LogoProps) {
  const badgeSizes = {
    sm: 'w-7 h-7 rounded-lg text-xs font-black',
    md: 'w-9 h-9 rounded-xl text-sm sm:text-base font-black',
    lg: 'w-11 h-11 rounded-2xl text-base sm:text-lg font-black',
  };

  const titleSizes = {
    sm: 'text-sm font-extrabold tracking-tight',
    md: 'text-base font-extrabold tracking-tight',
    lg: 'text-lg sm:text-xl font-extrabold tracking-tight',
  };

  const subtitleSizes = {
    sm: 'text-[9px] font-bold uppercase tracking-wider',
    md: 'text-[10px] font-bold uppercase tracking-wider',
    lg: 'text-[11px] font-bold uppercase tracking-wider',
  };

  const badgeTheme =
    variant === 'dark'
      ? 'bg-slate-900 text-white shadow-md border border-slate-700/50'
      : variant === 'white'
      ? 'bg-white text-slate-950 shadow-md'
      : 'bg-teal-600 text-white shadow-md shadow-teal-600/20';

  const textColor = variant === 'white' ? 'text-white' : 'text-slate-900';
  const subtitleColor = variant === 'white' ? 'text-teal-300' : 'text-teal-600';

  const content = (
    <div className={`flex items-center gap-2.5 sm:gap-3 shrink-0 ${className}`}>
      <div
        className={`${badgeSizes[size]} ${badgeTheme} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 select-none`}
      >
        VF
      </div>
      <div className="min-w-0">
        <span className={`${textColor} leading-none block font-sans ${titleSizes[size]}`}>
          VerifyFlow
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
