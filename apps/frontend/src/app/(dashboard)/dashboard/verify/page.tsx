'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  X,
  RotateCcw,
  Plus,
  Phone,
  MessageSquare,
  Lock,
  Unlock,
  Building2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApiErrorState } from '@/components/ui/ApiErrorState';
import { api } from '@/lib/api';

export default function VerifyPhonePage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setErrorState(null);
    setResult(null);

    try {
      const data = await api.publicVerifyDevice(query.trim());
      setResult(data);
    } catch (err: any) {
      setErrorState(err.message || 'Unable to connect to verification ledger.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-16">
      
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">IMEI Verification & Anti-Theft Scanner</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Authenticate device ownership, carrier lock status, activation state, and theft registry records in real time.
          </p>
        </div>
        <Link href="/report-stolen">
          <Button variant="secondary" size="sm" className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
            Report Stolen Phone
          </Button>
        </Link>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter 15-digit IMEI or Serial Number..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <Button variant="primary" size="md" isLoading={loading} leftIcon={<ShieldCheck className="w-4 h-4" />}>
          {loading ? 'Verifying...' : 'Verify Device'}
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

      {/* Unified Verification Result Card */}
      {result && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* 1. THEFT / BLACKLIST BANNER */}
          {result.isStolen ? (
            <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-4 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                      STOLEN / LOST MODE ACTIVE
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-rose-900">
                    WARNING: This device has been reported as STOLEN
                  </h3>
                  <p className="text-xs text-rose-800 font-medium">
                    Do not purchase, unlock, or service this device without contacting the verified owner.
                  </p>
                </div>
              </div>

              {/* Owner Note Box */}
              {result.ownerMessage && (
                <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <MessageSquare className="w-4 h-4 text-rose-600" />
                    <span>Owner's Recovery Note & Message:</span>
                  </div>
                  <p className="text-xs text-slate-700 italic font-medium leading-relaxed">
                    "{result.ownerMessage}"
                  </p>
                  {result.contactPhone && (
                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={`tel:${result.contactPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Owner ({result.contactPhone})
                      </a>
                      <a
                        href={`https://wa.me/${result.contactPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
                      >
                        WhatsApp Owner
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950">Clean Title Verified</h3>
                  <p className="text-xs text-emerald-800 font-medium">No theft reports or active blacklists found for this device.</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
                CLEAN
              </span>
            </div>
          )}

          {/* 2. SPECIFICATIONS & STATUS GRID */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
            
            {/* Header Device Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {result.deviceInfo?.brand || 'Smartphone'} {result.deviceInfo?.model || 'Device'}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  IMEI: <strong>{query.trim()}</strong> {result.deviceInfo?.serialNumber ? `• SN: ${result.deviceInfo.serialNumber}` : ''}
                </p>
              </div>

              {result.retailer ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Certified by {result.retailer.name}</span>
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-500">
                  Hardware Profile Verified
                </div>
              )}
            </div>

            {/* 3 Core Pillars: Theft, Carrier, Activation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Pillar 1: Theft Status */}
              <div className={`p-4 rounded-2xl border ${result.isStolen ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Theft & Blacklist</span>
                <p className={`text-sm font-extrabold flex items-center gap-1.5 ${result.isStolen ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {result.isStolen ? <ShieldAlert className="w-4 h-4 text-rose-600" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                  {result.isStolen ? 'Blacklisted / Stolen' : 'Clean & Verified'}
                </p>
              </div>

              {/* Pillar 2: Carrier Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Carrier Lock</span>
                <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  {result.carrierStatus === 'CARRIER_LOCKED' ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-700">Locked ({result.lockedCarrier || 'Carrier'})</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Factory Unlocked (All SIMs)</span>
                    </>
                  )}
                </p>
              </div>

              {/* Pillar 3: Activation State */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activation State</span>
                <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span className="text-slate-800">
                    {result.activationStatus ? result.activationStatus.replace(/_/g, ' ') : 'Ready for Setup'}
                  </span>
                </p>
              </div>
            </div>

            {/* Additional Hardware & Warranty Details */}
            {result.warranty && (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-blue-900">Warranty Coverage:</span>
                  <p className="text-blue-700 font-medium">
                    {result.warranty.warrantyDurationMonths} Months Store Guarantee • {result.warranty.isWarrantyActive ? 'Active' : 'Expired'}
                  </p>
                </div>
                <Link href="/dashboard/register">
                  <Button variant="secondary" size="sm" className="text-xs font-bold">
                    Log Intake
                  </Button>
                </Link>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
