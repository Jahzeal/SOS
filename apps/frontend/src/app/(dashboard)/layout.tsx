'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { isTokenExpired } from '@/lib/jwt-utils';
import { api } from '@/lib/api';
import {
  Bell,
  Search,
  ShieldCheck,
  Menu,
  LayoutDashboard,
  Plus,
  List,
  LogOut,
  UserCircle,
  CheckCheck,
  Smartphone,
  Sparkles,
  Receipt,
  Shield,
  Loader2,
  X,
} from 'lucide-react';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  icon: 'phone' | 'shield' | 'receipt' | 'sparkle';
  href: string;
}

function formatRelativeTime(dateString: string | Date): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('vf_access_token');
    return Boolean(token && !isTokenExpired(token));
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Store Notifications Real Data State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const readStorageKey = user?.id ? `vf_read_notifications_${user.id}` : 'vf_read_notifications';

  const fetchNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('vf_access_token');
    if (!token || isTokenExpired(token)) return;

    try {
      setIsLoadingNotifications(true);
      const res = await api.getDashboardNotifications();
      if (res?.success && Array.isArray(res.data)) {
        let readIds: string[] = [];
        try {
          readIds = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
        } catch {
          readIds = [];
        }

        const formatted: NotificationItem[] = res.data.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          time: formatRelativeTime(item.createdAt),
          unread: !readIds.includes(item.id),
          icon: item.icon,
          href: item.href,
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      // Backend request error
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [readStorageKey]);

  useEffect(() => {
    if (isAuthorized) {
      fetchNotifications();
      // Poll every 30s for real-time activity updates
      const notifInterval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(notifInterval);
    }
  }, [isAuthorized, fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(allIds));
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markItemAsRead = (id: string) => {
    try {
      let readIds: string[] = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(readStorageKey, JSON.stringify(readIds));
      }
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  useEffect(() => {
    const verifySession = () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('vf_access_token');
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem('vf_access_token');
        localStorage.removeItem('vf_user');
        logout();
        setIsAuthorized(false);
        router.replace('/login?expired=true');
      } else {
        setIsAuthorized(true);
      }
    };

    verifySession();

    // Active session monitoring: check on window focus and every 10 seconds
    const handleFocus = () => verifySession();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(verifySession, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [router, logout]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_access_token');
      localStorage.removeItem('vf_user');
    }
    logout();
    router.push('/login');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-7 h-7 rounded-full border-2 border-slate-300 border-t-teal-600 animate-spin" />
      </div>
    );
  }

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
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
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

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition relative shadow-subtle cursor-pointer"
                title="Store Notifications & Alerts"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-teal-600 absolute top-2 right-2 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-extrabold text-[10px] border border-teal-200">
                            {unreadCount} New
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">All caught up</span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                      {isLoadingNotifications && notifications.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                          <span className="text-[11px] font-medium">Loading store activity...</span>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-7 px-4 text-center space-y-1.5">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Bell className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">No New Notifications</p>
                          <p className="text-[11px] text-slate-400 max-w-[210px] mx-auto leading-relaxed">
                            New inventory additions, sales receipts, and repair updates will appear here in real time.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.href}
                            onClick={() => {
                              markItemAsRead(n.id);
                              setIsNotificationsOpen(false);
                            }}
                            className={`block p-2.5 rounded-xl transition border ${
                              n.unread
                                ? 'bg-teal-50/40 border-teal-100 hover:bg-teal-50/80'
                                : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                {n.icon === 'phone' && <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                                {n.icon === 'shield' && <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                {n.icon === 'receipt' && <Receipt className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                {n.icon === 'sparkle' && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                <span className="font-extrabold text-slate-900 text-xs">{n.title}</span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-400 shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug pl-5">{n.description}</p>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
                      <Link
                        href="/dashboard/records"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] font-bold text-teal-600 hover:underline"
                      >
                        View Store Records →
                      </Link>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Top Bar User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition border border-slate-200/60"
                title="Account Settings & Store Details"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <span className="hidden md:inline font-bold text-xs text-slate-800 max-w-[100px] truncate">
                  {user?.firstName || 'Account'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 z-50 animate-in fade-in duration-150 text-xs space-y-2">
                  {/* User & Store Details Card */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div>
                      <div className="font-extrabold text-slate-900 truncate text-sm">
                        {user?.firstName || 'Store'} {user?.lastName || 'Owner'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-medium">{user?.email || ''}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Store:</span>
                        <span className="font-bold text-teal-700 truncate max-w-[130px]">{user?.business?.name || 'TechWorld Mobile'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Branch:</span>
                        <span className="font-bold text-slate-800">Ikeja Main Branch</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500 font-medium">Plan:</span>
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">PRO PLAN</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition"
                    >
                      <UserCircle className="w-4 h-4 text-slate-500" />
                      <span>Account & Store Settings</span>
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
        <main className="p-4 sm:p-6 xl:p-8 2xl:p-10 flex-1 max-w-full 2xl:max-w-[1720px] mx-auto w-full">{children}</main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed on Mobile Viewports)                 */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-2xl">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-teal-600 transition"
        >
          <LayoutDashboard className="w-5 h-5 text-slate-700" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/verify"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-teal-600 transition"
        >
          <Search className="w-5 h-5 text-slate-700" />
          <span>Verify</span>
        </Link>

        {/* Floating Register Phone FAB Action Button in Center */}
        <Link
          href="/dashboard/register"
          className="w-12 h-12 rounded-full bg-teal-600 text-white shadow-xl flex items-center justify-center -mt-6 border-4 border-white transition-transform active:scale-95"
          title="Register Phone"
        >
          <Plus className="w-6 h-6" />
        </Link>

        <Link
          href="/dashboard/records"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-teal-600 transition"
        >
          <List className="w-5 h-5 text-slate-700" />
          <span>Records</span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-700 hover:text-teal-600 transition"
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
