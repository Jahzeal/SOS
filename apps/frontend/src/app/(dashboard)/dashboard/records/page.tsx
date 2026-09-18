'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Search,
  Download,
  Plus,
  TrendingUp,
  Package,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Eye,
  ShoppingCart,
  Copy,
  SlidersHorizontal,
  Loader2,
  ShieldAlert,
  Lock,
  Unlock,
  X,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { usePhoneRecords, useInventorySummary, QUERY_KEYS } from '@/hooks/useDashboardQueries';

export default function PhoneRecordsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  // Stolen Modal State
  const [stolenModalRecord, setStolenModalRecord] = useState<any | null>(null);
  const [theftReason, setTheftReason] = useState('Store Break-in / Looted');
  const [lostNote, setLostNote] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [policeCaseNo, setPoliceCaseNo] = useState('');
  const [isSubmittingTheft, setIsSubmittingTheft] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Cached records query (instant 0ms switch)
  const {
    data: records = [],
    isLoading: loading,
    error: queryError,
  } = usePhoneRecords({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    brand: brandFilter !== 'ALL' ? brandFilter : undefined,
  });

  // Cached summary query
  const { data: summaryData } = useInventorySummary();
  const stats = summaryData?.kpis || null;
  const error = queryError ? (queryError as any).message || 'Failed to load records.' : null;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? records.map((r) => r.id) : []);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedImei(text);
    setTimeout(() => setCopiedImei(null), 1500);
  };

  const isWarrantyActive = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) > new Date();
  };

  const formatWarranty = (expiryDate: string | null) => {
    if (!expiryDate) return 'No Warranty';
    const exp = new Date(expiryDate);
    if (exp <= new Date()) return 'Expired';
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `Active (${daysLeft} Days)`;
  };

  const handleFlagStolenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stolenModalRecord) return;
    setIsSubmittingTheft(true);
    setActionError(null);
    try {
      await api.flagPhoneStolen(stolenModalRecord.id, {
        theftReason,
        lostNote,
        contactPhone,
        policeCaseNo,
      });
      setActionSuccess(`Device (${stolenModalRecord.imei1}) has been flagged as STOLEN across the global registry.`);
      setStolenModalRecord(null);
      setTheftReason('Store Break-in / Looted');
      setLostNote('');
      setContactPhone('');
      setPoliceCaseNo('');
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      setActionError(err.message || 'Failed to flag device as stolen.');
    } finally {
      setIsSubmittingTheft(false);
    }
  };

  const handleClearStolen = async (rec: any) => {
    if (!confirm(`Are you sure you want to CLEAR the stolen flag for ${rec.brand} ${rec.model} (${rec.imei1})?`)) return;
    try {
      await api.clearPhoneStolen(rec.id);
      setActionSuccess(`Stolen flag cleared for IMEI ${rec.imei1}. Status restored to Clean.`);
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      alert(err.message || 'Failed to clear stolen flag.');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Phone Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Search, monitor, and manage every registered phone in your business ecosystem with real-time anti-theft and carrier status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/report-stolen">
            <Button variant="secondary" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50" leftIcon={<ShieldAlert className="w-4 h-4" />}>
              Public Theft Registry
            </Button>
          </Link>
          <Link href="/dashboard/register">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Register Phone
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Success / Alert Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.totalRegistered ?? records.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Stock</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.inStockCount ?? '—'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Under Warranty</p>
            <p className="text-xl font-extrabold text-slate-900">{stats?.activeWarrantiesCount ?? '—'}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stolen / Blacklisted</p>
            <p className="text-xl font-extrabold text-rose-600">{records.filter((r) => r.isStolen || r.theftStatus === 'STOLEN').length}</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search IMEI, Serial, Brand, Model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="SOLD">Sold</option>
              <option value="IN_REPAIR">In Repair</option>
              <option value="RESERVED">Reserved</option>
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="ALL">All Brands</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              <option value="Tecno">Tecno</option>
              <option value="Infinix">Infinix</option>
              <option value="Xiaomi">Xiaomi</option>
            </select>
          </div>
        </div>

        {/* Mobile List View */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading records...
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold text-xs">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Smartphone className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No records found</p>
              <p>Try adjusting your filters or register a new phone.</p>
            </div>
          ) : (
            records.map((rec) => {
              const warrantyActive = isWarrantyActive(rec.warrantyExpiryDate);
              const isStolen = rec.isStolen || rec.theftStatus === 'STOLEN';
              return (
                <div key={rec.id} className={`p-4 space-y-3 ${isStolen ? 'bg-rose-50/40 border-l-4 border-rose-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isStolen ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 border border-blue-100 text-blue-600'}`}>
                        {isStolen ? <ShieldAlert className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {rec.model}
                          {isStolen && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider">
                              STOLEN
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">{rec.brand} • {rec.condition}</p>
                      </div>
                    </div>
                    <div>
                      {rec.status === 'IN_STOCK' && <Badge variant="verified" size="sm">IN STOCK</Badge>}
                      {rec.status === 'SOLD' && <Badge variant="sold" size="sm">SOLD</Badge>}
                      {rec.status === 'IN_REPAIR' && <Badge variant="business" size="sm">REPAIR</Badge>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {rec.storageCapacity && (
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[9px] text-slate-600">
                        {rec.storageCapacity}
                      </span>
                    )}
                    {rec.color && (
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[9px] text-slate-600">
                        {rec.color}
                      </span>
                    )}
                    {rec.carrierStatus && (
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${rec.carrierStatus === 'UNLOCKED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {rec.carrierStatus === 'UNLOCKED' ? 'UNLOCKED' : `LOCKED (${rec.lockedCarrier || 'CARRIER'})`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">IMEI / SN</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-[11px] whitespace-nowrap">
                        <span>{rec.imei1}</span>
                        <button onClick={() => handleCopy(rec.imei1)} title="Copy IMEI" className="text-slate-400 hover:text-slate-600">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Price</span>
                      <span className="font-extrabold text-slate-900 text-[13px]">
                        {rec.sellingPrice != null ? `₦${rec.sellingPrice.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {isStolen ? (
                        <button
                          onClick={() => handleClearStolen(rec)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
                        >
                          Clear Stolen Flag
                        </button>
                      ) : (
                        <button
                          onClick={() => setStolenModalRecord(rec)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" /> Flag Stolen
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/records/${rec.id}`}>
                        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 font-bold text-[11px] flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === records.length && records.length > 0}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-4">Device Info</th>
                <th className="py-3 px-4">Identifiers</th>
                <th className="py-3 px-4">Carrier & Activation</th>
                <th className="py-3 px-4">Theft Status</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Smartphone className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No records found</p>
                      <p className="text-xs">Try adjusting your filters or register a new phone.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const warrantyActive = isWarrantyActive(rec.warrantyExpiryDate);
                  const isStolen = rec.isStolen || rec.theftStatus === 'STOLEN';
                  return (
                    <tr key={rec.id} className={`hover:bg-slate-50/80 transition group ${isStolen ? 'bg-rose-50/30' : ''}`}>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rec.id)}
                          onChange={() => handleToggleSelect(rec.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isStolen ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 border border-blue-200/80 text-blue-600'}`}>
                            {isStolen ? <ShieldAlert className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{rec.model}</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {rec.brand} {rec.color ? `• ${rec.color}` : ''} {rec.storageCapacity ? `• ${rec.storageCapacity}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span>IMEI: {rec.imei1}</span>
                          <button onClick={() => handleCopy(rec.imei1)} title="Copy IMEI" className="text-slate-400 hover:text-slate-600 ml-1">
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedImei === rec.imei1 && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                        {rec.serialNumber && (
                          <p className="font-mono text-slate-500 text-[10px] font-medium">SN: {rec.serialNumber}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] w-fit ${rec.carrierStatus === 'CARRIER_LOCKED' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                            {rec.carrierStatus === 'CARRIER_LOCKED' ? (
                              <><Lock className="w-2.5 h-2.5" /> Locked ({rec.lockedCarrier || 'Carrier'})</>
                            ) : (
                              <><Unlock className="w-2.5 h-2.5" /> Factory Unlocked</>
                            )}
                          </span>
                          {rec.activationStatus && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Activation: <strong>{rec.activationStatus.replace(/_/g, ' ')}</strong>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isStolen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[10px] border border-rose-300 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-rose-600" /> STOLEN / BLACKLISTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Clean
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {rec.status === 'IN_STOCK' && <Badge variant="verified" size="sm">IN STOCK</Badge>}
                        {rec.status === 'SOLD' && <Badge variant="sold" size="sm">SOLD</Badge>}
                        {rec.status === 'IN_REPAIR' && <Badge variant="business" size="sm">REPAIR</Badge>}
                        {rec.status === 'RESERVED' && <Badge variant="starter" size="sm">RESERVED</Badge>}
                        {rec.status === 'DISPOSED' && <Badge variant="sold" size="sm">DISPOSED</Badge>}
                        {rec.status === 'RETURNED' && <Badge variant="starter" size="sm">RETURNED</Badge>}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-right">
                        {rec.sellingPrice != null ? `₦${rec.sellingPrice.toLocaleString()}` : (rec.purchasePrice != null ? `₦${rec.purchasePrice.toLocaleString()}` : '—')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isStolen ? (
                            <button
                              onClick={() => handleClearStolen(rec)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition font-bold text-[10px]"
                              title="Clear Stolen Status"
                            >
                              Clear Flag
                            </button>
                          ) : (
                            <button
                              onClick={() => setStolenModalRecord(rec)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Flag as Stolen / Looted"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
                          <Link href={`/dashboard/records/${rec.id}`}>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/checkout?device=${rec.id}`}>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Quick Sell">
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-900">{records.length}</strong> of <strong className="text-slate-900">{stats?.totalRegistered ?? '—'}</strong> records
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
              Next Page
            </Button>
          </div>
        </div>
      </div>

      {/* Flag as Stolen Modal */}
      {stolenModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-rose-50/80 border-b border-rose-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Flag Device as Stolen / Looted</h3>
                  <p className="text-xs text-rose-700 font-medium mt-0.5">
                    {stolenModalRecord.brand} {stolenModalRecord.model} • IMEI: {stolenModalRecord.imei1}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStolenModalRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFlagStolenSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Theft Report</label>
                <select
                  value={theftReason}
                  onChange={(e) => setTheftReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                >
                  <option value="Store Break-in / Looted">Store Break-in / Looted</option>
                  <option value="In-Transit Cargo Loss">In-Transit Cargo Loss</option>
                  <option value="Customer Payment Default / Fraud">Customer Payment Default / Fraud</option>
                  <option value="Armed Robbery / Snatching">Armed Robbery / Snatching</option>
                  <option value="Other Unlawful Loss">Other Unlawful Loss</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Public Lost Note / Reward Message
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. This phone was looted from our store. Cash reward available for return. Call 080..."
                  value={lostNote}
                  onChange={(e) => setLostNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">This message will be visible to any buyer or shop scanning this IMEI.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recovery Phone #</label>
                  <input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Police Case # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. CR-9082/2026"
                    value={policeCaseNo}
                    onChange={(e) => setPoliceCaseNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setStolenModalRecord(null)}
                  disabled={isSubmittingTheft}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSubmittingTheft}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSubmittingTheft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  Confirm & Blacklist Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
