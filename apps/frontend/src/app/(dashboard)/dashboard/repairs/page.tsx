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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface RepairTicket {
  id: string;
  customerName: string;
  customerInitials: string;
  deviceModel: string;
  deviceSpecs: string;
  status: 'DIAGNOSING' | 'PARTS_WAIT' | 'READY' | 'COMPLETED';
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  technicianName: string;
  technicianAvatar: string;
  estimatedCost: number;
  date: string;
}

const mockRepairs: RepairTicket[] = [
  {
    id: 'REP-9284',
    customerName: 'Sarah Connor',
    customerInitials: 'SC',
    deviceModel: 'iPhone 15 Pro',
    deviceSpecs: 'Apple • 512GB Blue',
    status: 'PARTS_WAIT',
    priority: 'HIGH',
    technicianName: 'Dave Miller',
    technicianAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    estimatedCost: 349.0,
    date: 'Oct 24, 2023',
  },
  {
    id: 'REP-9285',
    customerName: 'Marcus Wright',
    customerInitials: 'MW',
    deviceModel: 'Galaxy S24 Ultra',
    deviceSpecs: 'Samsung • Titanium Gray',
    status: 'DIAGNOSING',
    priority: 'MEDIUM',
    technicianName: 'Jane Burke',
    technicianAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    estimatedCost: 189.5,
    date: 'Oct 25, 2023',
  },
  {
    id: 'REP-9271',
    customerName: 'Kyle Reese',
    customerInitials: 'KR',
    deviceModel: 'Pixel 8 Pro',
    deviceSpecs: 'Google • Porcelain',
    status: 'READY',
    priority: 'NORMAL',
    technicianName: 'Alex Rivera',
    technicianAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    estimatedCost: 125.0,
    date: 'Oct 23, 2023',
  },
  {
    id: 'REP-9290',
    customerName: 'John Doe',
    customerInitials: 'JD',
    deviceModel: 'MacBook Air M3',
    deviceSpecs: 'Apple • Silver 16GB',
    status: 'PARTS_WAIT',
    priority: 'HIGH',
    technicianName: 'Stan Marsh',
    technicianAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    estimatedCost: 1299.0,
    date: 'Oct 26, 2023',
  },
  {
    id: 'REP-9260',
    customerName: 'Annie Weaver',
    customerInitials: 'AW',
    deviceModel: 'iPad Pro 11"',
    deviceSpecs: 'Apple • Space Gray',
    status: 'COMPLETED',
    priority: 'NORMAL',
    technicianName: 'Lisa Ray',
    technicianAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    estimatedCost: 210.0,
    date: 'Oct 22, 2023',
  },
];

export default function RepairsDashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form State
  const [ticketCustomer, setTicketCustomer] = useState('');
  const [ticketDevice, setTicketDevice] = useState('');
  const [ticketIssue, setTicketIssue] = useState('');
  const [ticketEstCost, setTicketEstCost] = useState('');

  // Filtered Repairs
  const filteredRepairs = useMemo(() => {
    return mockRepairs.filter((r) => {
      const matchesSearch =
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatusFilter === 'ALL' || r.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, selectedStatusFilter]);

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCustomer || !ticketDevice) return;

    const newTicket: RepairTicket = {
      id: `REP-${Math.floor(9200 + Math.random() * 900)}`,
      customerName: ticketCustomer,
      customerInitials: ticketCustomer.split(' ').map((n) => n[0]).join('').toUpperCase() || 'CU',
      deviceModel: ticketDevice,
      deviceSpecs: ticketIssue || 'Hardware Inspection',
      status: 'DIAGNOSING',
      priority: 'MEDIUM',
      technicianName: 'Alex Rivera',
      technicianAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      estimatedCost: parseFloat(ticketEstCost) || 150.0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    mockRepairs.unshift(newTicket);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Repairs Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Track repair tickets, hardware inspection status, replacement parts inventory, and customer updates.
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

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Repairs</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">42</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Diagnosing</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">12</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">ALERT</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Waiting Parts</p>
            <p className="text-xl font-extrabold text-rose-900 mt-0.5">8</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ready Pickup</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">15</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Today</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">24</p>
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
            <p className="text-xl font-extrabold text-white mt-0.5">$8,450.00</p>
          </div>
        </div>

      </div>

      {/* Main Repair Table Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Repair ID, Customer, Device..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Filter:</span>
            {[
              { id: 'ALL', label: 'All Repairs' },
              { id: 'DIAGNOSING', label: 'Diagnosing' },
              { id: 'PARTS_WAIT', label: 'Parts Delay' },
              { id: 'READY', label: 'Ready for Pickup' },
              { id: 'COMPLETED', label: 'Completed' },
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

        {/* Repair Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-3">Repair ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Device / Model</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3">Technician</th>
                <th className="py-3 px-3 text-right">Est. Cost</th>
                <th className="py-3 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRepairs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition cursor-pointer">
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
                    <p className="font-extrabold text-slate-900">{r.deviceModel}</p>
                    <p className="text-[10px] text-slate-400">{r.deviceSpecs}</p>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                        r.status === 'PARTS_WAIT'
                          ? 'bg-rose-100 text-rose-700'
                          : r.status === 'DIAGNOSING'
                          ? 'bg-blue-100 text-blue-700'
                          : r.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.status === 'PARTS_WAIT' && 'Waiting for Parts'}
                      {r.status === 'DIAGNOSING' && 'Diagnosing'}
                      {r.status === 'READY' && 'Ready for Pickup'}
                      {r.status === 'COMPLETED' && 'Completed'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`w-2.5 h-2.5 rounded-full inline-block ${
                        r.priority === 'HIGH'
                          ? 'bg-rose-500 animate-pulse ring-4 ring-rose-100'
                          : r.priority === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={r.technicianAvatar}
                        alt={r.technicianName}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                      <span className="font-bold text-slate-800">{r.technicianName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                    ${r.estimatedCost.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-slate-500">{r.date}</td>
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
