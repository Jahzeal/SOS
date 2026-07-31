'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-skeleton rounded-lg ${className}`} />;
}

// 1. Card Skeleton Loader
export function SkeletonCard() {
  return (
    <div className="vf-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-36" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// 2. Table Row Skeleton
export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-3.5">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// 3. Form Field Skeleton Loader
export function SkeletonForm() {
  return (
    <div className="space-y-4 p-6 vf-card">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="pt-2 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-button" />
      </div>
    </div>
  );
}
