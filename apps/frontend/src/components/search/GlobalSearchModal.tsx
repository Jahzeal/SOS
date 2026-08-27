'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ShieldCheck, Smartphone, User, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export interface SearchResultItem {
  id: string;
  type: 'IMEI' | 'PHONE' | 'CUSTOMER' | 'INVOICE';
  title: string;
  subtitle: string;
  badgeText: string;
  link?: string;
}

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [devicesRes, salesRes] = await Promise.allSettled([
          api.getInventory({ search: query.trim() }),
          api.getReceipts(query.trim()),
        ]);

        const items: SearchResultItem[] = [];

        if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value)) {
          devicesRes.value.slice(0, 5).forEach((d: any) => {
            items.push({
              id: d.id,
              type: 'PHONE',
              title: `${d.brand || ''} ${d.model || 'Device'}`.trim(),
              subtitle: `IMEI: ${d.imei1 || d.imei || '—'}${d.serialNumber ? ` | SN: ${d.serialNumber}` : ''}`,
              badgeText: d.status || 'IN_STOCK',
              link: `/dashboard/inventory/${d.id}`,
            });
          });
        }

        if (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value)) {
          salesRes.value.slice(0, 5).forEach((s: any) => {
            items.push({
              id: s.id,
              type: 'INVOICE',
              title: `Sale #${s.invoiceNumber || s.id?.slice(0, 8)}`,
              subtitle: `Customer: ${s.customerName || s.customer?.name || 'Walk-in'} • ₦${(s.totalAmount || 0).toLocaleString()}`,
              badgeText: s.paymentStatus || 'PAID',
              link: `/dashboard/sales/${s.id}`,
            });
          });
        }

        setResults(items);
      } catch (err) {
        console.error('Global search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResultItem) => {
    if (item.link) {
      router.push(item.link);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search IMEI, Serial Number, Device Model, Invoice ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm sm:text-base bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">
            ESC
          </span>
        </div>

        {/* Content Body */}
        <div className="max-h-[380px] overflow-y-auto p-4 custom-scrollbar">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Type an IMEI, Serial Number, Customer name or Invoice ID to search live database records.
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1.5">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="w-full p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      {item.type === 'PHONE' || item.type === 'IMEI' ? (
                        <Smartphone className="w-4 h-4" />
                      ) : item.type === 'CUSTOMER' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-mono">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.badgeText}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No matching records found in database for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
