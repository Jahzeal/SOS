'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Search,
  PlusCircle,
  Download,
  CheckCircle2,
  Package,
  DollarSign,
  User,
  Smartphone,
  ChevronRight,
  X,
  Zap,
  Activity,
  Calendar,
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function RepairsDashboardPage() {
  const [repairsList, setRepairsList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ticket Form State
  const [ticketCustomer, setTicketCustomer] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketDevice, setTicketDevice] = useState('');
  const [ticketIssue, setTicketIssue] = useState('');
  const [ticketEstCost, setTicketEstCost] = useState('');

  const fetchRepairsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRepairs({
        search: searchTerm.trim() || undefined,
        status: selectedStatusFilter !== 'ALL' ? selectedStatusFilter : undefined,
      });
      setRepairsList(data || []);
    } catch (err: any) {
      console.error('Failed to load repair tickets:', err);
      setError(err.message || 'Failed to load repair tickets.');
      setRepairsList([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatusFilter]);

  // Debounced search/filter trigger
  useEffect(() => {
    const t = setTimeout(() => fetchRepairsData(), 300);
    return () => clearTimeout(t);
  }, [fetchRepairsData]);

  // Status Change Handler
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    // Optimistic UI update
    setRepairsList((prev) =>
      prev.map((item) => (item.id === ticketId ? { ...item, status: newStatus } : item))
    );

    try {
      await api.updateRepairStatus(ticketId, newStatus);
    } catch (err: any) {
      console.error('Failed to update repair status:', err);
      alert(err.message || 'Failed to update repair status.');
      fetchRepairsData(); // Revert on failure
    }
  };

  // Counts for KPI Summary
  const stats = useMemo(() => {
    const total = repairsList.length;
    const diagnosing = repairsList.filter((r) => r.status === 'DIAGNOSING').length;
    const inProgress = repairsList.filter((r) => r.status === 'IN_PROGRESS').length;
    const readyOrCompleted = repairsList.filter((r) => r.status === 'READY_FOR_PICKUP' || r.status === 'COMPLETED').length;
    const totalRevenue = repairsList.reduce((sum, r) => sum + (r.finalCost || r.estimatedCost || 0), 0);

    return { total, diagnosing, inProgress, readyOrCompleted, totalRevenue };
  }, [repairsList]);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCustomer.trim() || !ticketDevice.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createRepairTicket({
        customerName: ticketCustomer.trim(),
        customerPhone: ticketPhone.trim() || undefined,
        deviceModel: ticketDevice.trim(),
        issueDescription: ticketIssue.trim() || 'Hardware Repair / Inspection',
        estimatedCost: parseFloat(ticketEstCost) || 0,
      });

      setShowNewTicketModal(false);
      setTicketCustomer('');
      setTicketPhone('');
      setTicketDevice('');
      setTicketIssue('');
      setTicketEstCost('');
      fetchRepairsData();
    } catch (err: any) {
      console.error('Failed to create repair ticket:', err);
      alert(err.message || 'Failed to create repair ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
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
            Track and update repair ticket statuses (Diagnosing, In Progress, Ready, Completed) with direct status selection.
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
            <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-extrabold text-blue-900 mt-0.5">{stats.inProgress}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Ready / Fixed</p>
            <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{stats.readyOrCompleted}</p>
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
              { id: 'DIAGNOSING', label: 'Diagnosing' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'WAITING_PARTS', label: 'Waiting Parts' },
              { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
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

        {/* DESKTOP & MOBILE TABLE VIEW */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-3">Ticket ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Issue Description</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Est. Cost</th>
                <th className="py-3 px-3 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading repair tickets...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </td>
                </tr>
              ) : repairsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Wrench className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No repair tickets found</p>
                      <p className="text-xs">Click "New Repair Ticket" above to register a customer device repair.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                repairsList.map((r) => {
                  const custName = r.customer?.name || 'Customer';
                  const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3 font-mono font-extrabold text-blue-600">{r.ticketNumber || r.id}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center border border-slate-200">
                            {getInitials(custName)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{custName}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{r.customer?.phone || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">{r.issueDescription}</p>
                            {r.phoneRecord && (
                              <p className="text-[10px] text-slate-400 font-mono">IMEI: {r.phoneRecord.imei1}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-3">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                            r.status === 'DIAGNOSING'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : r.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : r.status === 'WAITING_PARTS'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : r.status === 'READY_FOR_PICKUP'
                              ? 'bg-teal-50 text-teal-700 border-teal-300'
                              : r.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          <option value="DIAGNOSING">DIAGNOSING</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="WAITING_PARTS">WAITING_PARTS</option>
                          <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                        ${(r.finalCost || r.estimatedCost || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-600">
                        <div className="inline-flex items-center justify-end gap-1 text-slate-700 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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
                <label className="font-bold text-slate-700">Customer Phone</label>
                <input
                  type="text"
                  value={ticketPhone}
                  onChange={(e) => setTicketPhone(e.target.value)}
                  placeholder="e.g. +1 555-0192"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Device Model *</label>
                <input
                  type="text"
                  required
                  value={ticketDevice}
                  onChange={(e) => setTicketDevice(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reported Issue / Notes *</label>
                <input
                  type="text"
                  required
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  placeholder="e.g. Cracked screen replacement"
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
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 font-bold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </span>
                  ) : (
                    'Create Ticket & Assign Lab'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
