'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  HelpCircle,
  Clock,
  Check,
  Trash2,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Search,
  CheckCheck,
  Inbox,
  Smartphone,
  Building2,
  Info,
} from 'lucide-react';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'security' | 'billing' | 'support';
  priority: 'urgent' | 'high' | 'normal' | 'info';
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  meta?: {
    businessName?: string;
    imei?: string;
    amount?: string;
    ticketId?: string;
  };
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'system' | 'security' | 'billing' | 'support'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const securityCount = useMemo(() => notifications.filter((n) => n.category === 'security' && !n.isRead).length, [notifications]);
  const billingCount = useMemo(() => notifications.filter((n) => n.category === 'billing' && !n.isRead).length, [notifications]);
  const supportCount = useMemo(() => notifications.filter((n) => n.category === 'support' && !n.isRead).length, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
      if (filterRead === 'unread' && n.isRead) return false;
      if (filterRead === 'read' && !n.isRead) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (n.title || '').toLowerCase().includes(q);
        const matchMessage = (n.message || '').toLowerCase().includes(q);
        const matchBusiness = (n.meta?.businessName || '').toLowerCase().includes(q);
        const matchImei = (n.meta?.imei || '').toLowerCase().includes(q);
        return matchTitle || matchMessage || matchBusiness || matchImei;
      }

      return true;
    });
  }, [notifications, selectedCategory, filterRead, searchQuery]);

  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetNotifications({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: filterRead !== 'all' ? filterRead : undefined,
      });
      if (res?.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedCategory, filterRead]);

  // Actions
  const toggleReadStatus = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
    try {
      await api.adminMarkNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark read on server:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.adminMarkAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all read on server:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.adminDeleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification on server:', err);
    }
  };

  const clearAllRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.isRead));
  };

  return (
    <div className="space-y-6 pb-12 font-sans max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Notifications Center
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Real-time security alerts, transaction webhooks, and administrative event dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Global Bulk Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition shadow-xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read ({unreadCount})</span>
            </button>
          )}

          <button
            onClick={clearAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Clear Read</span>
          </button>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-subtle">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-bold custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>All Alerts</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('security')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'security'
                ? 'bg-rose-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security & Fraud</span>
            {securityCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'security' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'}`}>
                {securityCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory('billing')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'billing'
                ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Subs</span>
            {billingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'billing' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {billingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory('support')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'support'
                ? 'bg-purple-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support Requests</span>
            {supportCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategory === 'support' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'}`}>
                {supportCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory('system')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'system'
                ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>System Logs</span>
          </button>
        </div>

        {/* Read / Unread Status Filter & Search */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setFilterRead('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filterRead === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterRead('unread')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filterRead === 'unread' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterRead('read')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filterRead === 'read' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Read
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Stream */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const isUrgent = notif.priority === 'urgent';
            const isSecurity = notif.category === 'security';
            const isBilling = notif.category === 'billing';
            const isSupport = notif.category === 'support';

            return (
              <div
                key={notif.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-subtle ${
                  notif.isRead
                    ? 'bg-white border-slate-200/80 opacity-80 hover:opacity-100'
                    : isUrgent
                    ? 'bg-rose-50/40 border-rose-200/90 shadow-sm'
                    : isSecurity
                    ? 'bg-amber-50/30 border-amber-200/90'
                    : 'bg-blue-50/30 border-blue-200/90 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Category Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isSecurity
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isBilling
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : isSupport
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {isSecurity ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : isBilling ? (
                        <CreditCard className="w-5 h-5" />
                      ) : isSupport ? (
                        <HelpCircle className="w-5 h-5" />
                      ) : (
                        <Info className="w-5 h-5" />
                      )}
                    </div>

                    {/* Notification Content */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-sm sm:text-base font-extrabold ${notif.isRead ? 'text-slate-800' : 'text-slate-900'}`}>
                          {notif.title}
                        </h3>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            notif.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                              : notif.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : notif.priority === 'normal'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {notif.priority}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {notif.timeAgo}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {notif.message}
                      </p>

                      {/* Attached Metadata Badges */}
                      {notif.meta && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {notif.meta.businessName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {notif.meta.businessName}
                            </span>
                          )}
                          {notif.meta.imei && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-mono font-bold text-blue-700">
                              <Smartphone className="w-3 h-3 text-blue-500" />
                              IMEI: {notif.meta.imei}
                            </span>
                          )}
                          {notif.meta.amount && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-extrabold text-emerald-700">
                              {notif.meta.amount}
                            </span>
                          )}
                          {notif.meta.ticketId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-[11px] font-mono font-bold text-purple-700">
                              #{notif.meta.ticketId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Right Action Tools */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleReadStatus(notif.id)}
                      title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
                    >
                      {notif.isRead ? <Check className="w-4 h-4 text-emerald-600" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      title="Dismiss notification"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Trigger Action Link */}
                {notif.actionUrl && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Dispatched {notif.timestamp}
                    </span>
                    <Link
                      href={notif.actionUrl}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-800 transition group"
                    >
                      <span>{notif.actionLabel || 'Inspect Details'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-subtle">
            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No notifications found</h3>
              <p className="text-xs text-slate-400 text-center">
                All platform systems are operational and there are no alerts matching your current filter criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setFilterRead('all');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
