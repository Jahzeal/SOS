'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Smartphone,
  BarChart3,
  Lock,
  Zap,
  CheckCircle2,
  Users,
  Search,
  ArrowRight,
  QrCode,
  FileCheck,
  Check,
  X,
  ChevronDown,
  Building,
  Store,
  Receipt,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowDown,
  Globe,
  FileText,
  Mail,
  HelpCircle,
  Wrench,
  UserCheck,
  Settings,
  Layers,
  Award,
  Clock,
  Menu,
  LayoutDashboard,
  ShoppingCart,
  Package,
} from 'lucide-react';

export default function ForBusinessesPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'dashboard' | 'verification' | 'inventory' | 'sales' | 'reports' | 'receipts'>('dashboard');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sticky Header Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-subtle'
            : 'h-20 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold shadow-md">
              VF
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-none block">
                VerifyFlow
              </span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                For Businesses
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#who-it-is-for" className="hover:text-slate-900 transition-colors">
              Who It's For
            </a>
            <a href="#modules" className="hover:text-slate-900 transition-colors">
              Platform Modules
            </a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Workflow
            </a>
            <a href="#product-experience" className="hover:text-slate-900 transition-colors">
              Product Tour
            </a>
            <a href="#onboarding" className="hover:text-slate-900 transition-colors">
              Onboarding
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link href="/onboarding">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Create Account
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 shadow-dropdown animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
              <a href="#who-it-is-for" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">
                Who It's For
              </a>
              <a href="#modules" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">
                Platform Modules
              </a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">
                Workflow
              </a>
              <a href="#product-experience" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">
                Product Tour
              </a>
              <a href="#onboarding" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">
                Onboarding
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 py-1">
                FAQ
              </a>
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" fullWidth size="md">
                  Login
                </Button>
              </Link>
              <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth size="md">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SECTION 1 — HERO (Split-Screen Viewport) */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[90vh]">
        <div className="lg:w-1/2 space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            The Complete Operating System for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              Your Phone Business
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-700 font-medium leading-relaxed max-w-xl">
            VerifyFlow helps phone retailers verify purchases, manage inventory, record sales, generate receipts, track warranties, organize repairs, and monitor business performance from one secure cloud platform.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/onboarding">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-md shadow-slate-900/10"
              >
                Create Account
              </Button>
            </Link>
            <Button variant="secondary" size="lg" fullWidth leftIcon={<Building className="w-4 h-4 text-blue-600" />}>
              Book a Demo
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-200/80 flex items-center gap-6 text-xs font-semibold text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Secure Cloud Platform
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Built for Phone Retailers
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic Backups
            </span>
          </div>
        </div>

        {/* Right Side: Photo-Realistic Store Owner & Workspace OS Showcase */}
        <div className="lg:w-1/2 w-full max-w-xl">
          <div className="vf-card border-2 border-slate-200 shadow-2xl p-3 sm:p-4 rounded-3xl bg-white space-y-3">
            
            {/* Top Workspace Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 tracking-tight">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> VerifyFlow Retail OS
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                LIVE CLOUD POS
              </span>
            </div>

            {/* Photo Showcase Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg group">
              <img
                src="/images/for_businesses_store_hero.png"
                alt="Black American smartphone store owner operating VerifyFlow retail software on laptop at store counter"
                className="w-full h-auto max-h-[380px] object-cover object-center transform group-hover:scale-[1.01] transition-transform duration-500"
              />
              
              {/* Overlay Ambient Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent pointer-events-none" />

              {/* Floating Live Badges */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold text-white">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px]">Real-Time Store POS Operations</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-400/30 shadow-md text-white text-[11px] font-extrabold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>100% Verified Origin</span>
                </div>
              </div>
            </div>

            {/* Live Metrics Summary Pills */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Monthly Store Revenue</div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">$124,500.00</div>
                <div className="text-[10px] text-emerald-600 font-extrabold mt-0.5">1,248 IMEIs Registered</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Verification Rate</div>
                <div className="text-lg font-extrabold text-emerald-950 mt-0.5">99.8% Trust</div>
                <div className="text-[10px] text-emerald-700 font-extrabold mt-0.5">Zero Fraud Disputes</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2 — WHO VERIFYFLOW IS BUILT FOR */}
      <section id="who-it-is-for" className="py-20 bg-white border-y border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Purpose-Built for Electronics Businesses
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              VerifyFlow is tailored for companies handling high-value serial-tracked hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="vf-card vf-card-interactive p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Phone Retailers</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Shops selling new or pre-owned smartphones requiring instant IMEI registration and buyer warranty receipts.
              </p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Wholesalers</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Bulk suppliers handling thousands of devices requiring automated batch IMEI entry and serial manifests.
              </p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Distributors</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Regional importers managing multi-branch store distribution, stock allocation, and warranty claims.
              </p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Electronics Stores</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Multi-category retailers selling laptops, tablets, and mobile phones alongside general electronics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — EVERYDAY CHALLENGES */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="p-7 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Everyday Store Operations Chaos
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-slate-800 shadow-subtle">
                <div className="font-bold text-rose-900">1. Lost Customer Receipts</div>
                <p className="text-slate-500 mt-1">
                  Customers bring broken phones without receipts. Store staff spend 30 minutes searching file boxes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-slate-800 shadow-subtle">
                <div className="font-bold text-rose-900">2. Disconnected Excel Spreadsheets</div>
                <p className="text-slate-500 mt-1">
                  Different staff members edit separate Excel files, causing duplicate IMEIs and missing stock serials.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-slate-800 shadow-subtle">
                <div className="font-bold text-rose-900">3. Fraudulent Warranty Claims</div>
                <p className="text-slate-500 mt-1">
                  No undeniable proof of origin leads to arguments over whether a damaged phone was bought from your shop.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Running a phone business shouldn't feel chaotic.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              When hardware serial numbers, customer warranty records, and sales receipts are scattered across paper slips, WhatsApp messages, and Excel sheets, your business loses time and money.
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-rose-500" /> Unable to verify purchases on the spot
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-rose-500" /> Lost customer records & warranty disputes
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-rose-500" /> Slow customer service and manual reporting mistakes
              </li>
            </ul>

            <div className="pt-2 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs sm:text-sm font-bold text-blue-900">
              VerifyFlow replaces disconnected tools with one secure, unified cloud platform.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — EVERYTHING IN ONE PLATFORM (9 Modules Grid) */}
      <section id="modules" className="py-20 bg-slate-100/70 border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything in One Unified Platform
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Integrated modules built specifically for managing modern phone store operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Phone Verification</h3>
              <p className="text-xs text-slate-500">Instant IMEI, Serial Number, and QR code verification ledger.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Inventory Control</h3>
              <p className="text-xs text-slate-500">Multi-branch serial-tracked stock allocation and valuation.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <Receipt className="w-6 h-6 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Sales & Checkout</h3>
              <p className="text-xs text-slate-500">Rapid POS checkout linking customer profiles to device IMEIs.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <Lock className="w-6 h-6 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Warranty Management</h3>
              <p className="text-xs text-slate-500">Automated guarantee countdowns and expiration alerts.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <Wrench className="w-6 h-6 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">Repairs & Inspection</h3>
              <p className="text-xs text-slate-500">Track device repair status, diagnostic notes, and cost breakdown.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <QrCode className="w-6 h-6 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Receipt Generator</h3>
              <p className="text-xs text-slate-500">80mm thermal POS rolls & digital receipts with embedded QR codes.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Reports & Analytics</h3>
              <p className="text-xs text-slate-500">Real-time revenue metrics, top-selling models, and branch performance.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <Users className="w-6 h-6 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Customer Records</h3>
              <p className="text-xs text-slate-500">Complete customer purchase history and warranty claim records.</p>
            </div>

            <div className="vf-card vf-card-interactive p-6 space-y-2">
              <Settings className="w-6 h-6 text-slate-700" />
              <h3 className="text-base font-bold text-slate-900">Business Settings</h3>
              <p className="text-xs text-slate-500">Multi-branch management, staff RBAC permissions, and store branding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — HOW YOUR BUSINESS WORKS WITH VERIFYFLOW (8-Step Workflow) */}
      <section id="workflow" className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How Your Store Operates With VerifyFlow
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              From receiving stock to instant customer verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 01</div>
              <h4 className="text-sm font-bold text-slate-900">Receive Phones</h4>
              <p className="text-xs text-slate-500">Receive new shipments from distributors into store inventory.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 02</div>
              <h4 className="text-sm font-bold text-slate-900">Register via QR / IMEI</h4>
              <p className="text-xs text-slate-500">Scan box QR codes or enter IMEI to link device to cloud ledger.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 03</div>
              <h4 className="text-sm font-bold text-slate-900">Manage Inventory</h4>
              <p className="text-xs text-slate-500">Monitor stock valuation & allocate devices across store branches.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 04</div>
              <h4 className="text-sm font-bold text-slate-900">Sell Phones</h4>
              <p className="text-xs text-slate-500">Checkout customer buyers and link warranty terms to IMEI.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 05</div>
              <h4 className="text-sm font-bold text-slate-900">Generate Receipt</h4>
              <p className="text-xs text-slate-500">Issue digital receipts & thermal prints with embedded QR code.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 06</div>
              <h4 className="text-sm font-bold text-slate-900">Customer Returns</h4>
              <p className="text-xs text-slate-500">Customer presents phone for inquiry or warranty inspection.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 07</div>
              <h4 className="text-sm font-bold text-slate-900">Verify Instantly</h4>
              <p className="text-xs text-slate-500">Scan receipt QR code or lookup IMEI in 2 seconds.</p>
            </div>

            <div className="vf-card p-5 space-y-2">
              <div className="text-xs font-bold text-blue-600">STEP 08</div>
              <h4 className="text-sm font-bold text-slate-900">Track Warranty</h4>
              <p className="text-xs text-slate-500">View active warranty expiration dates and service history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — PRODUCT EXPERIENCE (Interactive Tab Showcase) */}
      <section id="product-experience" className="py-20 px-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See the Platform in Action
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Click through active screens to preview real store management features.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl max-w-3xl mx-auto text-xs font-bold">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'verification', label: 'Verification' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'sales', label: 'Sales' },
            { id: 'reports', label: 'Reports' },
            { id: 'receipts', label: 'Receipts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveShowcaseTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeShowcaseTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="vf-card border-slate-200 shadow-card-hover p-6 rounded-2xl bg-white max-w-5xl mx-auto">
          {activeShowcaseTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Executive Store Performance Dashboard</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Total Devices Registered</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">1,248</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Verified Integrity</div>
                  <div className="text-2xl font-extrabold text-emerald-900 mt-1">99.8%</div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-700 font-semibold">Active Store Warranties</div>
                  <div className="text-2xl font-extrabold text-blue-900 mt-1">842</div>
                </div>
              </div>
            </div>
          )}

          {activeShowcaseTab === 'verification' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Public & Internal Phone Verification Portal</h4>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <Badge variant="verified">OFFICIAL RECORD VERIFIED</Badge>
                <div className="font-bold text-slate-900 text-sm">iPhone 16 Pro Max • 256GB Natural Titanium</div>
                <div className="text-slate-600">IMEI: 354892019283741 • Retailer: TechWorld Mobile</div>
                <div className="text-emerald-700 font-semibold pt-1">Hardware Guarantee Active until 2027</div>
              </div>
            </div>
          )}

          {activeShowcaseTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Serial-Tracked Inventory Allocation</h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Samsung Galaxy S24 Ultra</span>
                  <span className="text-blue-600">14 Units (Downtown Branch)</span>
                </div>
                <div className="text-slate-500 font-mono">Serial numbers verified and ready for checkout</div>
              </div>
            </div>
          )}

          {activeShowcaseTab === 'sales' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">POS Checkout & Customer Assignment</h4>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                <div className="font-bold text-blue-900">New Sale Completed: INV-2026-8891</div>
                <div className="text-slate-600">Buyer: Alex Dev (alex@retailer.com)</div>
                <div className="text-slate-600">Linked IMEI: 354892019283741</div>
              </div>
            </div>
          )}

          {activeShowcaseTab === 'reports' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Branch Performance & Stock Valuation</h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                Downtown Flagship: $148,920 stock valuation • Zero unverified claims
              </div>
            </div>
          )}

          {activeShowcaseTab === 'receipts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">80mm Thermal POS Receipt Layout</h4>
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs max-w-sm">
                <div className="font-bold text-center">TECHWORLD MOBILE</div>
                <div className="text-center text-[10px] text-slate-500">Official Verification Receipt</div>
                <div className="border-t border-dashed border-slate-300 my-2" />
                <div>IMEI: 354892019283741</div>
                <div>Scan QR Code to Verify</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7 — WHY BUSINESSES CHOOSE VERIFYFLOW */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Why Businesses Choose VerifyFlow</h2>
            <p className="text-xs sm:text-sm text-slate-500">Comparing manual methods against VerifyFlow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="vf-card p-6 border-rose-200 bg-rose-50/30 space-y-4">
              <div className="font-bold text-rose-900 text-base">Without VerifyFlow</div>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-rose-500" /> Paper Records (Easy to lose)</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-rose-500" /> Disconnected Excel Spreadsheets</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-rose-500" /> Manual Verification Mistakes</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-rose-500" /> Lost Receipts & Warranty Disputes</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-rose-500" /> Inventory Confusion</li>
              </ul>
            </div>

            <div className="vf-card p-6 border-emerald-300 bg-emerald-50/40 space-y-4 shadow-card">
              <div className="font-bold text-emerald-950 text-base flex items-center justify-between">
                <span>With VerifyFlow</span>
                <Badge variant="verified" size="sm">RECOMMENDED</Badge>
              </div>
              <ul className="space-y-3 text-slate-800 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Cryptographic Cloud Records</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 2-Second Instant Verification</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Serial-Organized Inventory</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Digital & Thermal QR Receipts</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Automated Warranty Tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — BUSINESS BENEFITS */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Key Operational Benefits
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="vf-card p-6 space-y-2">
            <Zap className="w-6 h-6 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Reduce Verification Time</h3>
            <p className="text-xs text-slate-500">Query device origin in 2 seconds instead of 20 minutes searching paperwork.</p>
          </div>

          <div className="vf-card p-6 space-y-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Organize Every Phone</h3>
            <p className="text-xs text-slate-500">100% serial hardware tracking across all store locations.</p>
          </div>

          <div className="vf-card p-6 space-y-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Improve Customer Confidence</h3>
            <p className="text-xs text-slate-500">Provide digital QR receipts that buyers can verify anytime on their phones.</p>
          </div>

          <div className="vf-card p-6 space-y-2">
            <Globe className="w-6 h-6 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Access Records Anywhere</h3>
            <p className="text-xs text-slate-500">Real-time cloud access across laptop, tablet, or smartphone.</p>
          </div>

          <div className="vf-card p-6 space-y-2">
            <Lock className="w-6 h-6 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Protect Business Data</h3>
            <p className="text-xs text-slate-500">Bank-grade encryption, automated cloud backups, and RBAC role permissions.</p>
          </div>

          <div className="vf-card p-6 space-y-2">
            <BarChart3 className="w-6 h-6 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Increase Operational Efficiency</h3>
            <p className="text-xs text-slate-500">Save 15+ hours per week per store by eliminating manual paperwork.</p>
          </div>
        </div>
      </section>

      {/* SECTION 9 — CUSTOMER TESTIMONIALS */}
      <section className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Trusted by Growing Phone Businesses</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vf-card p-6 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                "VerifyFlow eliminated our customer warranty disputes. Scanning QR receipts gives buyers immediate trust."
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  M
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Marcus Vance</div>
                  <div className="text-[10px] text-slate-500">Owner, TechWorld Mobile</div>
                </div>
              </div>
            </div>

            <div className="vf-card p-6 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                "Managing multi-branch phone inventory used to be a nightmare. VerifyFlow solved serial tracking."
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  S
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Sarah Jenkins</div>
                  <div className="text-[10px] text-slate-500">Director, Apex Wireless</div>
                </div>
              </div>
            </div>

            <div className="vf-card p-6 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                "The thermal receipt QR builder is amazing. Our customers love scanning their receipts to check warranty."
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  D
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">David Chen</div>
                  <div className="text-[10px] text-slate-500">Wholesale Manager, GlobalPhone</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — SIMPLE ONBOARDING (5-Step Path) */}
      <section id="onboarding" className="py-20 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple 5-Step Guided Setup
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Get your store up and running in under 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="vf-card p-4 space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs mx-auto flex items-center justify-center">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">Create Account</h4>
            <p className="text-[11px] text-slate-500">Enter email and password.</p>
          </div>

          <div className="vf-card p-4 space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs mx-auto flex items-center justify-center">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">Verify Email</h4>
            <p className="text-[11px] text-slate-500">Confirm store ownership.</p>
          </div>

          <div className="vf-card p-4 space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs mx-auto flex items-center justify-center">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">Store Profile</h4>
            <p className="text-[11px] text-slate-500">Add store name & logo.</p>
          </div>

          <div className="vf-card p-4 space-y-2 text-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs mx-auto flex items-center justify-center">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-900">Select Plan</h4>
            <p className="text-[11px] text-slate-500">Choose Starter or Business tier.</p>
          </div>

          <div className="vf-card p-4 space-y-2 text-center bg-emerald-50/50 border-emerald-200">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs mx-auto flex items-center justify-center">
              5
            </div>
            <h4 className="text-xs font-bold text-slate-900">Register First Phone</h4>
            <p className="text-[11px] text-slate-600">Log your first device IMEI!</p>
          </div>
        </div>
      </section>

      {/* SECTION 11 — FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 bg-slate-100/70 border-y border-slate-200 px-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Can customers verify phones without creating an account?',
              a: 'Yes. Customer verification is completely public and frictionless. Anyone can scan a receipt QR code or enter an IMEI to verify authenticity.',
            },
            {
              q: 'Do I need a special barcode scanner?',
              a: 'No. You can use standard USB or Bluetooth scanners, smartphone cameras, or type IMEIs manually.',
            },
            {
              q: 'Can I scan manufacturer QR codes directly?',
              a: 'Yes, VerifyFlow supports standard manufacturer box barcodes out of the box.',
            },
            {
              q: 'Does VerifyFlow work for multiple store branches?',
              a: 'Yes. You can manage multiple store locations and transfer stock between branches.',
            },
            {
              q: 'Can I print receipts to thermal printers?',
              a: 'Yes, our built-in receipt builder supports 80mm thermal POS rolls, 58mm rolls, and standard A4 sheets.',
            },
            {
              q: 'Is my store business data secure?',
              a: 'Yes. We use bank-grade SSL encryption and automated cloud backups.',
            },
            {
              q: 'Can I migrate my existing phone records from Excel?',
              a: 'Yes, we provide an instant CSV/Excel import tool to migrate existing stock in seconds.',
            },
            {
              q: 'How long does setup take?',
              a: 'Setup takes under 5 minutes. No software installation is required.',
            },
          ].map((item, idx) => (
            <div key={idx} className="vf-card overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaqIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 12 — FINAL CTA & FOOTER */}
      <section className="py-20 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 border-t border-slate-200 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to Modernize Your Phone Business?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Join hundreds of phone retailers, distributors, and electronics businesses using VerifyFlow to simplify verification, inventory, sales, and warranty management.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/onboarding">
              <Button variant="primary" size="lg" className="shadow-md shadow-blue-600/10">
                Create Account
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-700 text-sm py-14 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Product</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><Link href="/" className="hover:text-blue-600 transition">Home Landing Page</Link></li>
              <li><a href="#modules" className="hover:text-blue-600 transition">Platform Modules</a></li>
              <li><a href="#workflow" className="hover:text-blue-600 transition">Store Workflow</a></li>
              <li><a href="#product-experience" className="hover:text-blue-600 transition">Product Tour</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Resources</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><a href="#faq" className="hover:text-blue-600 transition">Help Center</a></li>
              <li><a href="#faq" className="hover:text-blue-600 transition">Documentation</a></li>
              <li><span className="text-slate-400">Developer API (Soon)</span></li>
              <li><span className="text-slate-400">Blog (Soon)</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Company</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><a href="#" className="hover:text-blue-600 transition">About VerifyFlow</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Contact Sales</a></li>
              <li><span className="text-slate-400">Careers (Hiring)</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Legal & Security</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><a href="#" className="hover:text-blue-600 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Cookie Settings</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div>VerifyFlow Retail Operating System © 2026. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>English (US)</span>
            <span>Security Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
