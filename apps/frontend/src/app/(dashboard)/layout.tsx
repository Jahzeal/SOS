'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { Bell, Search, ShieldCheck, Menu, LayoutDashboard, Plus, List, LogOut, UserCircle } from 'lucide-react';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_access_token');
      localStorage.removeItem('vf_user');
    }
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 pb-16 lg:pb-0">
      {/* Responsive Sidebar (Desktop Persistent + Mobile Drawer) */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navigation Header */}
        <header className="h-16 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20 shadow-subtle">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">VerifyFlow</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            {/* Global Search Shortcut Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition shadow-subtle min-w-0 sm:min-w-[220px] justify-between"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="hidden sm:inline">Search IMEI / Serial...</span>
                <span className="sm:hidden">Search...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-400 font-semibold shadow-subtle">
                Ctrl+K
              </kbd>
            </button>

            {/* Notification Bell */}
            <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition relative shadow-subtle">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white"></span>
            </button>

            {/* Top Bar User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition border border-slate-200/60"
                title="Account Settings & Logout"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <span className="hidden md:inline font-bold text-xs text-slate-800 max-w-[100px] truncate">
                  {user?.firstName || 'Account'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in duration-150 text-xs">
                  <div className="p-2.5 border-b border-slate-100 space-y-0.5">
                    <div className="font-extrabold text-slate-900 truncate">
                      {user?.firstName || 'Store'} {user?.lastName || 'User'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate font-medium">{user?.email || 'owner@retailer.com'}</div>
                    <div className="text-[10px] text-blue-600 font-bold uppercase pt-1">
                      {user?.business?.name || 'Main Workspace'}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold"
                    >
                      <UserCircle className="w-4 h-4 text-slate-500" />
                      <span>Account Settings</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Log Out of Store</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 flex-1 max-w-7xl mx-auto w-full">{children}</main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed on Mobile Viewports)                 */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-2xl">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 transition"
        >
          <LayoutDashboard className="w-5 h-5 text-slate-700" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/verify"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 transition"
        >
          <Search className="w-5 h-5 text-slate-700" />
          <span>Verify</span>
        </Link>

        {/* Floating Register Phone FAB Action Button in Center */}
        <Link
          href="/dashboard/register"
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center -mt-6 border-4 border-white transition-transform active:scale-95"
          title="Register Phone"
        >
          <Plus className="w-6 h-6" />
        </Link>

        <Link
          href="/dashboard/records"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 transition"
        >
          <List className="w-5 h-5 text-slate-700" />
          <span>Records</span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 transition"
        >
          <Menu className="w-5 h-5 text-slate-700" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
