'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
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
  ChevronDown,
  Building,
  Store,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  Clock,
  Wrench,
  HelpCircle,
  Bell,
  Sliders,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  Copy,
  ExternalLink,
  MessageSquare,
  X,
} from 'lucide-react';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [salesTimeframe, setSalesTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [livePhones, setLivePhones] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // Protected Route Guard
  useEffect(() => {
    if (!isLoading && !user) {
      const hasToken = typeof window !== 'undefined' && localStorage.getItem('vf_access_token');
      if (!hasToken) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // Fetch Live Backend Data
  useEffect(() => {
    async function loadData() {
      try {
        const inventory = await api.getInventory();
        setLivePhones(inventory);
      } catch (err) {
        console.warn('Dashboard fetch skipped/offline:', err);
        setLivePhones([]);
      } finally {
        setIsFetching(false);
      }
    }
    if (user) {
      loadData();
    }
  }, [user]);

  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Store Owner';
  const businessName = user?.business?.name || 'My Store Workspace';
  const plan = user?.business?.plan || 'BUSINESS';

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* ========================================================================= */}
      {/* 1. WELCOME BANNER (Executive Header)                                     */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80">
              {businessName} • {plan} PLAN
            </span>
            <span className="text-slate-500 text-xs font-semibold">
              <span className="hidden sm:inline">• </span>Main Downtown Branch
            </span>
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition flex items-center gap-1 cursor-pointer shadow-subtle"
            >
              <span>Setup Progress {livePhones.length > 0 ? '75%' : '50%'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
            Welcome back to VerifyFlow. Here's a real-time summary of your store's inventory, phone registrations, sales, and warranty activity today.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-3 relative z-10 shrink-0 w-full sm:w-auto">
          <Link href="/dashboard/register" className="flex-1 sm:flex-none">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-md shadow-blue-600/10 font-bold"
            >
              Register New Phone
            </Button>
          </Link>
          <Link href="/dashboard/verify" className="flex-1 sm:flex-none">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Receipt className="w-4 h-4 text-blue-600" />}
              className="w-full sm:w-auto bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
            >
              Record Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI STAT CARDS GRID (6 Cards)                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Phones Registered */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{livePhones.length.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" /> Real-time database ledger
          </div>
        </div>

        {/* Card 2: Phones Sold */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phones Sold</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {livePhones.filter((p) => p.status === 'SOLD').length.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" /> Completed transactions
          </div>
        </div>

        {/* Card 3: In Stock Units */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In-Stock</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {livePhones.filter((p) => p.status === 'IN_STOCK').length.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
            <TrendingUp className="w-3.5 h-3.5" /> Ready for POS checkout
          </div>
        </div>

        {/* Card 4: Active Warranties */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warranties</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {livePhones.filter((p) => p.warrantyExpiryDate && new Date(p.warrantyExpiryDate) > new Date()).length.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-amber-700">Active store guarantees</div>
        </div>

        {/* Card 5: Repairs In Progress */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Repairs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {livePhones.filter((p) => p.status === 'IN_REPAIR').length.toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-purple-700">In technician queue</div>
        </div>

        {/* Card 6: Stock Valuation */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Value</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            ₦{livePhones.reduce((sum, p) => sum + (p.sellingPrice || 0), 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-bold text-slate-500">Live inventory value</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTIONS TOOLBAR                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Quick Actions Toolbar</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/dashboard/register"
            className="p-4 rounded-xl vf-card bg-white border border-slate-200 hover:border-blue-500 transition-all flex items-center gap-3 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Register Phone</div>
              <div className="text-[10px] text-slate-500 font-medium">Add serial / IMEI</div>
            </div>
          </Link>

          <Link
            href="/dashboard/verify"
            className="p-4 rounded-xl vf-card bg-white border border-slate-200 hover:border-blue-500 transition-all flex items-center gap-3 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Verify Device</div>
              <div className="text-[10px] text-slate-500 font-medium">Lookup IMEI or QR</div>
            </div>
          </Link>

          <Link
            href="/dashboard/records"
            className="p-4 rounded-xl vf-card bg-white border border-slate-200 hover:border-blue-500 transition-all flex items-center gap-3 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Issue Receipt</div>
              <div className="text-[10px] text-slate-500 font-medium">80mm POS format</div>
            </div>
          </Link>

          <Link
            href="/dashboard/records"
            className="p-4 rounded-xl vf-card bg-white border border-slate-200 hover:border-blue-500 transition-all flex items-center gap-3 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Add Customer</div>
              <div className="text-[10px] text-slate-500 font-medium">Link buyer profile</div>
            </div>
          </Link>

          <Link
            href="/dashboard/records"
            className="p-4 rounded-xl vf-card bg-white border border-slate-200 hover:border-blue-500 transition-all flex items-center gap-3 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">View Reports</div>
              <div className="text-[10px] text-slate-500 font-medium">Sales & analytics</div>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="p-4 rounded-xl vf-card bg-white border border-slate-200 hover:border-blue-500 transition-all flex items-center gap-3 group shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs text-slate-900">Store Settings</div>
              <div className="text-[10px] text-slate-500 font-medium">Branches & branding</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. OPERATIONAL SUMMARY SNAPSHOT GRID (Inventory, Sales, Warranties)     */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Inventory Status */}
        <div className="vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> Inventory Status
            </h4>
            <Link href="/dashboard/inventory" className="text-xs text-blue-600 font-bold hover:underline">
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-semibold">In Stock</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {livePhones.filter((p) => p.status === 'IN_STOCK').length.toLocaleString()} Units
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-emerald-800 font-semibold">Sold Devices</div>
              <div className="text-xl font-extrabold text-emerald-950 mt-1">
                {livePhones.filter((p) => p.status === 'SOLD').length.toLocaleString()} Units
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Sales Snapshot */}
        <div className="vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Sales Snapshot
            </h4>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setSalesTimeframe('daily')}
                className={`px-2 py-0.5 rounded ${salesTimeframe === 'daily' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesTimeframe('weekly')}
                className={`px-2 py-0.5 rounded ${salesTimeframe === 'weekly' ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
            <div className="font-bold text-slate-900">Total Revenue ({salesTimeframe.toUpperCase()})</div>
            <div className="text-2xl font-extrabold text-emerald-950">
              ₦{livePhones.filter((p) => p.status === 'SOLD').reduce((sum, p) => sum + (p.sellingPrice || 0), 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">Live POS Sales Revenue</div>
          </div>
        </div>

        {/* Module 3: Warranty Overview */}
        <div className="vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> Warranty Tracking
            </h4>
            <Link href="/dashboard/records" className="text-xs text-blue-600 font-bold hover:underline">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-amber-800 font-semibold">Active Guarantees</div>
              <div className="text-xl font-extrabold text-amber-950 mt-1">
                {livePhones.filter((p) => p.warrantyExpiryDate && new Date(p.warrantyExpiryDate) > new Date()).length.toLocaleString()} Units
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-rose-800 font-semibold">Expiring Soon</div>
              <div className="text-xl font-extrabold text-rose-950 mt-1">0 Devices</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Help Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSupportModal(!showSupportModal)}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-blue-500 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          title="Store Assistance"
        >
          <HelpCircle className="w-6 h-6" />
        </button>

        {showSupportModal && (
          <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3 text-xs animate-in fade-in duration-150">
            <div className="font-extrabold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>VerifyFlow Support</span>
              <span className="text-[10px] text-emerald-600 font-bold">ONLINE</span>
            </div>
            <p className="text-slate-600 font-medium">Need help configuring box QR printers or multi-branch stock transfers?</p>
            <div className="space-y-1.5 pt-1">
              <a href="#" className="block p-2 rounded-lg bg-slate-50 hover:bg-slate-100 font-bold text-slate-800">
                📚 Documentation & Guides
              </a>
              <a href="#" className="block p-2 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100">
                💬 Contact Store Support
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Setup Progress Modal (Dismissible) */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Store Onboarding Setup</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {livePhones.length > 0 ? '3 of 4 steps completed (75%)' : '2 of 4 steps completed (50%)'}
                </p>
              </div>
              <button
                onClick={() => setShowOnboardingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: livePhones.length > 0 ? '75%' : '50%' }}
              />
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Create Business Workspace ({businessName})</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase">COMPLETED</span>
              </div>

              <div className={`p-3.5 rounded-xl flex items-center justify-between ${livePhones.length > 0 ? 'bg-emerald-50/60 border border-emerald-200' : 'bg-blue-50/80 border border-blue-200'}`}>
                <div className="flex items-center gap-2.5 font-bold text-slate-900">
                  {livePhones.length > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
                  <span>2. Register First Phone (IMEI & Box QR Code)</span>
                </div>
                {livePhones.length > 0 ? (
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase">COMPLETED</span>
                ) : (
                  <Link href="/dashboard/register" onClick={() => setShowOnboardingModal(false)} className="text-xs font-bold text-blue-600 hover:underline">
                    Register Now →
                  </Link>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3. Customize Thermal QR Receipt & Logo</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-extrabold uppercase">COMPLETED</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>4. Record First Sale & Issue Digital Receipt</span>
                </div>
                <Link href="/dashboard/verify" onClick={() => setShowOnboardingModal(false)} className="text-xs font-bold text-blue-600 hover:underline">
                  Record Sale →
                </Link>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Re-open anytime from the top bar</span>
              <Button variant="secondary" size="md" onClick={() => setShowOnboardingModal(false)}>
                Dismiss for Now
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
