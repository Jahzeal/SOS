'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 font-extrabold flex items-center justify-center text-xl mb-4 shadow-sm">
        500
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed font-medium">
        An unexpected application error occurred. Click retry below or return to the dashboard.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
