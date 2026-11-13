'use client';


import { notify, confirmDialog } from '@/lib/feedback';
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
  RotateCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select, Textarea, TextInput } from '@/components/ui/Input';
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
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
    if (!await confirmDialog(`Are you sure you want to CLEAR the stolen flag for ${rec.brand} ${rec.model} (${rec.imei1})?`)) return;
    try {
      await api.clearPhoneStolen(rec.id);
      setActionSuccess(`Stolen flag cleared for IMEI ${rec.imei1}. Status restored to Clean.`);
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (err: any) {
      notify(err.message || 'Failed to clear stolen flag.');
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

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['records'] });
              queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            }}
            title="Refresh Records"
            aria-label="Refresh Records"
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/report-stolen">
            <Button variant="dangerOutline" size="sm" className="whitespace-nowrap" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
              Public Theft Registry
            </Button>
          </Link>
          <Link href="/dashboard/register">
            <Button variant="primary" size="sm" className="whitespace-nowrap" leftIcon={<Plus className="w-4 h-4" />}>
              <span className="hidden sm:inline">Register Phone / Item</span>
              <span className="inline sm:hidden">Register Item</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Success / Alert Banner */}
      {actionSuccess && (
        <div role="status" className="p-3.5 rounded-control bg-success-50 border border-success-200 text-success-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} aria-label="Dismiss message" className="text-success-600 hover:text-success-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
            {loading && records.length === 0 ? (
              <div className="h-6 w-14 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900">{stats?.totalRegistered ?? records.length}</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center text-success-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Stock</p>
            {loading && records.length === 0 ? (
              <div className="h-6 w-14 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900">{stats?.inStockCount ?? '—'}</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Under Warranty</p>
            {loading && records.length === 0 ? (
              <div className="h-6 w-14 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900">{stats?.activeWarrantiesCount ?? '—'}</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-danger-50 border border-danger-100 flex items-center justify-center text-danger-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stolen / Blacklisted</p>
            {loading && records.length === 0 ? (
              <div className="h-6 w-14 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-danger-600">{records.filter((r) => r.isStolen || r.theftStatus === 'STOLEN').length}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-card border border-slate-200 shadow-subtle overflow-hidden">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40">
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search IMEI, Serial, Brand, Model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              shortcutHint=""
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none sm:w-40">
              <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="SOLD">Sold</option>
                <option value="IN_REPAIR">In Repair</option>
                <option value="RESERVED">Reserved</option>
              </Select>
            </div>

            <div className="flex-1 sm:flex-none sm:w-36">
              <Select aria-label="Filter by brand" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                <option value="ALL">All Brands</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Google">Google</option>
                <option value="Tecno">Tecno</option>
                <option value="Infinix">Infinix</option>
                <option value="Xiaomi">Xiaomi</option>
              </Select>
            </div>
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
              <div className="flex items-center justify-center gap-2 text-danger-500 font-semibold text-xs">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<Smartphone className="w-8 h-8" />}
              title="No records found"
              description="Try adjusting your filters or register a new phone."
            />
          ) : (
            records.map((rec) => {
              const warrantyActive = isWarrantyActive(rec.warrantyExpiryDate);
              const isStolen = rec.isStolen || rec.theftStatus === 'STOLEN';
              return (
                <div key={rec.id} className={`p-4 space-y-3 ${isStolen ? 'bg-danger-50/40 border-l-4 border-danger-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isStolen ? 'bg-danger-100 text-danger-600' : 'bg-accent-50 border border-accent-100 text-accent-600'}`}>
                        {isStolen ? <ShieldAlert className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {rec.model}
                          {isStolen && (
                            <span className="px-1.5 py-0.5 rounded bg-danger-600 text-white font-extrabold text-xs uppercase tracking-wider">
                              STOLEN
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{rec.brand} • {rec.condition}</p>
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
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-xs text-slate-600">
                        {rec.storageCapacity}
                      </span>
                    )}
                    {rec.color && (
                      <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-xs text-slate-600">
                        {rec.color}
                      </span>
                    )}
                    {rec.carrierStatus && (
                      <span className={`px-1.5 py-0.5 rounded font-bold text-xs ${rec.carrierStatus === 'UNLOCKED' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-warning-50 text-warning-700 border border-warning-200'}`}>
                        {rec.carrierStatus === 'UNLOCKED' ? 'UNLOCKED' : `LOCKED (${rec.lockedCarrier || 'CARRIER'})`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase block">IMEI / SN</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                        <span>{rec.imei1}</span>
                        <button type="button" onClick={() => handleCopy(rec.imei1)} title="Copy IMEI" aria-label="Copy IMEI" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-bold uppercase block">Price</span>
                      <span className="font-extrabold text-slate-900 text-[13px]">
                        {rec.sellingPrice != null ? `₦${rec.sellingPrice.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      {isStolen ? (
                        <Button variant="secondary" size="sm" onClick={() => handleClearStolen(rec)}>
                          Clear Stolen Flag
                        </Button>
                      ) : (
                        <Button
                          variant="dangerOutline"
                          size="sm"
                          onClick={() => setStolenModalRecord(rec)}
                          leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                        >
                          Flag Stolen
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/records/${rec.id}`}>
                        <Button variant="secondary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <TableWrap className="hidden sm:block">
          <Table className="sm:text-xs">
            <THead>
              <tr>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === records.length && records.length > 0}
                    aria-label="Select all records"
                    className="rounded border-slate-300 accent-accent-600"
                  />
                </Th>
                <Th>Device Info</Th>
                <Th>Identifiers</Th>
                <Th>Carrier & Activation</Th>
                <Th>Theft Status</Th>
                <Th align="center">Status</Th>
                <Th align="right">Price</Th>
                <Th align="right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {loading ? (
                <tr>
                  <Td colSpan={8} align="center" className="py-16">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading records...
                    </div>
                  </Td>
                </tr>
              ) : error ? (
                <tr>
                  <Td colSpan={8} align="center" className="py-16">
                    <div className="flex items-center justify-center gap-2 text-danger-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </Td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <Td colSpan={8} align="center" className="py-16">
                    <EmptyState
                      icon={<Smartphone className="w-8 h-8" />}
                      title="No records found"
                      description="Try adjusting your filters or register a new phone."
                    />
                  </Td>
                </tr>
              ) : (
                records.map((rec) => {
                  const warrantyActive = isWarrantyActive(rec.warrantyExpiryDate);
                  const isStolen = rec.isStolen || rec.theftStatus === 'STOLEN';
                  return (
                    <Tr key={rec.id} className={`group ${isStolen ? 'bg-danger-50/30' : ''}`}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rec.id)}
                          onChange={() => handleToggleSelect(rec.id)}
                          aria-label={`Select ${rec.model}`}
                          className="rounded border-slate-300 accent-accent-600"
                        />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isStolen ? 'bg-danger-100 text-danger-600' : 'bg-accent-50 border border-accent-200/80 text-accent-600'}`}>
                            {isStolen ? <ShieldAlert className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{rec.model}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {rec.brand} {rec.color ? `• ${rec.color}` : ''} {rec.storageCapacity ? `• ${rec.storageCapacity}` : ''}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span>IMEI: {rec.imei1}</span>
                          <button type="button" onClick={() => handleCopy(rec.imei1)} title="Copy IMEI" aria-label="Copy IMEI" className="text-slate-400 hover:text-slate-600 ml-1 cursor-pointer">
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedImei === rec.imei1 && (
                            <span className="text-xs text-success-600 font-bold">Copied!</span>
                          )}
                        </div>
                        {rec.serialNumber && (
                          <p className="font-mono text-slate-500 text-xs font-medium">SN: {rec.serialNumber}</p>
                        )}
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-xs w-fit ${rec.carrierStatus === 'CARRIER_LOCKED' ? 'bg-warning-50 text-warning-800 border border-warning-200' : 'bg-success-50 text-success-800 border border-success-200'}`}>
                            {rec.carrierStatus === 'CARRIER_LOCKED' ? (
                              <><Lock className="w-2.5 h-2.5" /> Locked ({rec.lockedCarrier || 'Carrier'})</>
                            ) : (
                              <><Unlock className="w-2.5 h-2.5" /> Factory Unlocked</>
                            )}
                          </span>
                          {rec.activationStatus && (
                            <span className="text-xs text-slate-500 font-medium">
                              Activation: <strong>{rec.activationStatus.replace(/_/g, ' ')}</strong>
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        {isStolen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-danger-100 text-danger-800 font-extrabold text-xs border border-danger-300 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-danger-600" /> STOLEN / BLACKLISTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success-50 text-success-700 font-bold text-xs border border-success-200">
                            <ShieldCheck className="w-3 h-3 text-success-600" /> Clean
                          </span>
                        )}
                      </Td>
                      <Td align="center">
                        {rec.status === 'IN_STOCK' && <Badge variant="verified" size="sm">IN STOCK</Badge>}
                        {rec.status === 'SOLD' && <Badge variant="sold" size="sm">SOLD</Badge>}
                        {rec.status === 'IN_REPAIR' && <Badge variant="business" size="sm">REPAIR</Badge>}
                        {rec.status === 'RESERVED' && <Badge variant="starter" size="sm">RESERVED</Badge>}
                        {rec.status === 'DISPOSED' && <Badge variant="sold" size="sm">DISPOSED</Badge>}
                        {rec.status === 'RETURNED' && <Badge variant="starter" size="sm">RETURNED</Badge>}
                      </Td>
                      <Td align="right" className="font-extrabold text-slate-900">
                        {rec.sellingPrice != null ? `₦${rec.sellingPrice.toLocaleString()}` : (rec.purchasePrice != null ? `₦${rec.purchasePrice.toLocaleString()}` : '—')}
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isStolen ? (
                            <Button variant="secondary" size="sm" onClick={() => handleClearStolen(rec)} title="Clear Stolen Status">
                              Clear Flag
                            </Button>
                          ) : (
                            <Button
                              variant="ghostDanger"
                              size="icon"
                              onClick={() => setStolenModalRecord(rec)}
                              title="Flag as Stolen / Looted"
                              aria-label="Flag as Stolen / Looted"
                              leftIcon={<ShieldAlert className="w-4 h-4" />}
                            />
                          )}
                          <Link href={`/dashboard/records/${rec.id}`}>
                            <Button variant="ghost" size="icon" title="View Details" aria-label="View Details" leftIcon={<Eye className="w-4 h-4" />} />
                          </Link>
                          <Link href={`/dashboard/checkout?device=${rec.id}`}>
                            <Button variant="ghost" size="icon" title="Quick Sell" aria-label="Quick Sell" leftIcon={<ShoppingCart className="w-4 h-4" />} />
                          </Link>
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrap>

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
      <Modal
        isOpen={!!stolenModalRecord}
        onClose={() => setStolenModalRecord(null)}
        dismissible={!isSubmittingTheft}
        size="lg"
        title="Flag Device as Stolen / Looted"
        description={
          stolenModalRecord ? `${stolenModalRecord.brand} ${stolenModalRecord.model} • IMEI: ${stolenModalRecord.imei1}` : undefined
        }
        icon={
          <div className="w-10 h-10 rounded-control bg-danger-600 text-white flex items-center justify-center shadow-md shadow-danger-600/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        }
      >
            <form onSubmit={handleFlagStolenSubmit} className="space-y-4 pt-1">
              {actionError && (
                <div role="alert" className="p-3 rounded-control bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <Select label="Reason for Theft Report" value={theftReason} onChange={(e) => setTheftReason(e.target.value)}>
                <option value="Store Break-in / Looted">Store Break-in / Looted</option>
                <option value="In-Transit Cargo Loss">In-Transit Cargo Loss</option>
                <option value="Customer Payment Default / Fraud">Customer Payment Default / Fraud</option>
                <option value="Armed Robbery / Snatching">Armed Robbery / Snatching</option>
                <option value="Other Unlawful Loss">Other Unlawful Loss</option>
              </Select>

              <Textarea
                label="Public Lost Note / Reward Message"
                rows={2}
                placeholder="e.g. This phone was looted from our store. Cash reward available for return. Call 080..."
                value={lostNote}
                onChange={(e) => setLostNote(e.target.value)}
                helperText="This message will be visible to any buyer or shop scanning this IMEI."
                className="min-h-[64px]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput
                  label="Recovery Phone #"
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
                <TextInput
                  label="Police Case # (Optional)"
                  type="text"
                  placeholder="e.g. CR-9082/2026"
                  value={policeCaseNo}
                  onChange={(e) => setPoliceCaseNo(e.target.value)}
                />
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
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  isLoading={isSubmittingTheft}
                  leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                >
                  Confirm & Blacklist Device
                </Button>
              </div>
            </form>
      </Modal>

    </div>
  );
}
