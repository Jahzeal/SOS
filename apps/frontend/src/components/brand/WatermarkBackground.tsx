'use client';

import React from 'react';
import Image from 'next/image';

export interface WatermarkBackgroundProps {
  opacity?: string; // e.g. 'opacity-[0.03]' or 'opacity-[0.05]'
  size?: 'sm' | 'md' | 'lg' | 'hero';
  position?: 'center' | 'top-right' | 'bottom-right';
  className?: string;
}

export function WatermarkBackground({
  opacity = 'opacity-[0.035]',
  size = 'lg',
  position = 'center',
  className = '',
}: WatermarkBackgroundProps) {
  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-72 h-72',
    lg: 'w-96 h-96 sm:w-[480px] sm:h-[480px]',
    hero: 'w-[500px] h-[500px] sm:w-[750px] sm:h-[750px]',
  };

  const positionClasses = {
    center: 'items-center justify-center',
    'top-right': 'items-start justify-end -top-24 -right-24',
    'bottom-right': 'items-end justify-end -bottom-24 -right-24',
  };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden -z-10 flex ${positionClasses[position]} ${className}`}
    >
      <div
        className={`relative ${sizeClasses[size]} ${opacity} transition-opacity duration-300 flex items-center justify-center filter grayscale contrast-125`}
      >
        <Image
          src="/images/noxguardalogo.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 300px, 600px"
          className="object-contain"
        />
      </div>
    </div>
  );
}

export default WatermarkBackground;
