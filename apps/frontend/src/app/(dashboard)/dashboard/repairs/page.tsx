'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Search,
  PlusCircle,
  Download,
  Clock,
  AlertCircle,
  CheckCircle2,
  Package,
  DollarSign,
  User,
  Smartphone,
  ChevronRight,
  Filter,
  X,
  SlidersHorizontal,
  TrendingUp,
  RotateCcw,
  Zap,
  Activity,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export type RepairStatus = 'Diagnosing' | 'Fixing' | 'Fixed';

interface RepairTicket {
  id: string;
  customerName: string;
  customerInitials: string;
  deviceModel: string;
  deviceSpecs: string;
  status: RepairStatus;
  technicianName: string;
  estimatedCost: number;
  dropInDate: string;
}

const initialRepairs: RepairTicket[] = [
  {
    id: 'REP-9284',
    customerName: 'Sarah Connor',
    customerInitials: 'SC',
    deviceModel: 'iPhone 15 Pro',
    deviceSpecs: 'Apple • 512GB Blue',
    status: 'Fixing',
    technicianName: 'Dave Miller',
    estimatedCost: 349.0,
    dropInDate: 'Oct 24, 2023',
  },
  {
    id: 'REP-9285',
    customerName: 'Marcus Wright',
    customerInitials: 'MW',
    deviceModel: 'Galaxy S24 Ultra',
    deviceSpecs: 'Samsung • Titanium Gray',
    status: 'Diagnosing',
    technicianName: 'Jane Burke',
    estimatedCost: 189.5,
    dropInDate: 'Oct 25, 2023',
  },
  {
    id: 'REP-9271',
    customerName: 'Kyle Reese',
    customerInitials: 'KR',
    deviceModel: 'Pixel 8 Pro',
    deviceSpecs: 'Google • Porcelain',
    status: 'Fixed',
    technicianName: 'Alex Rivera',
    estimatedCost: 125.0,
    dropInDate: 'Oct 23, 2023',
  },
  {
    id: 'REP-9290',
    customerName: 'John Doe',
    customerInitials: 'JD',
    deviceModel: 'MacBook Air M3',
    deviceSpecs: 'Apple • Silver 16GB',
    status: 'Fixing',
    technicianName: 'Stan Marsh',
    estimatedCost: 1299.0,
    dropInDate: 'Oct 26, 2023',
  },
  {
    id: 'REP-9260',
    customerName: 'Annie Weaver',
    customerInitials: 'AW',
    deviceModel: 'iPad Pro 11"',
    deviceSpecs: 'Apple • Space Gray',
    status: 'Fixed',
    technicianName: 'Lisa Ray',
    estimatedCost: 210.0,
    dropInDate: 'Oct 22, 2023',
  },
];

export default function RepairsDashboardPage() {
  const [repairsList, setRepairsList] = useState<RepairTicket[]>(initialRepairs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form State
  const [ticketCustomer, setTicketCustomer] = useState('');
  const [ticketDevice, setTicketDevice] = useState('');
  const [ticketIssue, setTicketIssue] = useState('');
  const [ticketEstCost, setTicketEstCost] = useState('');

  // Status Change Handler
  const handleStatusChange = (ticketId: string, newStatus: RepairStatus) => {
    setRepairsList((prev) =>
      prev.map((item) => (item.id === ticketId ? { ...item, status: newStatus } : item))
    );
  };

  // Filtered Repairs
  const filteredRepairs = useMemo(() => {
    return repairsList.filter((r) => {
      const matchesSearch =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatusFilter === 'ALL' || r.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [repairsList, searchTerm, selectedStatusFilter]);

  // Counts for KPI Summary
  const stats = useMemo(() => {
    const total = repairsList.length;
    const diagnosing = repairsList.filter((r) => r.status === 'Diagnosing').length;
    const fixing = repairsList.filter((r) => r.status === 'Fixing').length;
    const fixed = repairsList.filter((r) => r.status === 'Fixed').length;
    const totalRevenue = repairsList.reduce((sum, r) => sum + r.estimatedCost, 0);

    return { total, diagnosing, fixing, fixed, totalRevenue };
  }, [repairsList]);

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCustomer || !ticketDevice) return;

    const newTicket: RepairTicket = {
      id: `REP-${Math.floor(9200 + Math.random() * 900)}`,
      customerName: ticketCustomer,
      customerInitials: ticketCustomer.split(' ').map((n) => n[0]).join('').toUpperCase() || 'CU',
      deviceModel: ticketDevice,
      deviceSpecs: ticketIssue || 'Hardware Inspection',
      status: 'Diagnosing',
      technicianName: 'Alex Rivera',
      estimatedCost: parseFloat(ticketEstCost) || 150.0,
      dropInDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setRepairsList((prev) => [newTicket, ...prev]);
    setShowNewTicketModal(false);
    setTicketCustomer('');
    setTicketDevice('');
    setTicketIssue('');
    setTicketEstCost('');
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Repair Tickets</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-blue-600" /> Repairs Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Track and update repair ticket statuses (Diagnosing, Fixing, Fixed) with direct status selection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export Repairs
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowNewTicketModal(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 font-bold"
          >
            New Repair Ticket
          </Button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Diagnosing</p>
            <p className="text-xl font-extrabold text-amber-900 mt-0.5">{stats.diagnosing}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Fixing</p>
            <p className="text-xl font-extrabold text-blue-900 mt-0.5">{stats.fixing}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Fixed</p>
            <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{stats.fixed}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Revenue</p>
            <p className="text-xl font-extrabold text-white mt-0.5">
              ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

      </div>

      {/* Main Repair Management Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Repair ID, Customer, Device..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0 mr-1">Filter:</span>
            {[
              { id: 'ALL', label: 'All Repairs' },
              { id: 'Diagnosing', label: 'Diagnosing' },
              { id: 'Fixing', label: 'Fixing' },
              { id: 'Fixed', label: 'Fixed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition shrink-0 ${
                  selectedStatusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE CARD VIEW (block md:hidden - Optimized for Mobile Touch) */}
        <div className="block md:hidden space-y-3">
          {filteredRepairs.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              
              {/* Header: ID, Customer, & Status Selector */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-subtle shrink-0">
                    {r.customerInitials}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs">{r.customerName}</p>
                    <p className="text-[10px] font-mono font-bold text-blue-600">{r.id}</p>
                  </div>
                </div>

                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as RepairStatus)}
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer focus:outline-none ${
                    r.status === 'Diagnosing'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : r.status === 'Fixing'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <option value="Diagnosing">Diagnosing</option>
                  <option value="Fixing">Fixing</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>

              {/* Device & Tech */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-slate-900 leading-tight">{r.deviceModel}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{r.deviceSpecs}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Tech</p>
                    <p className="font-extrabold text-slate-800 text-xs">{r.technicianName}</p>
                  </div>
                </div>
              </div>

              {/* Footer: Est Cost & Drop-in Date */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Cost:</span>
                  <span className="font-extrabold text-slate-900">${r.estimatedCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{r.dropInDate}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block - Enterprise Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-3">Repair ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Device / Model</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3 text-right">Est. Cost</th>
                <th className="py-3 px-3 text-right">Drop-in Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRepairs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-3 font-mono font-extrabold text-blue-600">{r.id}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200">
                        {r.customerInitials}
                      </div>
                      <span>{r.customerName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="font-extrabold text-slate-900">{r.deviceModel}</p>
                        <p className="text-[10px] text-slate-400">{r.deviceSpecs}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-3">
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value as RepairStatus)}
                      className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                        r.status === 'Diagnosing'
                          ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-2 focus:ring-amber-500'
                          : r.status === 'Fixing'
                          ? 'bg-blue-50 text-blue-700 border-blue-300 focus:ring-2 focus:ring-blue-500'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    >
                      <option value="Diagnosing">Diagnosing</option>
                      <option value="Fixing">Fixing</option>
                      <option value="Fixed">Fixed</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800">{r.technicianName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                    ${r.estimatedCost.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-slate-600">
                    <div className="inline-flex items-center justify-end gap-1 text-slate-700 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{r.dropInDate}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Low Stock Parts Alerts Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-rose-600" /> Low Stock Replacement Parts Alert
          </h3>
          <span className="text-[10px] text-rose-600 font-extrabold uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Reorder Required</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">iPhone 15 Pro Replacement Batteries</p>
                <p className="text-[10px] text-rose-700 font-extrabold">2 UNITS REMAINING</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="text-[11px] font-bold">
              Reorder
            </Button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs">S24 Ultra OLED Screen Assemblies</p>
                <p className="text-[10px] text-slate-500 font-bold">4 UNITS REMAINING</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="text-[11px] font-bold">
              Reorder
            </Button>
          </div>
        </div>
      </div>

      {/* New Repair Ticket Creation Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" /> New Repair Ticket
              </h3>
              <button onClick={() => setShowNewTicketModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={ticketCustomer}
                  onChange={(e) => setTicketCustomer(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Device Model & IMEI *</label>
                <input
                  type="text"
                  required
                  value={ticketDevice}
                  onChange={(e) => setTicketDevice(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro (IMEI: 3582...)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reported Issue / Notes</label>
                <input
                  type="text"
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  placeholder="e.g. Cracked screen, battery drain"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Estimated Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ticketEstCost}
                  onChange={(e) => setTicketEstCost(e.target.value)}
                  placeholder="150.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3">
                <Button type="submit" variant="primary" fullWidth size="lg" className="bg-blue-600 hover:bg-blue-500 font-bold">
                  Create Ticket & Assign Lab
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
