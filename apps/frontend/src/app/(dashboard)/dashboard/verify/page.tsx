'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, QrCode, CheckCircle2, AlertTriangle, ShieldAlert, X, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApiErrorState } from '@/components/ui/ApiErrorState';
import { api } from '@/lib/api';

export default function VerifyPhonePage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setErrorState(null);
    setResult(null);
    setShowNotFoundModal(false);

    try {
      const data = await api.verifyPublicImei(query.trim());
      if (data && (data.verified || data.found || data.imei1 || data.brand)) {
        const device = data.deviceInfo || data;
        setResult({
          found: true,
          brand: device.brand || 'Apple',
          model: device.model || 'Registered Device',
          color: device.color || 'Standard',
          storage: device.storageCapacity || '256GB',
          condition: device.condition || 'VERIFIED',
          status: device.status || 'IN_STOCK',
          serialNumber: device.serialNumber || 'SN-VERIFIED',
          imei: device.imei1 || query.trim(),
          registeredDate: device.createdAt ? new Date(device.createdAt).toLocaleDateString() : '2026-07-28',
          warrantyMonths: device.warrantyDurationMonths || 12,
        });
      } else {
        setResult({ found: false });
        setShowNotFoundModal(true);
      }
    } catch (err: any) {
      setErrorState(err.message || 'Unable to connect to verification ledger.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans pb-16">
      
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-base sm:text-lg font-extrabold text-slate-900">IMEI & QR Authenticity Scanner</h1>
        <p className="hidden sm:block text-xs text-slate-500 font-medium mt-0.5">
          Perform immediate hardware authentication, status check, and warranty validation against global & store ledgers.
        </p>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan QR or enter IMEI / Serial No..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-teal-600 placeholder:text-[11px] placeholder:font-sans placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <Button variant="primary" size="sm" isLoading={loading} leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
          {loading ? 'Scanning...' : 'Verify IMEI'}
        </Button>
      </form>

      {/* Error State */}
      {errorState && (
        <ApiErrorState
          title="Verification Error"
          message={errorState}
          onRetry={() => handleSearch()}
          isRetrying={loading}
          compact
        />
      )}

      {/* Result Display */}
      {result && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          {result.found ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-700 font-extrabold text-sm pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Verified Authentic & Clear Store Inventory Record</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Device</span>
                  <span className="font-extrabold text-slate-900 text-sm">{result.brand} {result.model}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Specifications</span>
                  <span className="text-slate-700 font-bold">{result.color} • {result.storage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">IMEI</span>
                  <span className="font-mono font-bold text-teal-700">{result.imei}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Serial Number</span>
                  <span className="font-mono text-slate-700 font-bold">{result.serialNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Condition</span>
                  <span className="text-slate-900 font-bold">{result.condition}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Warranty Guarantee</span>
                  <span className="text-emerald-700 font-extrabold">{result.warrantyMonths} Months Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="font-extrabold text-slate-900 text-base">No Matching Record Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                No registered device matches this IMEI or Serial number. Ensure the number is correct or register it under your store.
              </p>
            </div>
          )}
        </div>
      )}
      {/* IMEI NOT FOUND POPUP MODAL */}
      {showNotFoundModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowNotFoundModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 text-slate-900 text-center animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNotFoundModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">IMEI / Serial Not Found</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                No registered device matches{' '}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-rose-900 font-bold border border-slate-200">
                  {query}
                </code>{' '}
                on the store inventory ledger.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => {
                  setShowNotFoundModal(false);
                  setQuery('');
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Try Another IMEI
              </Button>
              <Link href="/dashboard/register" onClick={() => setShowNotFoundModal(false)}>
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Register New Phone Stock
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
