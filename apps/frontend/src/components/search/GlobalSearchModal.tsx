'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ShieldCheck, Smartphone, User, FileText, ArrowRight, Command } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface SearchResultItem {
  id: string;
  type: 'IMEI' | 'PHONE' | 'CUSTOMER' | 'INVOICE';
  title: string;
  subtitle: string;
  badgeText: string;
}

const MOCK_RESULTS: SearchResultItem[] = [
  {
    id: '1',
    type: 'IMEI',
    title: '354892019283741',
    subtitle: 'iPhone 15 Pro Max 256GB Natural Titanium',
    badgeText: 'VERIFIED PHONE',
  },
  {
    id: '2',
    type: 'PHONE',
    title: 'Samsung Galaxy S24 Ultra',
    subtitle: 'SN: R58M90X12KL - Purchased June 12',
    badgeText: 'IN STOCK',
  },
  {
    id: '3',
    type: 'CUSTOMER',
    title: 'Marcus Vance',
    subtitle: 'marcus.vance@techcorp.com - 3 Phones Registered',
    badgeText: 'VIP CUSTOMER',
  },
  {
    id: '4',
    type: 'INVOICE',
    title: 'INV-2026-8891',
    subtitle: 'Total: ₦2,499,000 - Paid via POS',
    badgeText: 'PAID',
  },
];

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

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

  if (!isOpen) return null;

  const filtered = query.trim()
    ? MOCK_RESULTS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-dropdown overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search IMEI, Serial Number, Customer Name, Invoice ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm sm:text-base bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Recent Searches
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(term)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 transition-colors"
                  >
                    <span>{term}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center gap-2.5 text-slate-600 cursor-pointer">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verify Phone Record</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center gap-2.5 text-slate-600 cursor-pointer">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Register IMEI / Serial</span>
                </div>
              </div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Search Results ({filtered.length})
              </div>
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      {item.type === 'IMEI' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      ) : item.type === 'PHONE' ? (
                        <Smartphone className="w-4 h-4 text-blue-600" />
                      ) : item.type === 'CUSTOMER' ? (
                        <User className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <Badge variant="verified" size="sm">
                    {item.badgeText}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No matching records found for "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Check for typos in IMEI, Serial, or customer email.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> Navigation enabled
          </span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
}
