'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  Smartphone,
  Users,
  Search,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Smartphone },
  { name: 'CRM', href: '/dashboard/customers', icon: Users },
  { name: 'Verification', href: '/records', icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for dynamic glassmorphic elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 font-sans ${
        isScrolled
          ? 'bg-[#121417]/95 backdrop-blur-md border-b border-[#222830] shadow-2xl shadow-black/40'
          : 'bg-[#121417] border-b border-[#1c2127]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* 1. LEFT: BRAND IDENTITY (SVG MONOGRAM + SPACE GROTESK TEXT) */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E6F5E] rounded-xl py-1 pr-2"
          >
            {/* SVG Wrapper */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#1A1D23] border border-[#242A33] rounded-xl p-1 shadow-inner group-hover:border-[#2E6F5E]/60 transition-colors">
              <BrandLogo variant="full" size="sm" />
            </div>

            {/* Brand Wordmark */}
            <span className="font-space font-extrabold text-base sm:text-lg tracking-[0.2em] text-white select-none transition-colors group-hover:text-emerald-300">
              NOXGUARDA
            </span>
          </Link>

          {/* 2. CENTER/DESKTOP NAV LINKS (MINIMALIST STATES) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {NAV_ITEMS.map((item) => {
              const active = isActiveLink(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 group ${
                    active
                      ? 'text-white bg-[#1A1D23] border border-[#2E6F5E]/50 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-[#1A1D23]/60 border border-transparent'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        active ? 'text-[#3B8B77]' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                  )}
                  <span>{item.name}</span>

                  {/* Active Indicator Micro-Pill */}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2E6F5E] rounded-full shadow-sm shadow-[#2E6F5E]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. RIGHT: CRYPTOGRAPHIC SECURE BADGE & ACTIONS */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Cryptographic Security Indicator Badge */}
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#121417] border border-[#242A33] shadow-inner text-xs font-mono select-none hover:border-[#2E6F5E]/60 transition-colors"
              title="Cryptographic Hardware Key Verified & Immutable Ledger Synced"
            >
              <div className="relative flex items-center justify-center w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6F5E] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#3B8B77]" />
              </div>
              
              <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                <span className="text-[#3B8B77] font-extrabold">SECURE</span> • SYNCED
              </span>
            </div>

            {/* Quick Terminal Launch CTA */}
            <Link href="/dashboard/sales/new">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2E6F5E] hover:bg-[#255C4E] text-white text-xs font-bold transition-all shadow-md shadow-[#2E6F5E]/20 hover:shadow-[#2E6F5E]/40"
              >
                <span>POS Sale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* 4. MOBILE HAMBURGER BUTTON */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Compact Mobile Secure Dot */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1A1D23] border border-[#242A33] text-[10px] font-mono text-slate-300 sm:hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B8B77] animate-pulse" />
              <span className="font-bold text-[#3B8B77]">SECURE</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1A1D23] border border-[#242A33] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE EXPANDABLE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#121417] border-b border-[#242A33] animate-in slide-in-from-top-3 duration-200 px-4 pt-3 pb-5 space-y-3">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActiveLink(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    active
                      ? 'bg-[#1A1D23] text-white border border-[#2E6F5E]/60'
                      : 'text-slate-400 hover:text-white hover:bg-[#1A1D23]/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 ${
                          active ? 'text-[#3B8B77]' : 'text-slate-500'
                        }`}
                      />
                    )}
                    <span>{item.name}</span>
                  </div>

                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E6F5E]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Cryptographic Status & Action */}
          <div className="pt-3 border-t border-[#1c2127] space-y-2.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1A1D23] border border-[#242A33] text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B8B77] animate-pulse" />
                <span className="text-slate-300 font-bold text-[11px]">CRYPTOGRAPHIC LEDGER</span>
              </div>
              <span className="text-[#3B8B77] text-[11px] font-extrabold">ONLINE</span>
            </div>

            <Link href="/dashboard/sales/new" className="block w-full">
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#2E6F5E] hover:bg-[#255C4E] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#2E6F5E]/20"
              >
                <span>Launch New POS Sale</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
