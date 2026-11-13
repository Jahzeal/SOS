'use client';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/DataTable';
import { TextInput } from '@/components/ui/Input';


import { notify, confirmDialog } from '@/lib/feedback';
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
      notify(err.message || 'Failed to update repair status.');
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
      notify(err.message || 'Failed to create repair ticket. Please try again.');
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
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 sm:w-7 sm:h-7 text-accent-600 shrink-0" /> Repairs Dashboard
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
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
            className="bg-accent-600 hover:bg-accent-500 shadow-md shadow-accent-600/20 font-bold"
          >
            New Repair Ticket
          </Button>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-warning-50/60 border border-warning-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-warning-100 text-warning-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-warning-800 uppercase tracking-wider">Diagnosing</p>
            <p className="text-xl font-extrabold text-warning-900 mt-0.5">{stats.diagnosing}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-accent-50/60 border border-accent-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-accent-800 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-extrabold text-accent-900 mt-0.5">{stats.inProgress}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-success-50/60 border border-success-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-success-100 text-success-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-success-800 uppercase tracking-wider">Ready / Fixed</p>
            <p className="text-xl font-extrabold text-success-900 mt-0.5">{stats.readyOrCompleted}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Revenue</p>
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
            <input aria-label="Search Repair ID, Customer, Device"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Repair ID, Customer, Device..."
              className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed pl-9 pr-3"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <span className="text-slate-400 font-bold uppercase text-xs shrink-0 mr-1">Filter:</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 ${
                  selectedStatusFilter === f.id
                    ? 'bg-accent-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* MOBILE REPAIR CARDS VIEW */}
        <div className="block sm:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading repair tickets...
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-danger-500 font-semibold text-xs">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            </div>
          ) : repairsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs animate-in fade-in duration-200">
              <Wrench className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No repair tickets found</p>
              <p>Register a customer device repair to track ticket status.</p>
            </div>
          ) : (
            repairsList.map((r) => {
              const custName = r.customer?.name || 'Customer';
              const dateStr = new Date(r.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                        {getInitials(custName)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{custName}</h4>
                        <p className="text-xs text-slate-400 font-mono font-bold text-accent-600">{r.ticketNumber || r.id}</p>
                      </div>
                    </div>
                    
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                      className={`text-xs font-extrabold px-2 py-1 rounded-lg border transition-all cursor-pointer focus:outline-none shrink-0 ${
                        r.status === 'DIAGNOSING'
                          ? 'bg-warning-50 text-warning-700 border-warning-300'
                          : r.status === 'IN_PROGRESS'
                          ? 'bg-accent-50 text-accent-700 border-accent-300'
                          : r.status === 'WAITING_PARTS'
                          ? 'bg-purple-50 text-purple-700 border-purple-300'
                          : r.status === 'READY_FOR_PICKUP'
                          ? 'bg-accent-50 text-accent-700 border-accent-300'
                          : r.status === 'COMPLETED'
                          ? 'bg-success-50 text-success-700 border-success-300'
                          : 'bg-danger-50 text-danger-700 border-danger-300'
                      }`}
                    >
                      <option value="DIAGNOSING">DIAGNOSING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="WAITING_PARTS">WAITING_PARTS</option>
                      <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                      <Smartphone className="w-3.5 h-3.5 text-accent-600 shrink-0" />
                      <span>{r.issueDescription}</span>
                    </div>
                    {r.phoneRecord && (
                      <p className="text-xs text-slate-400 font-mono pl-5">IMEI: {r.phoneRecord.imei1}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase block">Created</span>
                      <span className="font-bold text-slate-800 text-xs">{dateStr}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold uppercase block">Est. Cost</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        ₦{(r.finalCost || r.estimatedCost || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <THead>
              <tr>
                <Th>Ticket ID</Th>
                <Th>Customer</Th>
                <Th>Issue Description</Th>
                <Th>Status</Th>
                <Th align="right">Est. Cost</Th>
                <Th align="right">Created Date</Th>
              </tr>
            </THead>
            <TBody>
              {loading ? (
                <tr>
                  <Td align="center" colSpan={6}>
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading repair tickets...
                    </div>
                  </Td>
                </tr>
              ) : error ? (
                <tr>
                  <Td align="center" colSpan={6}>
                    <div className="flex items-center justify-center gap-2 text-danger-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </Td>
                </tr>
              ) : repairsList.length === 0 ? (
                <tr>
                  <Td align="center" colSpan={6}>
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Wrench className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No repair tickets found</p>
                      <p className="text-xs">Click "New Repair Ticket" above to register a customer device repair.</p>
                    </div>
                  </Td>
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
                    <Tr key={r.id}>
                      <Td className="font-mono font-extrabold text-accent-600">{r.ticketNumber || r.id}</Td>
                      <Td className="font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {getInitials(custName)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{custName}</p>
                            <p className="text-xs text-slate-400 font-normal">{r.customer?.phone || ''}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-accent-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900">{r.issueDescription}</p>
                            {r.phoneRecord && (
                              <p className="text-xs text-slate-400 font-mono">IMEI: {r.phoneRecord.imei1}</p>
                            )}
                          </div>
                        </div>
                      </Td>

                      {/* Status Dropdown */}
                      <Td>
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer focus:outline-none ${
                            r.status === 'DIAGNOSING'
                              ? 'bg-warning-50 text-warning-700 border-warning-300'
                              : r.status === 'IN_PROGRESS'
                              ? 'bg-accent-50 text-accent-700 border-accent-300'
                              : r.status === 'WAITING_PARTS'
                              ? 'bg-purple-50 text-purple-700 border-purple-300'
                              : r.status === 'READY_FOR_PICKUP'
                              ? 'bg-accent-50 text-accent-700 border-accent-300'
                              : r.status === 'COMPLETED'
                              ? 'bg-success-50 text-success-700 border-success-300'
                              : 'bg-danger-50 text-danger-700 border-danger-300'
                          }`}
                        >
                          <option value="DIAGNOSING">DIAGNOSING</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="WAITING_PARTS">WAITING_PARTS</option>
                          <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </Td>

                      <Td align="right" className="font-extrabold text-slate-900">
                        ₦{(r.finalCost || r.estimatedCost || 0).toLocaleString()}
                      </Td>
                      <Td align="right" className="font-semibold text-slate-600">
                        <div className="inline-flex items-center justify-end gap-1 text-slate-700 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </TBody>
          </Table>
        </div>

      </div>



      {/* New Repair Ticket Creation Modal */}
      {showNewTicketModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-accent-600" /> New Repair Ticket
              </h3>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setShowNewTicketModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <TextInput label="Customer Name"
                  type="text"
                  required
                  value={ticketCustomer}
                  onChange={(e) => setTicketCustomer(e.target.value)}
                  placeholder="e.g. Aisha Bello" />
              </div>

              <div className="space-y-1">
                <TextInput label="Customer Phone"
                  type="text"
                  value={ticketPhone}
                  onChange={(e) => setTicketPhone(e.target.value)}
                  placeholder="e.g. +1 555-0192" />
              </div>

              <div className="space-y-1">
                <TextInput label="Device Model"
                  type="text"
                  required
                  value={ticketDevice}
                  onChange={(e) => setTicketDevice(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro" />
              </div>

              <div className="space-y-1">
                <TextInput label="Reported Issue / Notes"
                  type="text"
                  required
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  placeholder="e.g. Cracked screen replacement" />
              </div>

              <div className="space-y-1">
                <TextInput label="Estimated Cost ($)"
                  type="number"
                  step="0.01"
                  value={ticketEstCost}
                  onChange={(e) => setTicketEstCost(e.target.value)}
                  placeholder="150.00" />
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-accent-600 hover:bg-accent-500 font-bold"
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
