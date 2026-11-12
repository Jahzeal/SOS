import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { SiteFooter } from './SiteFooter';

/** Shared shell for the Privacy Policy and Terms of Service pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <Logo size="md" />
        <nav className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
          <Link href="/login" className="hover:text-slate-900 transition">Sign In</Link>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-slate-500 font-medium">Last updated {updated}</p>

        <div className="mt-8 space-y-8 text-sm text-slate-700 leading-relaxed [&_h2]:text-lg [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_ul+p]:mt-3 [&_a]:text-teal-700 [&_a]:font-semibold [&_a]:underline">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
