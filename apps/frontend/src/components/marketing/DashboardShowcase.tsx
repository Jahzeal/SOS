'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  List,
  Package,
  ShoppingCart,
  Users,
  Wrench,
  BarChart3,
  Settings,
  Smartphone,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Plus,
  Receipt,
  Search,
  Bell,
  Unlock,
  Printer,
  Share2,
  Building2,
  Download,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Badge } from '@/components/ui/Badge';

/**
 * Compact copies of four real dashboard pages (Dashboard, Verify, Inventory,
 * Receipts), built from the same styles as the pages under /dashboard so they
 * stay sharp at any size. Nothing here is live: all figures are examples.
 *
 * Layout rules: nothing scrolls sideways. Tables keep only the columns that fit
 * the frame on laptops, and turn into stacked cards on phones (as the real app does).
 */

type TabId = 'dashboard' | 'verification' | 'inventory' | 'sales';

const TABS: { id: TabId; label: string; menu: string; path: string }[] = [
  { id: 'dashboard', label: 'Dashboard', menu: 'Dashboard', path: 'dashboard' },
  { id: 'verification', label: 'Verification Portal', menu: 'Verify IMEI & QR', path: 'dashboard/verify' },
  { id: 'inventory', label: 'Inventory', menu: 'Inventory', path: 'dashboard/inventory' },
  { id: 'sales', label: 'Sales & Receipts', menu: 'Sales & Invoices', path: 'dashboard/sales/receipts' },
];

// Same items, order and icons as the real sidebar (components/Sidebar.tsx), shortened list.
const MENU = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Register Phone / Item', icon: PlusCircle },
  { name: 'Verify IMEI & QR', icon: ShieldCheck },
  { name: 'Phone & Item Records', icon: List },
  { name: 'Inventory', icon: Package },
  { name: 'Sales & Invoices', icon: ShoppingCart },
  { name: 'Customers', icon: Users },
  { name: 'Repairs', icon: Wrench },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Settings', icon: Settings },
];

/** Floating glass cards shown beside the frame on wide screens, one pair per tab. */
const GLASS: Record<TabId, { left: { icon: any; tone: string; title: string; text: string }; right: { icon: any; tone: string; title: string; text: string } }> = {
  dashboard: {
    left: { icon: TrendingUp, tone: 'text-success-600 bg-success-50', title: 'Profit today', text: '₦1.2m  ↑12% on yesterday' },
    right: { icon: Clock, tone: 'text-warning-600 bg-warning-50', title: '23 warranties', text: 'end this month' },
  },
  verification: {
    left: { icon: ShieldCheck, tone: 'text-success-600 bg-success-50', title: 'Verified genuine', text: 'Sold by Zenith Gadgets' },
    right: { icon: CheckCircle2, tone: 'text-accent-600 bg-accent-50', title: 'No theft report', text: 'Safe to buy' },
  },
  inventory: {
    left: { icon: Smartphone, tone: 'text-accent-600 bg-accent-50', title: 'Tecno Camon 30 Pro', text: 'Added 6 days ago' },
    right: { icon: AlertTriangle, tone: 'text-danger-600 bg-danger-50', title: '14 phones', text: 'in stock over 60 days' },
  },
  sales: {
    left: { icon: Receipt, tone: 'text-accent-600 bg-accent-50', title: '₦385,000 sale', text: 'PDF sent on WhatsApp' },
    right: { icon: CheckCircle2, tone: 'text-success-600 bg-success-50', title: '912 receipts', text: 'issued with the IMEI on them' },
  },
};

function GlassCard({ icon: Icon, tone, title, text, className }: { icon: any; tone: string; title: string; text: string; className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`hidden xl:flex absolute z-20 items-center gap-3 w-56 px-4 py-3 rounded-2xl bg-white/55 backdrop-blur-xl border border-white/80 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 ${className}`}
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold text-slate-900 truncate">{title}</span>
        <span className="block text-[11px] font-semibold text-slate-600 truncate">{text}</span>
      </span>
    </div>
  );
}

/** A non-clickable copy of a button, styled like the app's Button. */
function FakeButton({ primary, icon: Icon, children }: { primary?: boolean; icon?: any; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap ${
        primary ? 'bg-accent-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}

function PageHeader({ title, text, actions }: { title: string; text: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 border-b border-slate-200/80 pb-3">
      <div className="min-w-0">
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">{title}</h3>
        <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">{text}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

function FakeSearch({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-400 min-w-0 ${className}`}>
      <Search className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- Dashboard */

function KpiCard({ label, value, note, icon: Icon, tone = 'accent' }: { label: string; value: string; note: string; icon: any; tone?: 'accent' | 'success' }) {
  return (
    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{label}</span>
        <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${tone === 'success' ? 'bg-success-50 border-success-100 text-success-600' : 'bg-accent-50 border-accent-100 text-accent-600'}`}>
          <Icon className="w-3 h-3" />
        </span>
      </div>
      <div className={`text-[15px] sm:text-base font-extrabold tracking-tight truncate ${tone === 'success' ? 'text-success-700' : 'text-slate-900'}`}>{value}</div>
      <div className={`text-[10px] sm:text-[11px] font-bold truncate ${tone === 'success' ? 'text-success-600' : 'text-slate-500'}`}>{note}</div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">Good Morning, Tobi</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Here is your store today.</p>
        </div>
        <FakeButton primary icon={Plus}>Register Item</FakeButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KpiCard label="Revenue" value="₦84,650,000" note="Total settled sales" icon={DollarSign} />
        <KpiCard label="Profit Made" value="₦9,820,000" note="11.6% margin" icon={TrendingUp} tone="success" />
        <KpiCard label="Phones Sold" value="912" note="Completed sales" icon={CheckCircle2} tone="success" />
        <KpiCard label="In-Stock" value="372" note="Ready for checkout" icon={Package} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-success-600" /> Sales this week
            </h4>
            <span className="text-[11px] font-bold text-success-600">↑ 18%</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[42, 58, 35, 70, 64, 88, 52].map((h, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                <div className={`w-full rounded-t-md ${i === 5 ? 'bg-accent-600' : 'bg-accent-200'}`} style={{ height: `${h}%` }} />
                <span className="text-[10px] text-slate-400 font-semibold">{'MTWTFSS'[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h4 className="font-extrabold text-xs text-slate-900">What&apos;s happening</h4>
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="w-7 h-7 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </span>
            <p className="text-[11px] text-slate-700 font-medium leading-snug">
              <strong className="text-slate-900">iPhone 15 Pro Max</strong> is your top seller this week, with 34 sold.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-danger-50/60 border border-danger-200/70">
            <span className="w-7 h-7 rounded-lg bg-danger-50 text-danger-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
            <p className="text-[11px] text-slate-700 font-medium leading-snug">
              <strong className="text-slate-900">Infinix Note 40 Pro</strong> has been in stock for 71 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------- Verify (/dashboard/verify) */

function VerificationScreen() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="IMEI Verification & Anti-Theft Scanner"
        text="Check who sold a device, its warranty, and any theft report."
        actions={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-danger-200 text-danger-600 bg-white text-[11px] font-bold whitespace-nowrap">
            <ShieldAlert className="w-3.5 h-3.5" /> Report Stolen
          </span>
        }
      />

      <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-900 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">353271119045672</span>
        </div>
        <FakeButton primary icon={ShieldCheck}>Verify</FakeButton>
      </div>

      <div className="p-3.5 rounded-2xl border bg-success-50 border-success-200 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-success-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Verified Authentic Store Purchase</h4>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium">Sold by Zenith Gadgets (Authorized Dealer).</p>
        </div>
        <span className="hidden sm:inline px-2.5 py-1 rounded-full bg-success-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
          Authorized Dealer
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-900 truncate">Apple iPhone 15 Pro Max</h4>
            <p className="text-[11px] text-slate-500 font-mono">IMEI: 353271119045672</p>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-success-50 border border-success-200 text-success-800 text-[11px] font-bold shrink-0">
            <Building2 className="w-3.5 h-3.5 text-success-600" /> Zenith Gadgets
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Theft', 'Clean', ShieldCheck, 'text-success-700'],
            ['Carrier', 'Unlocked', Unlock, 'text-success-700'],
            ['Warranty', '12 mo • Active', CheckCircle2, 'text-accent-700'],
          ].map(([label, value, Icon, tone]: any) => (
            <div key={label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              <span className={`flex items-center gap-1 text-[11px] sm:text-xs font-extrabold ${tone}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------ Inventory (/dashboard/inventory) */

const STOCK = [
  { model: 'iPhone 15 Pro Max', brand: 'Apple', storage: '256GB', imei: '353271119045672', days: 12, warranty: 'active', value: '₦1,650,000' },
  { model: 'Camon 30 Pro', brand: 'Tecno', storage: '256GB', imei: '356938035643809', days: 6, warranty: 'active', value: '₦385,000' },
  { model: 'Note 40 Pro', brand: 'Infinix', storage: '256GB', imei: '359022417738215', days: 71, warranty: 'none', value: '₦310,000' },
  { model: 'Galaxy S24 Ultra', brand: 'Samsung', storage: '512GB', imei: '351846290017734', days: 27, warranty: 'active', value: '₦1,420,000' },
];

function DaysInStock({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-bold whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full ${days > 60 ? 'bg-danger-600' : 'bg-success-600'}`} />
      <span className={days > 60 ? 'text-danger-600 font-extrabold' : 'text-slate-800'}>{days} days</span>
    </span>
  );
}

function InventoryScreen() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Inventory Overview"
        text="Your stock, how long each unit has waited, and its value."
        actions={<FakeButton primary icon={Plus}>Register Item</FakeButton>}
      />

      <div className="grid grid-cols-3 gap-2">
        {[
          ['In stock', '372', 'bg-white border-slate-200', 'text-slate-900'],
          ['Stock value', '₦96.2m', 'bg-white border-slate-200', 'text-slate-900'],
          ['Over 60 days', '14', 'bg-danger-50 border-danger-200', 'text-danger-700'],
        ].map(([label, value, box, text]) => (
          <div key={label} className={`p-2.5 rounded-xl border shadow-sm min-w-0 ${box}`}>
            <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 truncate">{label}</p>
            <p className={`text-sm sm:text-base font-extrabold truncate ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-2.5 border-b border-slate-100">
          <FakeSearch text="Search by IMEI, Model, or Serial..." className="sm:max-w-xs" />
        </div>

        {/* Phones: stacked cards, like the real Inventory page */}
        <div className="sm:hidden divide-y divide-slate-100">
          {STOCK.slice(0, 3).map((item) => (
            <div key={item.imei} className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 text-xs truncate">{item.model}</p>
                  <p className="text-[11px] text-slate-500">{item.brand} • {item.storage}</p>
                </div>
                <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">{item.value}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono font-bold text-slate-600 truncate">{item.imei}</span>
                <DaysInStock days={item.days} />
              </div>
            </div>
          ))}
        </div>

        {/* Tablets and laptops: a table that fits the frame */}
        <table className="hidden sm:table w-full text-[11px] text-left table-fixed">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[27%]" />
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50/60">
              <th className="py-2 px-3 font-bold">Model</th>
              <th className="py-2 px-2 font-bold">IMEI</th>
              <th className="py-2 px-2 font-bold">In stock</th>
              <th className="py-2 px-2 font-bold">Warranty</th>
              <th className="py-2 px-3 font-bold text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {STOCK.map((item) => (
              <tr key={item.imei} className="border-b border-slate-100 last:border-0">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-accent-50 border border-accent-200/80 text-accent-600 flex items-center justify-center shrink-0">
                      <Smartphone className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-slate-900 truncate">{item.model}</span>
                      <span className="block text-slate-500 truncate">{item.brand} • {item.storage}</span>
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 font-mono font-bold text-slate-700 truncate">{item.imei}</td>
                <td className="py-2 px-2"><DaysInStock days={item.days} /></td>
                <td className="py-2 px-2">
                  <Badge variant={item.warranty === 'active' ? 'verified' : 'sold'} size="sm">
                    {item.warranty === 'active' ? 'ACTIVE' : 'NONE'}
                  </Badge>
                </td>
                <td className="py-2 px-3 font-extrabold text-slate-900 text-right whitespace-nowrap">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Sales & Receipts (/dashboard/sales/receipts) */

const RECEIPTS = [
  { no: 'VF-REC-925097', who: 'Chiamaka Obi', items: 'Tecno Camon 30 Pro', amount: '₦385,000', status: 'PAID' },
  { no: 'VF-REC-925096', who: 'Emeka Nwosu', items: 'iPhone 13 (128GB)', amount: '₦690,000', status: 'PAID' },
  { no: 'VF-REC-925095', who: 'Aisha Bello', items: 'Oraimo FreePods 4 + 1 more', amount: '₦41,000', status: 'PAID' },
  { no: 'VF-INV-310442', who: 'Kunle Adebayo', items: 'Galaxy S24 Ultra', amount: '₦1,420,000', status: 'PENDING' },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

function IconAction({ primary, icon: Icon, label }: { primary?: boolean; icon: any; label: string }) {
  return (
    <span
      title={label}
      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center ${primary ? 'bg-accent-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}

function SalesScreen() {
  return (
    <div className="space-y-3">
      <PageHeader
        title="Receipts Archive"
        text="Re-print, share and check past sales."
        actions={
          <>
            <span className="hidden sm:inline-flex"><FakeButton icon={Download}>Export</FakeButton></span>
            <FakeButton primary icon={Plus}>New Sale</FakeButton>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        {[
          ['Sales', '912'],
          ['Revenue', '₦84.65m'],
          ['Avg. sale', '₦92,818'],
        ].map(([label, value]) => (
          <div key={label} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm min-w-0">
            <p className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 truncate">{label}</p>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-2.5 border-b border-slate-100">
          <FakeSearch text="Search receipt #, customer, or IMEI..." className="sm:max-w-xs" />
        </div>

        {/* Phones: stacked cards, like the real Receipts page */}
        <div className="sm:hidden divide-y divide-slate-100">
          {RECEIPTS.slice(0, 3).map((r) => (
            <div key={r.no} className="p-3 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-accent-50 text-accent-600 font-extrabold flex items-center justify-center text-[11px] border border-accent-200 shrink-0">
                {initials(r.who)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900 text-xs truncate">{r.who}</p>
                <p className="text-[11px] text-slate-500 truncate">{r.items}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-slate-900 text-xs">{r.amount}</p>
                <Badge variant={r.status === 'PAID' ? 'verified' : 'business'} size="sm">{r.status}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Tablets and laptops: a table that fits the frame */}
        <table className="hidden sm:table w-full text-[11px] text-left table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[36%]" />
            <col className="w-[16%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50/60">
              <th className="py-2 px-3 font-bold">Receipt #</th>
              <th className="py-2 px-2 font-bold">Customer</th>
              <th className="py-2 px-2 font-bold">Amount</th>
              <th className="py-2 px-2 font-bold">Status</th>
              <th className="py-2 px-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {RECEIPTS.map((r) => (
              <tr key={r.no} className="border-b border-slate-100 last:border-0">
                <td className="py-2 px-3 font-mono font-bold text-accent-600 truncate">{r.no}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-accent-50 text-accent-600 font-extrabold flex items-center justify-center text-[10px] border border-accent-200 shrink-0">
                      {initials(r.who)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-slate-900 truncate">{r.who}</span>
                      <span className="block text-slate-500 truncate">{r.items}</span>
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 font-extrabold text-slate-900 whitespace-nowrap">{r.amount}</td>
                <td className="py-2 px-2">
                  <Badge variant={r.status === 'PAID' ? 'verified' : 'business'} size="sm">{r.status}</Badge>
                </td>
                <td className="py-2 px-3">
                  <span className="flex items-center justify-end gap-1">
                    <IconAction icon={Printer} label="Print" />
                    <IconAction primary icon={Share2} label="Share" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- The section */

export function DashboardShowcase() {
  const [tab, setTab] = useState<TabId>('dashboard');
  const active = TABS.find((t) => t.id === tab)!;
  const glass = GLASS[tab];

  return (
    <section className="relative py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8 overflow-hidden">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Explore the NoxGuarda Interface</h2>
        <p className="text-xs sm:text-sm text-slate-500">These are the screens your store works in. The figures shown are examples.</p>
      </div>

      {/* Frosted switcher; the chosen screen is a plain raised white pill in brand teal. */}
      <div
        role="tablist"
        aria-label="App screens"
        className="relative z-10 flex flex-wrap justify-center gap-1 w-fit max-w-full mx-auto p-1 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200/70 shadow-sm shadow-slate-900/5 text-xs font-bold"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-white text-accent-700 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Soft brand-coloured glow behind the frame; it is what makes the glass cards look like glass. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-10 -left-16 w-72 h-72 rounded-full bg-accent-400/30 blur-3xl" />
          <div className="absolute -bottom-12 -right-16 w-80 h-80 rounded-full bg-emerald-300/35 blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-cyan-200/30 blur-3xl" />
        </div>

        <GlassCard {...glass.left} className="-left-48 -top-5 -rotate-2 ng-glass-float" />
        <GlassCard {...glass.right} className="-right-48 -bottom-5 rotate-2 ng-glass-float-delayed" />

        {/* Browser window around the app */}
        <div className="relative z-10 rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
          <div className="h-9 bg-slate-100/90 border-b border-slate-200 flex items-center gap-3 px-3.5">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            </div>
            <div className="flex-1 max-w-sm mx-auto h-5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500 font-medium flex items-center justify-center px-2 min-w-0">
              <span className="truncate">noxguarda.com/{active.path}</span>
            </div>
          </div>

          <div className="flex bg-slate-50 select-none" aria-label={`Example of the ${active.label} screen`}>
            <aside className="hidden md:flex w-44 shrink-0 flex-col bg-white border-r border-slate-200">
              <div className="h-12 border-b border-slate-100 flex items-center gap-2 px-3.5">
                <BrandLogo size="sm" />
                <span className="font-space font-extrabold uppercase tracking-[0.16em] text-[11px] text-slate-900">NoxGuarda</span>
              </div>
              <div className="mx-2.5 my-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 truncate">Zenith Gadgets</div>
                  <div className="text-[10px] text-slate-500">Main Branch</div>
                </div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-accent-50 text-accent-700 border border-accent-200">GOLD</span>
              </div>
              <nav className="px-2 space-y-0.5 pb-3">
                {MENU.map(({ name, icon: Icon }) => (
                  <div
                    key={name}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${
                      name === active.menu ? 'bg-accent-600 text-white shadow-md shadow-accent-600/20 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0">
              <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-3.5 gap-3">
                <FakeSearch text="Search IMEI, customer or receipt" className="w-full max-w-[15rem] bg-slate-50" />
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="relative">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-danger-500" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-accent-600 text-white text-[10px] font-bold flex items-center justify-center">TA</span>
                </div>
              </div>

              <div className="p-3 sm:p-4 sm:min-h-[372px]">
                {tab === 'dashboard' && <DashboardScreen />}
                {tab === 'verification' && <VerificationScreen />}
                {tab === 'inventory' && <InventoryScreen />}
                {tab === 'sales' && <SalesScreen />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
