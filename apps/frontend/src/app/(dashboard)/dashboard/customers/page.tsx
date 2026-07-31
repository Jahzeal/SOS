'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Smartphone,
  ShieldCheck,
  Wrench,
  DollarSign,
  TrendingUp,
  Award,
  MoreVertical,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Customer {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  type: 'VIP' | 'BUSINESS' | 'REGULAR' | 'NEW';
  devicesCount: number;
  totalSpending: number;
  lastPurchaseDate: string;
  lastPurchaseItem: string;
  trustScore: number;
  branch: string;
  devices: {
    model: string;
    warrantyStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING';
    year: string;
  }[];
  recentActivity: {
    title: string;
    desc: string;
    time: string;
  }[];
}

const mockCustomers: Customer[] = [
  {
    id: 'VF-49022',
    name: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 902-3490',
    email: 'elena.r@corporate.com',
    type: 'VIP',
    devicesCount: 3,
    totalSpending: 12450.0,
    lastPurchaseDate: 'Oct 12, 2023',
    lastPurchaseItem: 'iPhone 15 Pro Max',
    trustScore: 98,
    branch: 'Central Mall Branch • Platinum Member',
    devices: [
      { model: 'iPhone 15 Pro Max', warrantyStatus: 'ACTIVE', year: '2023' },
      { model: 'iPhone 13 Mini', warrantyStatus: 'EXPIRED', year: '2021' },
      { model: 'Samsung S22 Ultra', warrantyStatus: 'PENDING', year: '2022' },
    ],
    recentActivity: [
      { title: 'Repair Completed', desc: 'Screen replaced on iPhone 15 Pro Max', time: '2 days ago' },
      { title: 'New Purchase', desc: 'Acquired iPhone 15 Pro Max (Titanium)', time: 'Oct 12, 2023' },
    ],
  },
  {
    id: 'VF-49035',
    name: 'Marcus Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 231-8842',
    email: 'marcus.chen@gmail.com',
    type: 'BUSINESS',
    devicesCount: 12,
    totalSpending: 48200.5,
    lastPurchaseDate: 'Nov 05, 2023',
    lastPurchaseItem: 'Galaxy Z Fold 5 (Bulk)',
    trustScore: 95,
    branch: 'Westside Branch • Corporate Client',
    devices: [
      { model: 'Galaxy Z Fold 5 (x10)', warrantyStatus: 'ACTIVE', year: '2023' },
      { model: 'Pixel 8 Pro (x2)', warrantyStatus: 'ACTIVE', year: '2023' },
    ],
    recentActivity: [
      { title: 'Bulk Purchase', desc: 'Acquired 10x Galaxy Z Fold 5', time: 'Nov 05, 2023' },
    ],
  },
  {
    id: 'VF-49089',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 123-4567',
    email: 'j.doe@outlook.com',
    type: 'NEW',
    devicesCount: 1,
    totalSpending: 899.0,
    lastPurchaseDate: 'Today',
    lastPurchaseItem: 'Pixel 8 Pro',
    trustScore: 88,
    branch: 'Downtown Flagship • Member',
    devices: [{ model: 'Pixel 8 Pro', warrantyStatus: 'ACTIVE', year: '2024' }],
    recentActivity: [{ title: 'First Purchase', desc: 'Bought Pixel 8 Pro', time: 'Today' }],
  },
  {
    id: 'VF-49102',
    name: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 772-1092',
    email: 's.jenkins@media.co',
    type: 'REGULAR',
    devicesCount: 4,
    totalSpending: 5240.25,
    lastPurchaseDate: 'Sep 28, 2023',
    lastPurchaseItem: 'Repair: Screen Replacement',
    trustScore: 92,
    branch: 'Eastside Mall • Regular Member',
    devices: [
      { model: 'iPhone 14 Pro', warrantyStatus: 'ACTIVE', year: '2022' },
      { model: 'iPad Air 5', warrantyStatus: 'EXPIRED', year: '2021' },
    ],
    recentActivity: [{ title: 'Screen Repair', desc: 'Replaced OLED Screen on iPhone 14 Pro', time: 'Sep 28, 2023' }],
  },
];

export default function CustomersManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(mockCustomers[0]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedTypeFilter === 'ALL' || c.type === selectedTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedTypeFilter]);

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Customer Directory</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Customers created automatically upon completed Checkout POS sales. View purchase history, warranties, and trust scores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export Customers
          </Button>
          <Link href="/dashboard/sales/new">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 font-bold"
            >
              New Sale Checkout
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">2,845</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">+5%</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New (Month)</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">142</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Returning</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">64%</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lifetime Rev</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">$1.4M</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Warranties</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">892</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Repairs</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">24</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Table & Selected Customer Profile Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 8 COLUMNS: CUSTOMER TABLE */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, phone, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'VIP', 'BUSINESS', 'REGULAR', 'NEW'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition shrink-0 ${
                      selectedTypeFilter === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Customer Name</th>
                    <th className="py-3 px-3">Contact Info</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-center">Devices</th>
                    <th className="py-3 px-3 text-right">Lifetime Spend</th>
                    <th className="py-3 px-3 text-right">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={cust.avatar}
                              alt={cust.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900">{cust.name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{cust.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-slate-800">{cust.phone}</p>
                          <p className="text-[10px] text-slate-400">{cust.email}</p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              cust.type === 'VIP'
                                ? 'bg-purple-100 text-purple-700'
                                : cust.type === 'BUSINESS'
                                ? 'bg-indigo-100 text-indigo-700'
                                : cust.type === 'NEW'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {cust.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-extrabold text-slate-900">
                          {cust.devicesCount}
                        </td>
                        <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                          ${cust.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <p className="font-bold text-slate-800">{cust.lastPurchaseDate}</p>
                          <p className="text-[10px] text-blue-600 truncate max-w-[120px]">{cust.lastPurchaseItem}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* RIGHT 4 COLUMNS: SELECTED CUSTOMER PROFILE DRAWER */}
        <div className="lg:col-span-4 space-y-4">
          {selectedCustomer ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5 text-xs font-sans animate-in fade-in duration-200 sticky top-20">
              
              {/* Profile Header */}
              <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                <div className="relative inline-block">
                  <img
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-md mx-auto"
                  />
                  <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow-subtle">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{selectedCustomer.branch}</p>
                </div>

                {/* Quick Action Triggers */}
                <div className="flex items-center gap-2 justify-center pt-1">
                  <Link href="/dashboard/sales/new">
                    <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 font-bold px-4">
                      + New Sale
                    </Button>
                  </Link>
                  <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Spend</p>
                  <p className="text-base font-extrabold text-blue-600 mt-0.5">
                    ${selectedCustomer.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Trust Score</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {selectedCustomer.trustScore}/100
                  </p>
                </div>
              </div>

              {/* Hardware / Devices Owned List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">
                    Phones Owned ({selectedCustomer.devices.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {selectedCustomer.devices.map((dev, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{dev.model}</p>
                          <p className={`text-[9px] font-extrabold ${
                            dev.warrantyStatus === 'ACTIVE'
                              ? 'text-emerald-600'
                              : dev.warrantyStatus === 'EXPIRED'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}>
                            {dev.warrantyStatus === 'ACTIVE' && 'Under Warranty'}
                            {dev.warrantyStatus === 'EXPIRED' && 'Warranty Expired'}
                            {dev.warrantyStatus === 'PENDING' && 'Trade-In Pending'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">
                  Recent Activity
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {selectedCustomer.recentActivity.map((act, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-bold text-slate-900">{act.title}</p>
                      <p className="text-[10px] text-slate-500">{act.desc}</p>
                      <p className="text-[9px] font-mono text-slate-400">{act.time}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-xs">
              Select a customer from the directory to view full profile details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
