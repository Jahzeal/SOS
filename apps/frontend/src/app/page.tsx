'use client';

import { api } from '@/lib/api';
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
  ExternalLink,
  Menu,
  TrendingUp,
} from 'lucide-react';

export default function PublicLandingPageV2() {
  // Navigation Scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Verification Card Interactive State (Journey 1: Customer)
  const [activeHeroTab, setActiveHeroTab] = useState<'imei' | 'qr' | 'serial'>('imei');
  const [heroSearchInput, setHeroSearchInput] = useState('');
  const [heroVerifying, setHeroVerifying] = useState(false);
  const [heroVerifiedResult, setHeroVerifiedResult] = useState<any>(null);

  // Product Showcase Tab State (Section 8)
  const [showcaseTab, setShowcaseTab] = useState<'dashboard' | 'verification' | 'inventory' | 'sales' | 'receipts' | 'reports'>('dashboard');

  // FAQ Accordion State (Section 12)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Pricing Toggle State (Section 11)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

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

  useEffect(() => {
    let scannerInstance: any = null;

    if (activeHeroTab === 'qr') {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        const container = document.getElementById('qr-camera-scanner');
        if (!container) return;

        scannerInstance = new Html5QrcodeScanner(
          'qr-camera-scanner',
          { fps: 10, qrbox: { width: 220, height: 220 } },
          false
        );

        scannerInstance.render(
          async (decodedText: string) => {
            setHeroSearchInput(decodedText);
            setHeroVerifying(true);
            setHeroVerifiedResult(null);

            try {
              const phone = await api.verifyPublicImei(decodedText.trim());
              setHeroVerifiedResult({
                found: true,
                retailer: phone.business?.name || 'Verified Partner Store',
                model: `${phone.brand || ''} ${phone.model || ''}`.trim(),
                storage: `${phone.storageCapacity || ''} ${phone.color ? '• ' + phone.color : ''}`.trim(),
                warranty: phone.warrantyExpiryDate
                  ? `Active (until ${new Date(phone.warrantyExpiryDate).toLocaleDateString()})`
                  : `${phone.warrantyDurationMonths || 12} Months Active`,
                imei: phone.imei1,
                serial: phone.serialNumber || 'N/A',
                status: phone.status || 'IN_STOCK',
              });
            } catch (err) {
              setHeroVerifiedResult({
                found: false,
                searchedTerm: decodedText,
              });
            } finally {
              setHeroVerifying(false);
            }
          },
          () => {}
        );
      }).catch(console.error);
    }

    return () => {
      if (scannerInstance) {
        scannerInstance.clear().catch(() => {});
      }
    };
  }, [activeHeroTab]);

  const handleHeroVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroSearchInput.trim()) return;
    setHeroVerifying(true);
    setHeroVerifiedResult(null);

    try {
      const phone = await api.verifyPublicImei(heroSearchInput.trim());
      setHeroVerifiedResult({
        found: true,
        retailer: phone.business?.name || 'Verified Partner Store',
        model: `${phone.brand || ''} ${phone.model || ''}`.trim(),
        storage: `${phone.storageCapacity || ''} ${phone.color ? '• ' + phone.color : ''}`.trim(),
        warranty: phone.warrantyExpiryDate
          ? `Active (until ${new Date(phone.warrantyExpiryDate).toLocaleDateString()})`
          : `${phone.warrantyDurationMonths || 12} Months Active`,
        imei: phone.imei1,
        serial: phone.serialNumber || 'N/A',
        status: phone.status || 'IN_STOCK',
      });
    } catch (err) {
      setHeroVerifiedResult({
        found: false,
        searchedTerm: heroSearchInput.trim(),
      });
    } finally {
      setHeroVerifying(false);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* SECTION 1 — Sticky Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-subtle'
            : 'h-20 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Left: Logo & Product Name */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-extrabold shadow-md">
              VF
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-none block">
                VerifyFlow
              </span>
            </div>
          </Link>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#solutions" className="hover:text-slate-900 transition-colors">
              Solutions
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it Works
            </a>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors font-bold text-blue-600">
              Pricing & Plans
            </Link>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              Help Center
            </a>
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link href="/onboarding">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Animated Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 shadow-dropdown animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-blue-600 font-bold py-1">
                Pricing & Plans
              </Link>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 py-1"
              >
                Features
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 py-1"
              >
                Solutions
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 py-1"
              >
                How it Works
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-600 py-1"
              >
                Help Center
              </a>
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" fullWidth size="md">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth size="md">
                  Register Business
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SECTION 2 — HERO SECTION (Split Viewport) */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[90vh]">
        {/* Left Side: Business Owner Journey */}
        <div className="lg:w-1/2 space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Know Every Phone.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
              Verify Every Sale.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
            VerifyFlow empowers phone retailers, distributors, and electronics stores to register devices via QR code, IMEI, or Serial Number. Protect your business from fake warranty claims while providing buyers instant proof of origin.
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
                Get Started
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500 font-medium pt-1">
            For phone retailers, distributors, wholesalers & electronics businesses.
          </p>

        </div>

        {/* Right Side: Live Customer Verification Scanner Widget Card */}
        <div id="verify-widget" className="lg:w-1/2 w-full max-w-xl">
          <div className="vf-card border-2 border-slate-200 shadow-card-hover p-5 sm:p-6 rounded-2xl bg-white space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Verify Phone Record</h3>
              <p className="text-xs text-slate-500 font-medium">Instant IMEI, Serial & QR origin lookup</p>
            </div>

            {/* Input Tabs: IMEI / QR / Serial */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveHeroTab('imei')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeHeroTab === 'imei' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'
                }`}
              >
                IMEI Number
              </button>
              <button
                type="button"
                onClick={() => setActiveHeroTab('serial')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeHeroTab === 'serial' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'
                }`}
              >
                Serial Number
              </button>
              <button
                type="button"
                onClick={() => setActiveHeroTab('qr')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  activeHeroTab === 'qr' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'
                }`}
              >
                QR Code Scan
              </button>
            </div>

            {/* Verification Search Form or Camera Scanner */}
            {activeHeroTab === 'qr' ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div id="qr-camera-scanner" className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 text-white min-h-[260px] flex items-center justify-center" />
                <div className="text-[11px] text-slate-500 font-medium text-center">
                  Point camera at phone receipt QR code or device barcode to scan automatically.
                </div>
              </div>
            ) : (
              <form onSubmit={handleHeroVerifySubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={heroSearchInput}
                    onChange={(e) => setHeroSearchInput(e.target.value)}
                    placeholder={
                      activeHeroTab === 'imei'
                        ? 'Enter 15-digit IMEI number...'
                        : 'Enter Serial Number...'
                    }
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-mono font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  isLoading={heroVerifying}
                  leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                >
                  {heroVerifying ? 'Searching Live Ledger...' : 'Verify Phone Authenticity'}
                </Button>
              </form>
            )}

            <div className="mt-2 text-center">
              <a href="#how-it-works" className="text-[11px] font-semibold text-blue-600 hover:underline">
                Need help? Learn how phone verification works →
              </a>
            </div>

            {/* Live Verification Result Preview Card */}
            {heroVerifiedResult && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-b from-emerald-50/80 to-emerald-50/20 border border-emerald-200 animate-in fade-in duration-200">
                {heroVerifiedResult.found ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Official Retail Record Verified
                        </span>
                      </div>
                      <Badge variant="verified" size="sm">
                        GENUINE
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Retailer</span>
                        <span className="font-bold text-slate-900">{heroVerifiedResult.retailer}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Device Model</span>
                        <span className="font-bold text-slate-900">{heroVerifiedResult.model}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Specs & Storage</span>
                        <span className="font-semibold text-slate-700">{heroVerifiedResult.storage}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Warranty Status</span>
                        <span className="font-bold text-emerald-700">{heroVerifiedResult.warranty}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center space-y-1 text-xs">
                    <div className="font-bold text-rose-700">No Registered Device Record Found</div>
                    <div className="text-slate-600 text-[11px]">
                      No active store registration matched identifier <code className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200 text-rose-900 font-bold">{heroVerifiedResult.searchedTerm}</code>.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3 — TRUST SECTION & STATS */}
      <section className="py-6 sm:py-10 bg-white border-y border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
            Trusted by phone retailers & electronics businesses worldwide
          </p>

          {/* Logo Cloud: Single Row Compact Overflow Bar on Mobile */}
          <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-10 overflow-x-auto py-2 no-scrollbar opacity-80 font-bold text-xs sm:text-sm text-slate-800 shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Store className="w-4 h-4 text-blue-600" /> TechWorld Mobile
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Apex Wireless
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Globe className="w-4 h-4 text-indigo-600" /> MobileWorld Global
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Zap className="w-4 h-4 text-amber-600" /> iTech Hub Retail
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Building className="w-4 h-4 text-slate-700" /> SmartRetail Logistics
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-5xl mx-auto">
            <div className="vf-card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">500+</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Businesses Registered</div>
            </div>
            <div className="vf-card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">1.2M+</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Phones Verified</div>
            </div>
            <div className="vf-card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">450K+</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Monthly Searches</div>
            </div>
            <div className="vf-card p-4 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">99.4%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — SOLUTION SECTION */}
      <section id="solutions" className="py-20 bg-slate-950 text-white px-6 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
              VerifyFlow Retail OS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Meet VerifyFlow: The Complete Phone Retail OS
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
              One unified workspace to register IMEI stock, process express POS checkouts, issue digital thermal receipts, track warranties, and handle repairs.
            </p>
          </div>

          {/* Large Operational Dashboard Browser Mockup with Real Retail Store Photography */}
          <div className="vf-card border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-2 sm:p-5 rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto text-left space-y-4">
            
            {/* Browser Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/80 rounded-t-2xl text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
            </div>

            {/* Photo Showcase Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
              <img
                src="/images/verifyflow_store_hero.png"
                alt="Professional phone retailer operating VerifyFlow retail software on laptop at store counter"
                className="w-full h-auto max-h-[480px] object-cover object-center transform group-hover:scale-[1.01] transition-transform duration-500"
              />
              
              {/* Overlay Ambient Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Floating Live Badge Overlays */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold text-white">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-Time Store Operations & POS Checkout</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-600/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-blue-400/30 shadow-lg text-white font-extrabold">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>100% Serial & IMEI Tracked</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6 — CORE FEATURES */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed Exclusively for Phone Businesses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Every feature is purpose-built for smartphones, tablets, and electronics retail workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="vf-card vf-card-interactive p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Phone Verification</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Instantly verify any phone via manufacturer QR code, IMEI, or Serial Number. Eliminates fraud disputes.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 pt-2 hover:underline">
              Learn More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="vf-card vf-card-interactive p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Inventory Management</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Track stock by unique hardware serial numbers across multiple store branches in real time.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 pt-2 hover:underline">
              Learn More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="vf-card vf-card-interactive p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Sales Management</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Fast retail POS checkout linking customer buyer profiles directly to device IMEI and warranty dates.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 pt-2 hover:underline">
              Learn More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="vf-card vf-card-interactive p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Warranty Tracking</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Automated hardware guarantee countdowns and expiration alerts sent directly to store managers and customers.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 pt-2 hover:underline">
              Learn More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 5 */}
          <div className="vf-card vf-card-interactive p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Receipt Generation</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Generate digital receipts and 80mm thermal POS prints embedded with anti-tamper verification QR codes.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 pt-2 hover:underline">
              Learn More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 6 */}
          <div className="vf-card vf-card-interactive p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Business Analytics</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Deep insights into top-selling phone models, store branch revenue, stock valuation, and warranty claims.
            </p>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 pt-2 hover:underline">
              Learn More <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 — HOW VERIFYFLOW WORKS (Dual Workflows) */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/80 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How VerifyFlow Operates
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clear pathways built for both store staff and end-user phone buyers.
            </p>
          </div>

          {/* Workflow 1: For Businesses */}
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" /> For Phone Retailers & Businesses
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="vf-card p-5 space-y-2 relative">
                <div className="text-xs font-bold text-blue-600">STEP 01</div>
                <h4 className="text-sm font-bold text-slate-900">Create Workspace</h4>
                <p className="text-xs text-slate-500">Register your business & invite branch staff in 60 seconds.</p>
              </div>

              <div className="vf-card p-5 space-y-2 relative">
                <div className="text-xs font-bold text-blue-600">STEP 02</div>
                <h4 className="text-sm font-bold text-slate-900">Register Phones</h4>
                <p className="text-xs text-slate-500">Log stock using QR scanner, IMEI, or Serial Number.</p>
              </div>

              <div className="vf-card p-5 space-y-2 relative">
                <div className="text-xs font-bold text-blue-600">STEP 03</div>
                <h4 className="text-sm font-bold text-slate-900">Manage Sales</h4>
                <p className="text-xs text-slate-500">Checkout buyers and print QR-embedded digital receipts.</p>
              </div>

              <div className="vf-card p-5 space-y-2 relative">
                <div className="text-xs font-bold text-blue-600">STEP 04</div>
                <h4 className="text-sm font-bold text-slate-900">Grow Your Business</h4>
                <p className="text-xs text-slate-500">Track multi-branch analytics and eliminate warranty fraud.</p>
              </div>
            </div>
          </div>

          {/* Workflow 2: For Customers */}
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> For Phone Buyers & Customers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="vf-card p-5 space-y-2 bg-emerald-50/30 border-emerald-200/80">
                <div className="text-xs font-bold text-emerald-700">STEP 01</div>
                <h4 className="text-sm font-bold text-slate-900">Scan QR Code or Enter IMEI</h4>
                <p className="text-xs text-slate-600">Scan the receipt QR code or enter phone IMEI on store link.</p>
              </div>

              <div className="vf-card p-5 space-y-2 bg-emerald-50/30 border-emerald-200/80">
                <div className="text-xs font-bold text-emerald-700">STEP 02</div>
                <h4 className="text-sm font-bold text-slate-900">Instant Verification</h4>
                <p className="text-xs text-slate-600">VerifyFlow queries the retailer's official cloud ledger in 1 second.</p>
              </div>

              <div className="vf-card p-5 space-y-2 bg-emerald-50/30 border-emerald-200/80">
                <div className="text-xs font-bold text-emerald-700">STEP 03</div>
                <h4 className="text-sm font-bold text-slate-900">Know Your Phone's Origin</h4>
                <p className="text-xs text-slate-600">Get immediate proof of purchase, warranty dates, and genuine seal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — PRODUCT SHOWCASE (Interactive Tabs) */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore the VerifyFlow Interface
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Click through active screens to preview actual store workflows.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap justify-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl max-w-3xl mx-auto text-xs font-bold">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'verification', label: 'Verification Portal' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'sales', label: 'Sales & Receipts' },
            { id: 'reports', label: 'Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setShowcaseTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all ${
                showcaseTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Screen Mockup */}
        <div className="vf-card border-slate-200 shadow-card-hover p-6 rounded-2xl bg-white max-w-5xl mx-auto">
          {showcaseTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Live Executive Store Dashboard</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Total Stock Value</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">₦148,920,000</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">Verified Devices</div>
                  <div className="text-2xl font-extrabold text-emerald-900 mt-1">1,210</div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-700 font-semibold">Active Warranties</div>
                  <div className="text-2xl font-extrabold text-blue-900 mt-1">842</div>
                </div>
              </div>
            </div>
          )}

          {showcaseTab === 'verification' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Instant Customer Verification Result</h4>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <Badge variant="verified">VERIFIED GENUINE</Badge>
                <div className="font-bold text-slate-900 text-sm">Apple iPhone 16 Pro 256GB</div>
                <div className="text-slate-600">IMEI: 354892019283741 • Retailer: TechWorld Mobile</div>
                <div className="text-emerald-700 font-semibold pt-1">Warranty Active until July 22, 2027</div>
              </div>
            </div>
          )}

          {showcaseTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Serial & IMEI-Tracked Inventory Ledger</h4>
                  <p className="text-xs text-slate-500 font-medium">Real-time dual-IMEI verification, stock levels & branch distribution</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-extrabold flex items-center gap-1 self-start sm:self-auto">
                  <Smartphone className="w-3.5 h-3.5" /> 1,420 Units Tracked
                </span>
              </div>

              {/* Detailed Inventory Ledger Table Container */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-y-3">
                
                {/* Single Detailed Device Row Example */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md">
                        iP
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-sm">Apple iPhone 16 Pro Max (512GB)</h5>
                        <p className="text-xs text-slate-500 font-medium">Natural Titanium • Model A3106 • Unlocked</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        18 In Stock
                      </span>
                      <Badge variant="verified" size="sm">VERIFIED ORIGIN</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-white p-3 rounded-xl border border-slate-200 text-slate-700 shadow-inner">
                    <div><span className="font-extrabold text-slate-900 font-sans">Primary IMEI:</span> 354892019283741</div>
                    <div><span className="font-extrabold text-slate-900 font-sans">Serial No:</span> SN-IP16P-908123</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-semibold pt-1">
                    <span>Stock Allocation: 12 Downtown Flagship • 6 Eastside Mall</span>
                    <span className="text-blue-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% IMEIs Verified & Scanned
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {showcaseTab === 'sales' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-base font-bold text-slate-900">Thermal POS Receipt Generation</h4>
              
              {/* Photo-Realistic 80mm Thermal Receipt Container */}
              <div className="max-w-md bg-white border border-slate-300 shadow-2xl rounded-2xl p-6 font-mono text-xs text-slate-900 space-y-4 relative overflow-hidden">
                
                {/* Store Header */}
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-black text-slate-900 text-sm tracking-tight">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> TECHWORLD MOBILE
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans font-medium">Main Downtown Flagship • Branch #01</p>
                  <p className="text-[10px] text-slate-400 font-mono">102 Tech Plaza • Tel: +1 (555) 019-2834</p>
                </div>

                <div className="border-b-2 border-dashed border-slate-300 py-1" />

                {/* Receipt Meta */}
                <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono">
                  <span>RECEIPT #: VF-REC-90812</span>
                  <span>AUG 03, 2026 14:32</span>
                </div>

                <div className="border-b border-slate-200" />

                {/* Item Details */}
                <div className="space-y-2">
                  <div className="flex justify-between font-extrabold text-slate-900 text-xs">
                    <span>1x iPhone 16 Pro (512GB Titanium)</span>
                    <span>₦1,199,000</span>
                  </div>
                  <div className="pl-3 space-y-0.5 text-[10px] text-slate-600 font-mono">
                    <p><span className="font-bold text-slate-700">IMEI 1:</span> 354892019283741</p>
                    <p><span className="font-bold text-slate-700">SERIAL:</span> SN-IP16P-908123</p>
                    <p><span className="font-bold text-slate-700">COLOR:</span> Natural Titanium</p>
                    <p className="text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 12-Month Verified Warranty Included
                    </p>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-slate-300 py-1" />

                {/* Totals Breakdown */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>SUBTOTAL</span>
                    <span>₦1,199,000</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>SALES TAX (8.0%)</span>
                    <span>₦95,920</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>TOTAL PAID</span>
                    <span>₦1,294,920</span>
                  </div>
                  <p className="text-[10px] text-slate-500 text-right pt-0.5">Paid via Visa Credit (•••• 4819)</p>
                </div>

                <div className="border-b-2 border-dashed border-slate-300 py-1" />

                {/* Verification QR Code Section */}
                <div className="pt-2 text-center space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 bg-white p-1.5 border border-slate-300 rounded-lg mx-auto flex items-center justify-center shadow-inner">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider">
                      SCAN QR TO VERIFY DEVICE ORIGIN
                    </p>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">
                      VerifyFlow Public Warranty & IMEI Ledger
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED GENUINE RECEIPT
                  </div>
                </div>

              </div>
            </div>
          )}

          {showcaseTab === 'reports' && (
            <div className="space-y-5 animate-in fade-in duration-150 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Branch Revenue & Claims Analytics</h4>
                  <p className="text-xs text-slate-500 font-medium">Real-time store performance, warranty claim ratios & sales volume</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center gap-1 self-start sm:self-auto">
                  <TrendingUp className="w-3.5 h-3.5" /> +12.4% Gross Growth
                </span>
              </div>

              {/* Multi-Branch Performance Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                {/* Branch 1 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      MAIN FLAGSHIP
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">+14.2%</span>
                  </div>
                  <h5 className="font-extrabold text-slate-900 text-sm">Downtown Branch</h5>
                  <p className="text-2xl font-extrabold text-slate-900">₦92,400,000</p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>1,248 Units Sold</span>
                    <span className="text-emerald-600 font-bold">99.8% Clean Record</span>
                  </div>
                </div>

                {/* Branch 2 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      MALL BRANCH
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">+8.5%</span>
                  </div>
                  <h5 className="font-extrabold text-slate-900 text-sm">Eastside Mall Branch</h5>
                  <p className="text-2xl font-extrabold text-slate-900">₦48,900,000</p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>612 Units Sold</span>
                    <span className="text-emerald-600 font-bold">99.2% Clean Record</span>
                  </div>
                </div>

                {/* Branch 3 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      TECH OUTLET
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">+5.1%</span>
                  </div>
                  <h5 className="font-extrabold text-slate-900 text-sm">West End Outlet</h5>
                  <p className="text-2xl font-extrabold text-slate-900">₦28,200,000</p>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>380 Units Sold</span>
                    <span className="text-emerald-600 font-bold">98.9% Clean Record</span>
                  </div>
                </div>

              </div>

              {/* AI Insights & Revenue Bar Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* AI Automated Insight Pill */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-md border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
                    AI Store Intelligence
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    <strong>iPhone 16 Pro Max</strong> accounts for 42% of gross retail revenue across all 3 locations. Zero fraudulent warranty claims reported.
                  </p>
                </div>

                {/* Mini Visual Bar Chart */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Gross Sales Volume Trend</span>
                    <span className="text-[10px] font-mono text-blue-600">30-Day Aggregated</span>
                  </div>
                  
                  <div className="h-10 w-full flex items-end gap-1.5 pt-1">
                    <div className="flex-1 bg-blue-100 hover:bg-blue-200 h-[40%] rounded-t-md transition" />
                    <div className="flex-1 bg-blue-200 hover:bg-blue-300 h-[60%] rounded-t-md transition" />
                    <div className="flex-1 bg-blue-300 hover:bg-blue-400 h-[55%] rounded-t-md transition" />
                    <div className="flex-1 bg-blue-500 hover:bg-blue-600 h-[80%] rounded-t-md transition" />
                    <div className="flex-1 bg-blue-600 h-[98%] rounded-t-md shadow-sm" />
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </section>

      {/* SECTION 9 — WHY VERIFYFLOW (Comparison Matrix) */}
      <section className="py-20 bg-slate-100/70 border-y border-slate-200 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Why Phone Retailers Choose VerifyFlow</h2>
            <p className="text-xs sm:text-sm text-slate-500">Direct comparison with legacy spreadsheets & generic POS software.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            {/* Traditional Method */}
            <div className="vf-card p-6 border-rose-200 bg-rose-50/30 space-y-4">
              <div className="font-bold text-rose-900 text-base">Traditional Method (Paper & Excel)</div>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-500 shrink-0" /> Paper Receipts (Easy to lose or fake)
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-500 shrink-0" /> Excel Sheets (No instant public customer lookup)
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-500 shrink-0" /> Manual IMEI Checks (Prone to typos)
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-500 shrink-0" /> Frequent Customer Disputes
                </li>
              </ul>
            </div>

            {/* VerifyFlow */}
            <div className="vf-card p-6 border-emerald-300 bg-emerald-50/40 space-y-4 shadow-card">
              <div className="font-bold text-emerald-950 text-base flex items-center justify-between">
                <span>VerifyFlow Platform</span>
                <Badge variant="verified" size="sm">RECOMMENDED</Badge>
              </div>
              <ul className="space-y-3 text-slate-800 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Cryptographic Cloud Ledger
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> 2-Second Instant Public Verification
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Digital & Thermal QR Receipts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Fraud-Proof Warranty Protection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — TESTIMONIALS */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by 500+ Phone Store Owners
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="vf-card p-6 space-y-4">
            <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "VerifyFlow stopped customer warranty swaps completely. Now every phone we sell has a scanned QR receipt linked to its IMEI."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
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
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "Managing 4 store branches used to require constant phone calls. With VerifyFlow, serial stock transfers take 10 seconds."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
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
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "Our buyers love scanning the QR receipt on their phone to verify warranty expiration. It makes us look extremely professional."
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                D
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">David Chen</div>
                <div className="text-[10px] text-slate-500">Wholesale Manager, GlobalPhone</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 12 — FAQ (Accordion) */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does phone verification work?',
              a: 'Retailers register devices by scanning manufacturer QR codes, IMEI, or Serial Numbers. VerifyFlow links the device to your store ledger. Buyers can scan receipt QR codes or enter IMEI on your store link to instantly verify authenticity.',
            },
            {
              q: 'Can customers verify purchases without an account?',
              a: 'Yes! Customers do not need to register or log in. The verification portal is completely public and frictionless.',
            },
            {
              q: 'Can I manage multiple store branches?',
              a: 'Yes, VerifyFlow supports multi-branch management. You can track inventory transfers between stores and monitor branch revenue.',
            },
            {
              q: 'Do I need special hardware to run VerifyFlow?',
              a: 'No. VerifyFlow is cloud-based and runs on any modern browser (laptop, tablet, smartphone). Standard USB/Bluetooth barcode scanners are supported.',
            },
            {
              q: 'Can I print receipts directly to thermal printers?',
              a: 'Yes! VerifyFlow includes a custom receipt builder supporting 80mm thermal POS rolls, 58mm rolls, and standard A4 sheets.',
            },
            {
              q: 'Can I scan manufacturer QR codes on phone boxes?',
              a: 'Yes, our built-in QR scanner reads standard manufacturer box barcodes instantly.',
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

      {/* SECTION 13 — FINAL CTA */}
      <section className="py-20 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 border-t border-slate-200 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to Modernize Your Phone Business?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
            Join hundreds of phone retailers, distributors, and electronics businesses using VerifyFlow to simplify verification, inventory, sales, and warranty management.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/onboarding">
              <Button variant="primary" size="lg" className="shadow-md shadow-blue-600/10">
                Get Started
              </Button>
            </Link>
            <a href="#verify-widget">
              <Button variant="secondary" size="lg">
                Try Verification Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-700 text-sm py-14 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Product</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><Link href="/pricing" className="hover:text-blue-600 transition">Pricing & Plans</Link></li>
              <li><a href="#features" className="hover:text-blue-600 transition">Features</a></li>
              <li><a href="#solutions" className="hover:text-blue-600 transition">Verification Ledger</a></li>
              <li><Link href="/pricing" className="hover:text-blue-600 transition">Pricing Plans</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Resources</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><a href="#faq" className="hover:text-blue-600 transition">Help Center</a></li>
              <li><a href="#faq" className="hover:text-blue-600 transition">Documentation</a></li>
              <li><span className="text-slate-400">Developer API (Soon)</span></li>
              <li><span className="text-slate-400">Blog (Soon)</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Company</div>
            <ul className="space-y-2.5 font-medium text-slate-700">
              <li><a href="#" className="hover:text-blue-600 transition">About VerifyFlow</a></li>
              <li><a href="#" className="hover:text-blue-600 transition">Contact Sales</a></li>
              <li><span className="text-slate-400">Careers (Hiring)</span></li>
            </ul>
          </div>

          {/* Col 4 */}
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
