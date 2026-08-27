'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Building2,
  Users,
  GitFork,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Receipt,
  HelpCircle,
  FileText,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Shield,
  Activity,
  ListChecks,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Businesses', href: '/admin/businesses', icon: Building2 },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Transactions', href: '/admin/transactions', icon: Receipt },
];

const bottomNavItems: NavItem[] = [
  { name: 'Notifications', href: '/admin/notifications', icon: Bell, badge: '4' },
  { name: 'Support', href: '/admin/support', icon: HelpCircle },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_access_token');
      localStorage.removeItem('vf_user');
    }
    logout();
    router.push('/login');
  };

  const renderNavLinks = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Upper Navigation Links */}
      <div className="space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all duration-150 border-l-4 ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 border-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 border-transparent hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Lower Platform Links */}
      <div className="pt-4 border-t border-slate-200 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileDrawerOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-all duration-150 border-l-4 ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 border-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 border-transparent hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f7f9fb] text-[#191c1e] font-sans antialiased">
      {/* Desktop Persistent Left Navigation Drawer */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden md:flex flex-col bg-white w-72 border-r border-slate-200/90 shadow-sm">
        {/* Admin Company Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-blue-600/20 shrink-0">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-extrabold text-slate-900 truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Admin User'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              System Administrator
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 overflow-y-auto py-3 px-1 flex flex-col justify-between custom-scrollbar">
          {renderNavLinks()}
        </nav>

        {/* Version Footer & Sign Out */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-[11px] bg-slate-50/60">
          <span className="font-mono font-bold text-slate-400 text-[10px]">v2.4.0 (Enterprise)</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition text-xs font-semibold"
            title="Sign out of Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full md:ml-72 pb-24 md:pb-0 overflow-x-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 shadow-subtle w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <h1 className="text-sm sm:text-base font-extrabold text-blue-600 tracking-tight">VerifyFlow</h1>
              <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                HQ Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/notifications"
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition shadow-subtle relative ${
                pathname.startsWith('/admin/notifications')
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Notifications Center"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shadow-subtle cursor-pointer">
              AU
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-3.5 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Slide-Out Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative flex-1 max-w-xs w-full bg-white h-full shadow-2xl z-10 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">Admin User</h3>
                  <p className="text-[10px] text-slate-500 font-medium">System Administrator</p>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {renderNavLinks()}
            </nav>
            <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50">
              <span className="font-mono text-[10px] font-bold text-slate-400">v2.4.0</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-rose-600 font-bold text-xs"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-1.5 bg-white border-t border-slate-200/90 shadow-lg md:hidden">
        <Link
          href="/admin/dashboard"
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
            pathname === '/admin/dashboard' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </Link>
        <Link
          href="/admin/businesses"
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/admin/businesses') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Businesses</span>
        </Link>
        <Link
          href="/admin/subscriptions"
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/admin/subscriptions') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Subs</span>
        </Link>
        <Link
          href="/admin/notifications"
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition relative ${
            pathname.startsWith('/admin/notifications') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Alerts</span>
        </Link>
        <Link
          href="/admin/support"
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/admin/support') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Support</span>
        </Link>
        <Link
          href="/admin/settings"
          className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition ${
            pathname.startsWith('/admin/settings') ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
