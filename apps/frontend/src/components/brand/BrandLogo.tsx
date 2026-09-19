'use client';

import React from 'react';
import Image from 'next/image';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: string;
}

export function BrandLogo({
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
}: BrandLogoProps) {
  const sizeMap = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
    custom: '',
  };

  const containerClass = sizeMap[size] || className;

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Exact Designer Artwork Container */}
      <div
        className={`relative overflow-hidden bg-white shadow-xs border border-white/30 flex items-center justify-center shrink-0 ${containerClass} ${className}`}
      >
        <div className="relative w-full h-full scale-[1.85] flex items-center justify-center">
          <Image
            src="/images/noxguardalogo.jpg"
            alt="NoxGuarda Brand Mark"
            fill
            priority
            sizes="64px"
            className="object-contain"
          />
        </div>
      </div>

      {/* Brand Typography in Space Grotesk */}
      {showText && (
        <span
          className={`font-space font-extrabold uppercase tracking-[0.2em] text-white select-none ${textClassName}`}
        >
          NOXGUARDA
        </span>
      )}
    </div>
  );
}

