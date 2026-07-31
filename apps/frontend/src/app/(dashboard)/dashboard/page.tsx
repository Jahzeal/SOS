'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
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
} from 'lucide-react';

export default function BusinessDashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'instock' | 'sold'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [salesTimeframe, setSalesTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [copiedImei, setCopiedImei] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = mounted ? user?.firstName || 'Marcus' : 'Marcus';
  const businessName = mounted ? user?.business?.name || 'TechWorld Mobile' : 'TechWorld Mobile';
  const plan = mounted ? user?.business?.plan || 'BUSINESS' : 'BUSINESS';

  // Sample Registered Phones Ledger Data
  const registeredPhones = [
    {
      id: 'REC-901',
      brand: 'Apple',
      model: 'iPhone 16 Pro Max',
      imei: '354892019283741',
      serial: 'SN-IP16P-908123',
      storage: '512GB Natural Titanium',
      color: 'Natural Titanium',
      date: '2026-07-30',
      status: 'IN_STOCK',
      customer: 'Unassigned',
      warranty: '12 Months Active',
    },
    {
      id: 'REC-902',
      brand: 'Samsung',
      model: 'Galaxy S25 Ultra',
      imei: '864902049182309',
      serial: 'SN-S25U-102938',
      storage: '256GB Titanium Black',
      color: 'Titanium Black',
      date: '2026-07-29',
      status: 'IN_STOCK',
      customer: 'Unassigned',
      warranty: '24 Months Active',
    },
    {
      id: 'REC-903',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      imei: '358291048291048',
      serial: 'SN-IP15P-881290',
      storage: '128GB Blue Titanium',
      color: 'Blue Titanium',
      date: '2026-07-28',
      status: 'SOLD',
      customer: 'Alex Dev',
      warranty: 'Active (Exp 2027)',
    },
    {
      id: 'REC-904',
      brand: 'Google',
      model: 'Pixel 9 Pro',
      imei: '351982039182049',
      serial: 'SN-PX9P-440192',
      storage: '256GB Obsidian',
      color: 'Obsidian',
      date: '2026-07-26',
      status: 'IN_STOCK',
      customer: 'Unassigned',
      warranty: '12 Months Active',
    },
    {
      id: 'REC-905',
      brand: 'Apple',
      model: 'iPhone 14',
      imei: '359102938471029',
      serial: 'SN-IP14-229103',
      storage: '128GB Midnight',
      color: 'Midnight',
      date: '2026-07-25',
      status: 'SOLD',
      customer: 'Sarah Connor',
      warranty: 'Expired',
    },
  ];

  // Verification Activity Log Data
  const verificationActivity = [
    {
      id: 'ACT-1',
      device: 'iPhone 16 Pro Max',
      imei: '354892019283741',
      type: 'Customer Scan',
      time: '2 minutes ago',
      branch: 'Main Downtown Branch',
      result: 'GENUINE',
    },
    {
      id: 'ACT-2',
      device: 'Samsung Galaxy S25 Ultra',
      imei: '864902049182309',
      type: 'Staff Lookup',
      time: '14 minutes ago',
      branch: 'Westside Mall Branch',
      result: 'GENUINE',
    },
    {
      id: 'ACT-3',
      device: 'Google Pixel 9 Pro',
      imei: '351982039182049',
      type: 'Receipt QR Check',
      time: '1 hour ago',
      branch: 'Main Downtown Branch',
      result: 'GENUINE',
    },
    {
      id: 'ACT-4',
      device: 'iPhone 15 Pro',
      imei: '358291048291048',
      type: 'Warranty Claim Check',
      time: '3 hours ago',
      branch: 'Main Downtown Branch',
      result: 'GENUINE',
    },
  ];

  const filteredPhones = registeredPhones.filter((phone) => {
    if (activeTab === 'instock' && phone.status !== 'IN_STOCK') return false;
    if (activeTab === 'sold' && phone.status !== 'SOLD') return false;
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      return (
        phone.model.toLowerCase().includes(q) ||
        phone.imei.toLowerCase().includes(q) ||
        phone.serial.toLowerCase().includes(q) ||
        phone.brand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyImei = (imei: string) => {
    navigator.clipboard.writeText(imei);
    setCopiedImei(imei);
    setTimeout(() => setCopiedImei(null), 2000);
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      
      {/* ========================================================================= */}
      {/* 1. WELCOME BANNER (Executive Header)                                     */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80">
              {businessName} • {plan} PLAN
            </span>
            <span className="text-slate-500 text-xs font-semibold">• Main Downtown Branch</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Good Morning, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
            Welcome back to VerifyFlow. Here's a real-time summary of your store's inventory, phone registrations, sales, and warranty activity today.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
          <Link href="/dashboard/register">
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-md shadow-blue-600/10 font-bold"
            >
              Register New Phone
            </Button>
          </Link>
          <Link href="/dashboard/verify">
            <Button
              variant="secondary"
              size="lg"
              leftIcon={<Receipt className="w-4 h-4 text-blue-600" />}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
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
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">1,248</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% this month
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
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">412</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8.4% vs last mo
          </div>
        </div>

        {/* Card 3: Verification Requests */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifications</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">4,892</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
            <TrendingUp className="w-3.5 h-3.5" /> Customer Scans
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
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">842</div>
          <div className="text-[11px] font-bold text-amber-700">18 expiring this week</div>
        </div>

        {/* Card 5: Repairs In Progress */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Repairs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">14</div>
          <div className="text-[11px] font-bold text-purple-700">6 ready for pickup</div>
        </div>

        {/* Card 6: Total Stock Value */}
        <div className="vf-card vf-card-interactive p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Valuation</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">$148.9K</div>
          <div className="text-[11px] font-bold text-slate-500">836 In-Stock Units</div>
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
      {/* 4. SETUP CHECKLIST & REAL-TIME VERIFICATION ACTIVITY ROW                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Interactive Business Onboarding Setup Checklist */}
        <div className="lg:col-span-7 vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Store Onboarding Setup Checklist</h3>
              <p className="text-xs text-slate-500 font-medium">4 of 5 setup steps completed (80%)</p>
            </div>
            <Badge variant="verified" size="sm">
              ONBOARDING ACTIVE
            </Badge>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-4/5 rounded-full" />
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Create Business Workspace Account</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">COMPLETED</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>2. Register Your First Phone (IMEI & Box QR Code)</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">COMPLETED</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Customize Thermal QR Receipt Header & Branding</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">COMPLETED</span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>4. Record First Sale & Issue Customer Digital Receipt</span>
              </div>
              <Link href="/dashboard/records" className="text-xs font-bold text-blue-600 hover:underline">
                Complete Now →
              </Link>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Verification Activity Feed */}
        <div className="lg:col-span-5 vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Live Verification Feed</h3>
              <p className="text-xs text-slate-500 font-medium">Customer & staff scan events</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> LIVE
            </span>
          </div>

          <div className="space-y-3">
            {verificationActivity.map((act) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {act.device}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>IMEI: {act.imei}</span>
                  <span className="text-emerald-700 font-bold">{act.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT PHONE REGISTRATIONS LEDGER TABLE                               */}
      {/* ========================================================================= */}
      <div className="vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Recent Phone Registrations</h3>
            <p className="text-xs text-slate-500 font-medium">Serial & IMEI ledger log across store branches</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'}`}
              >
                All (5)
              </button>
              <button
                onClick={() => setActiveTab('instock')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'instock' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'}`}
              >
                In Stock (3)
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'sold' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'}`}
              >
                Sold (2)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search IMEI or model..."
                className="text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium text-slate-900 w-48"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Device Model</th>
                <th className="py-3 px-4">IMEI Number</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Specs & Color</th>
                <th className="py-3 px-4">Date Registered</th>
                <th className="py-3 px-4">Warranty Terms</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPhones.map((phone) => (
                <tr key={phone.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    {phone.model}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{phone.imei}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyImei(phone.imei)}
                        title="Copy IMEI"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copiedImei === phone.imei && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{phone.serial}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{phone.storage}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{phone.date}</td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">{phone.warranty}</td>
                  <td className="py-3.5 px-4 text-center">
                    {phone.status === 'IN_STOCK' ? (
                      <Badge variant="verified" size="sm">IN_STOCK</Badge>
                    ) : (
                      <Badge variant="sold" size="sm">SOLD</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href="/dashboard/records">
                      <Button variant="secondary" size="sm" className="text-[11px] font-bold">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. OPERATIONAL SUMMARY SNAPSHOT GRID (Inventory, Sales, Warranties)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Inventory Summary */}
        <div className="vf-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> Inventory Status
            </h4>
            <Link href="/dashboard/records" className="text-xs text-blue-600 font-bold hover:underline">
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-semibold">In Stock</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">836 Units</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-emerald-800 font-semibold">Sold Devices</div>
              <div className="text-xl font-extrabold text-emerald-950 mt-1">412 Units</div>
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
            <div className="text-2xl font-extrabold text-emerald-950">$34,890.00</div>
            <div className="text-[11px] text-emerald-700 font-semibold">+12.4% vs previous period</div>
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
              <div className="text-xl font-extrabold text-amber-950 mt-1">842 Units</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-rose-800 font-semibold">Expiring Soon</div>
              <div className="text-xl font-extrabold text-rose-950 mt-1">18 Devices</div>
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

    </div>
  );
}
