'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Key,
  Building,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'platform' | 'paystack'>('profile');
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [adminName, setAdminName] = useState(user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Admin User');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@verifyflow.ng');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Contact & Support Form State
  const [supportEmail, setSupportEmail] = useState('support@verifyflow.ng');
  const [supportPhone, setSupportPhone] = useState('+234 802 000 1122');
  const [supportWhatsApp, setSupportWhatsApp] = useState('+234 802 000 1122');

  // Platform & Maintenance State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Paystack Gateway State
  const [paystackPublicKey, setPaystackPublicKey] = useState('pk_live_894103847291048291048');
  const [paystackSecretKey, setPaystackSecretKey] = useState('sk_live_••••••••••••••••••••••••');
  const [paystackWebhookSecret, setPaystackWebhookSecret] = useState('whsec_live_99482019482');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.adminGetSettings();
        if (res?.success && res.data) {
          setMaintenanceMode(res.data.maintenanceMode ?? false);
          setAllowRegistration(res.data.allowPublicRegistrations ?? true);
          if (res.data.alertEmail) setSupportEmail(res.data.alertEmail);
          if (res.data.webhookSecret) setPaystackWebhookSecret(res.data.webhookSecret);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.adminUpdateSettings({
        maintenanceMode,
        allowPublicRegistrations: allowRegistration,
        alertEmail: supportEmail,
        webhookSecret: paystackWebhookSecret,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-24 font-sans w-full max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Manage your administrator profile, public merchant contact info, payment credentials, and platform status.
        </p>
      </div>

      {/* Clean Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px text-xs font-bold custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Admin Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'contact'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Support & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paystack')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'paystack'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Paystack Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('platform')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'platform'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Controls</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Admin Profile & Credentials */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Administrator Account</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update your login email, display name, and administrative password.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Admin Full Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Admin Login Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>Change Password</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Support & Contact Info */}
        {activeTab === 'contact' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Support & Public Contact Channels</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Contact information presented to businesses on receipts, invoices, and help requests.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Official Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Support Phone Line</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5">Support WhatsApp Channel</label>
                <input
                  type="text"
                  value={supportWhatsApp}
                  onChange={(e) => setSupportWhatsApp(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Paystack Payment Gateway */}
        {activeTab === 'paystack' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Paystack Gateway Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage live Paystack credentials used for subscription billings and automated merchant charges.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Paystack Public Key</label>
                <input
                  type="text"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Paystack Secret Key</label>
                <input
                  type="password"
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Paystack Webhook Secret</label>
                <input
                  type="text"
                  value={paystackWebhookSecret}
                  onChange={(e) => setPaystackWebhookSecret(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Platform & Maintenance */}
        {activeTab === 'platform' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Platform Controls</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Control business merchant registration and system-wide maintenance mode.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-slate-50/60 border border-slate-200 rounded-xl">
                <div className="pr-4">
                  <span className="font-bold text-xs text-slate-900 block">Allow New Business Signups</span>
                  <span className="text-[11px] text-slate-500">Enable or disable registration of new merchant accounts.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allowRegistration}
                    onChange={(e) => setAllowRegistration(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-start justify-between p-4 bg-rose-50/30 border border-rose-200 rounded-xl">
                <div className="pr-4">
                  <span className="font-bold text-xs text-rose-900 block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Platform Maintenance Mode
                  </span>
                  <span className="text-[11px] text-rose-700">Freeze public device lookups temporarily while performing network maintenance.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 h-[40px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold z-50 animate-in fade-in-50 zoom-in-95 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Admin settings saved successfully</span>
        </div>
      )}
    </div>
  );
}
