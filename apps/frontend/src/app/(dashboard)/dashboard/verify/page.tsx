'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, QrCode, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function VerifyPhonePage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (query.includes('358') || query.toLowerCase().includes('dnx')) {
        setResult({
          found: true,
          brand: 'Apple',
          model: 'iPhone 15 Pro Max',
          color: 'Natural Titanium',
          storage: '256GB',
          condition: 'LIKE_NEW',
          status: 'IN_STOCK',
          serialNumber: 'DNX92K418A',
          imei: '358291048291048',
          registeredDate: '2026-07-28',
          warrantyMonths: 12,
        });
      } else {
        setResult({ found: false });
      }
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-16">
      
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-4">
        <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
          <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-600 font-bold">Verify IMEI & QR</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">IMEI & QR Authenticity Scanner</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Perform immediate hardware authentication, status check, and warranty validation against global & store ledgers.
        </p>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan QR Code or Enter IMEI / Serial Number..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
        </div>
        <Button variant="primary" size="lg" isLoading={loading} leftIcon={<ShieldCheck className="w-4 h-4" />}>
          {loading ? 'Scanning...' : 'Verify IMEI'}
        </Button>
      </form>

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
                  <span className="font-mono font-bold text-blue-700">{result.imei}</span>
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
    </div>
  );
}
