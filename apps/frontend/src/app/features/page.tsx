'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  Receipt,
  FileText,
  Wrench,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Lock,
  Search,
  Zap,
  TrendingUp,
  Store,
  ChevronRight,
  Building,
  DollarSign,
  Clock,
  Sparkles,
  Users,
  Check,
  Laptop,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white font-sans">
      {/* ========================================================================= */}
      {/* NAVIGATION BAR                                                            */}
      {/* ========================================================================= */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-lg shadow-sm border border-slate-800">
              VF
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-slate-900 tracking-tight leading-none">
                Verify<span className="text-teal-600">Flow</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Phone OS</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <Link href="/features" className="text-teal-600 transition">Features & Workflows</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
            <Link href="/#faq" className="hover:text-slate-900 transition">FAQ</Link>
            <Link href="/dashboard/verify" className="hover:text-slate-900 transition">Public Scanner</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="secondary" size="sm" className="font-bold text-xs">
                Log In
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700 font-bold text-xs shadow-sm shadow-teal-600/20">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-teal-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>The Complete OS Purpose-Built for Electronics Retailers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Everything your phone store needs. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
              Without the clutter.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            VerifyFlow replaces disconnected spreadsheets and generic tools with a single hardware-aware operating system: IMEI-level verification, POS receipts, Odoo-style commercial invoices, live repair tickets, and digital warranty passports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700 font-extrabold text-sm shadow-md shadow-teal-600/20 px-8 py-3.5">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full font-bold text-sm border-slate-300 px-7 py-3.5">
                Compare Pricing Plans
              </Button>
            </Link>
          </div>

          {/* Quick Pillar Jump Navigation */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            <a href="#verification" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">
              🛡️ Phone Verification
            </a>
            <a href="#inventory" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">
              📱 Serial Inventory
            </a>
            <a href="#invoicing" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">
              🧾 POS & Odoo Invoices
            </a>
            <a href="#warranty" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">
              🛡️ Digital Warranties
            </a>
            <a href="#repairs" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">
              🔧 Repair Desk
            </a>
            <a href="#public-portal" className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-700 shadow-xs transition">
              🔍 Buyer QR Verification
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6 CORE PILLARS DEEP-DIVE SECTIONS                                         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* PILLAR 1: VERIFICATION */}
        <section id="verification" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>PILLAR 01 • FRAUD & BLACKLIST PREVENTION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Instant IMEI & Hardware Authenticity Verification
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Eliminate counterfeit devices, stolen phone claims, and duplicate serial swaps. VerifyFlow validates hardware serials and IMEI pairs instantly when checking in store inventory or processing trade-ins.
            </p>
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Dual-IMEI & Serial Number Indexing:</strong> Match physical device stickers against system database records.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Anti-Stolen Device Blacklisting:</strong> Flag reported stolen devices and prevent resale in real-time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>QR Digital Passports:</strong> Generates tamper-proof QR tags for every verified device.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button size="md" className="bg-slate-900 text-white font-bold text-xs hover:bg-slate-800" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Try Verification Engine
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-emerald-950">AUTHENTIC & VERIFIED</p>
                  <p className="text-xs text-emerald-700 font-medium">IMEI: 354892019482019 • Clean Record</p>
                </div>
              </div>
              <Badge variant="verified">PASS</Badge>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Device Model</span>
                <span className="font-bold text-slate-900">Apple iPhone 15 Pro Max (256GB)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Condition Grade</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">EXCELLENT (GRADE A)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registration Store</span>
                <span className="font-bold text-slate-900">TechWorld Mobile (Ikeja Main)</span>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 2: INVENTORY */}
        <section id="inventory" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Live Serialized Inventory Hub</h3>
              <span className="text-xs text-teal-600 font-bold">Multi-Branch Synced</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Samsung Galaxy S24 Ultra</p>
                  <p className="text-[11px] text-slate-500 font-mono">IMEI: 358291048291048 • Titanium Gray</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-900">₦1,450,000</p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">IN STOCK</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">iPhone 14 Pro (128GB)</p>
                  <p className="text-[11px] text-slate-500 font-mono">IMEI: 359102948291002 • Deep Purple</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-900">₦820,000</p>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">SOLD</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Google Pixel 8 Pro</p>
                  <p className="text-[11px] text-slate-500 font-mono">IMEI: 351940294819204 • Obsidian</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-900">₦750,000</p>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">IN REPAIR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
              <Smartphone className="w-4 h-4" />
              <span>PILLAR 02 • MULTI-STORE SERIAL INVENTORY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Never Lose Track of a Single Phone or IMEI
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Generic POS systems track quantities ("iPhone 15 x 5"). VerifyFlow tracks exact physical devices with individual battery health, purchase cost, selling price, and warranty durations across all branch stores.
            </p>
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Hardware Grading & Condition Tags:</strong> NEW, LIKE-NEW, EXCELLENT, GOOD, FAIR, REFURBISHED, FOR-PARTS.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Purchase vs Selling Profit Margins:</strong> Real-time valuation of stock on floor vs capital invested.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Stock Ageing Alerts:</strong> Identify aging devices on shelf to discount before value drops.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button size="md" className="bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Explore Inventory System
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PILLAR 3: POS & ODOO INVOICING */}
        <section id="invoicing" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200">
              <Receipt className="w-4 h-4" />
              <span>PILLAR 03 • POS & ODOO-STYLE INVOICING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dual-Mode Checkout: 80mm POS Thermal & Odoo Invoices
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Run fast counter checkout with thermal QR receipts, or generate structured Odoo-style corporate A4 commercial invoices with complete payment logs, bank details, and legal warranty clauses.
            </p>
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>80mm / 58mm Thermal POS Receipts:</strong> One-click print with embedded device warranty QR codes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Odoo-Style Commercial A4 Statements:</strong> Dual header cards, detailed specs, Payment History ledger, and tax breakdown.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Split & Flexible Payments:</strong> Record Cash, POS Card, Bank Transfer, or Net 15/30 terms seamlessly.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button size="md" className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Invoice Templates
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="border border-slate-300 rounded-2xl p-4 bg-white space-y-3 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <p className="font-extrabold text-sm text-slate-900">VerifyFlow Wireless Systems</p>
                  <p className="text-[10px] text-slate-500">Computer Village, Ikeja, Lagos</p>
                </div>
                <Badge variant="verified">COMMERCIAL INVOICE</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-500 text-[10px]">INVOICE TO:</p>
                  <p className="font-bold text-slate-900">Apex Global Logistics</p>
                  <p className="text-slate-500 text-[10px]">orders@apexlogistics.ng</p>
                </div>
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <p className="font-bold text-blue-100 text-[10px]">INVOICE NO:</p>
                  <p className="font-mono font-extrabold text-xs">INV/2026/0892</p>
                  <p className="text-blue-100 text-[10px]">Due: Net 15 Days</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                <div className="bg-blue-600 text-white font-bold p-2 grid grid-cols-12">
                  <span className="col-span-1">Sr.</span>
                  <span className="col-span-7">Description (Specs)</span>
                  <span className="col-span-1 text-center">Qty</span>
                  <span className="col-span-3 text-right">Price</span>
                </div>
                <div className="p-2 grid grid-cols-12 border-b border-slate-100">
                  <span className="col-span-1 text-slate-400">1</span>
                  <span className="col-span-7 font-medium text-slate-800">[A2325] iPad Pro 11" 128GB Wi-Fi</span>
                  <span className="col-span-1 text-center font-bold">1</span>
                  <span className="col-span-3 text-right font-bold text-slate-900">₦890,000</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Payment Status:</span>
                <span className="font-extrabold text-emerald-600">PAID VIA POS (Ref: CSH/2026/004)</span>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 4: WARRANTIES */}
        <section id="warranty" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-teal-900 text-sm">12-Month Store Warranty Active</span>
                <Badge variant="verified">VALID</Badge>
              </div>
              <p className="text-xs text-teal-700 font-medium">Covered: Screen malfunction, board issues, battery drain.</p>
              <div className="pt-2 flex justify-between items-center text-[11px] font-bold text-teal-900">
                <span>Expires: August 14, 2027</span>
                <span>328 Days Remaining</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">Dispute-Free Warranty Resolution</p>
              <p className="text-slate-500 text-[11px]">When a customer returns for warranty support, scanning the receipt instantly pulls up original serial number, purchase date, and terms.</p>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-50 text-teal-700 font-extrabold text-xs border border-teal-200">
              <Shield className="w-4 h-4" />
              <span>PILLAR 04 • DIGITAL STORE GUARANTEES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Automate Warranties & Build Unshakable Trust
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Turn warranty promises from a messy paperwork hassle into your biggest competitive advantage. Customers get automated countdowns and verifiable warranty proof on their phones.
            </p>
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Custom Durations:</strong> Configure 7-day swap, 30-day, 6-month, or 12-month store guarantees.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Hardware Serial Verification:</strong> Protect against customers claiming warranty on devices bought from competitors.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span><strong>Automated Expiration Warnings:</strong> Notify customers before warranty lapses with upgrade offers.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button size="md" className="bg-teal-600 hover:bg-teal-500 font-bold text-xs text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PILLAR 5: REPAIR DESK */}
        <section id="repairs" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200">
              <Wrench className="w-4 h-4" />
              <span>PILLAR 05 • REPAIR DESK & TECHNICIAN HUB</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Track Repairs from Intake to Customer Pickup
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Manage phone repair tickets, technician diagnosis, replacement parts cost, and customer pickup alerts in one unified repair pipeline.
            </p>
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Diagnostic Intake Notes:</strong> Record screen cracks, pre-existing scratches, and water damage upon intake.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Status Tracking:</strong> DIAGNOSING → WAITING PARTS → IN PROGRESS → READY FOR PICKUP → COMPLETED.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Estimated vs Final Costing:</strong> Automatic bill calculation for parts and technician labor.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button size="md" className="bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Explore Repair Desk
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-sm text-slate-900">Repair Ticket #REP-8902</span>
              <Badge variant="business">IN PROGRESS</Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">Issue Description:</p>
                <p className="text-slate-600">iPhone 14 Pro Max • Shattered OLED screen + non-responsive touch digitizer.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-800">Technician Diagnostic Notes:</p>
                <p className="text-slate-600 font-mono text-[11px]">FaceID sensor intact. Original Apple GX OLED panel replacement staged.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex justify-between items-center text-amber-900 font-bold">
                <span>Estimated Repair Cost:</span>
                <span className="text-sm font-extrabold text-slate-900">₦145,000</span>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 6: PUBLIC VERIFICATION PORTAL */}
        <section id="public-portal" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4 text-center">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto border border-teal-200">
              <QrCode className="w-12 h-12" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Zero App Download Required</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Customers scan the QR code on your printed receipt or phone box with their standard camera app to verify legitimacy instantly.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              verifyflow.app/verify/354892019482019
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
              <QrCode className="w-4 h-4" />
              <span>PILLAR 06 • CUSTOMER TRUST PORTAL</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Public QR Verification Engine for End Buyers
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Give your retail buyers complete confidence. When they scan your store's QR code, they see your verified store badge, official warranty period, and hardware specifications.
            </p>
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Custom Store Branding:</strong> Show your store logo, phone number, and branch address on verification pages.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Proof of Purchase Record:</strong> Permanent digital proof for customers even if they misplace paper receipts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Store Reputation Growth:</strong> Verified stores build repeat customer loyalty and word-of-mouth referrals.</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button size="md" className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Get Verified Store Badge
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* BOTTOM CTA BANNER                                                         */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to upgrade your phone store operations?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium">
            Join hundreds of phone retailers, wholesalers, and technicians using VerifyFlow. Full access free for 14 days.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-8 py-3.5">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-bold px-7 py-3.5">
                See Pricing & Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-xs">
              VF
            </div>
            <span className="font-extrabold text-slate-900">VerifyFlow Technologies</span>
          </div>
          <div className="flex items-center gap-6 font-bold">
            <Link href="/features" className="hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
            <Link href="/dashboard/verify" className="hover:text-slate-900">Verification</Link>
            <Link href="/login" className="hover:text-slate-900">Sign In</Link>
          </div>
          <p>© {new Date().getFullYear()} VerifyFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
