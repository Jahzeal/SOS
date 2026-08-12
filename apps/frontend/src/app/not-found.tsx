import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-extrabold flex items-center justify-center text-xl mb-4 shadow-sm">
        404
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed font-medium">
        The requested page or record could not be found. Check the web URL or return home.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
        >
          Return Home
        </Link>
        <Link
          href="/pricing"
          className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
        >
          View Pricing & Plans
        </Link>
      </div>
    </div>
  );
}
