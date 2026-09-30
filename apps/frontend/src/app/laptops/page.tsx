'use client';

import Link from 'next/link';
import { Laptop, ShieldCheck, Zap, CheckCircle2, ArrowRight, Badge } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/brand/BrandLogo';

export default function LaptopsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo size="sm" variant="light" />
          </Link>
          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <Link href="/features" className="text-teal-600 transition">Features & Workflows</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
            <Link href="/#faq" className="hover:text-slate-900 transition">FAQ</Link>
            <Link href="/dashboard/verify" className="hover:text-slate-900 transition">Public Scanner</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="secondary" size="sm" className="font-bold text-xs">Log In</Button></Link>
            <Link href="/onboarding"><Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700 font-bold text-xs shadow-sm shadow-teal-600/20">Start Free Trial</Button></Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-teal-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs shadow-xs">
            <span>The Complete OS Purpose‑Built for Laptop Retailers</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Everything your laptop store needs. <br className="hidden sm:inline" />
            <span className="text-teal-600">Without the clutter.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            NoxGuarda replaces disconnected spreadsheets and generic tools with a single hardware‑aware operating system: serial‑level verification, POS receipts, corporate invoices, repair tickets, digital warranty passports, and full‑featured laptop inventory management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700 font-extrabold text-sm shadow-md shadow-teal-600/20 px-8 py-3.5">Start 14‑Day Free Trial</Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full font-bold text-sm border-slate-300 px-7 py-3.5">Compare Pricing Plans</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* QUICK PILLAR NAVIGATION */}
      <div className="pt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
        <a href="#verification" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">🛡️ Laptop Verification</a>
        <a href="#inventory" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">💻 Laptop Inventory</a>
        <a href="#warranty" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">🛡️ Laptop Warranty</a>
        <a href="#repairs" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">🔧 Repair Desk</a>
        <a href="#public-portal" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">🔍 Buyer QR Verification</a>
      </div>

      {/* PILLAR SECTIONS – placeholders */}
      <section id="verification" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h2 className="text-3xl font-black text-slate-900">Laptop Verification</h2>
        <p className="text-slate-600">Instant serial verification, anti‑stolen blacklisting, and QR digital passports for every laptop.</p>
      </section>
      <section id="inventory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h2 className="text-3xl font-black text-slate-900">Laptop Inventory</h2>
        <p className="text-slate-600">Track each laptop by serial, condition, warranty period, and branch location.</p>
      </section>
      <section id="warranty" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h2 className="text-3xl font-black text-slate-900">Laptop Warranty</h2>
        <p className="text-slate-600">Automated digital warranties with configurable durations and expiry alerts.</p>
      </section>
      <section id="repairs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h2 className="text-3xl font-black text-slate-900">Repair Desk</h2>
        <p className="text-slate-600">Manage laptop repair tickets from intake to customer pickup.</p>
      </section>
      <section id="public-portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <h2 className="text-3xl font-black text-slate-900">Buyer QR Verification</h2>
        <p className="text-slate-600">Public QR verification engine giving end‑buyers confidence in laptop authenticity.</p>
      </section>
    </div>
  );
}
