'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  CreditCard,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  ChevronDown,
  Globe,
  Mail,
  Phone,
  Building,
  Key,
  ShieldAlert,
  Server,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'platform' | 'billing' | 'verification' | 'security'>('platform');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Platform Form State
  const [platformName, setPlatformName] = useState('VerifyFlow');
  const [supportEmail, setSupportEmail] = useState('support@verifyflow.com');
  const [supportPhone, setSupportPhone] = useState('+234 800 000 0000');
  const [defaultCountry, setDefaultCountry] = useState('NG');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [requireBusinessApproval, setRequireBusinessApproval] = useState(false);

  // Billing Form State
  const [defaultCurrency, setDefaultCurrency] = useState('NGN');
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [autoRetryFailedPayments, setAutoRetryFailedPayments] = useState(true);

  // Verification Form State
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);
  const [imeiLookupProvider, setImeiLookupProvider] = useState('Primary GSMA Gateway');
  const [autoFlagSuspicious, setAutoFlagSuspicious] = useState(true);

  // Security Form State
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [require2FAAdmin, setRequire2FAAdmin] = useState(true);
  const [auditLogRetentionDays, setAuditLogRetentionDays] = useState(365);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }, 600);
  };

  const navItems = [
    {
      id: 'platform',
      label: 'Platform',
      desc: 'Global identity, public contact, and business registration rules',
      icon: Sliders,
    },
    {
      id: 'billing',
      label: 'Billing',
      desc: 'Currency settlements, subscription cycles, and invoice retries',
      icon: CreditCard,
    },
    {
      id: 'verification',
      label: 'Verification',
      desc: 'Lookup rate limiting, GSMA engines, and auto-flagging rules',
      icon: ShieldCheck,
    },
    {
      id: 'security',
      label: 'Security',
      desc: 'Admin 2FA enforcement, session timeout, and audit log retention',
      icon: Lock,
    },
  ] as const;

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <div className="flex flex-col flex-1 pb-24 font-sans w-full max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Configure global platform identity, registration policies, billing parameters, and security protocols.
        </p>
      </div>

      {/* Category Dropdown Selector */}
      <div className="mb-6 relative">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
          Settings Category
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full h-[52px] px-4 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl flex items-center justify-between shadow-subtle transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CurrentIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-slate-900 block">{currentItem.label}</span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {currentItem.desc}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu Modal */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-[60px] z-30 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-700 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{item.label}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{item.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 mr-1" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Settings Form Canvas */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Platform Settings */}
        {activeTab === 'platform' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>Platform Settings</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage global platform identity, public contact info, and registration rules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Support Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Default Country</label>
                <select
                  value={defaultCountry}
                  onChange={(e) => setDefaultCountry(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                >
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Business Registration</h3>

              <div className="flex items-start justify-between p-4 bg-slate-50/60 border border-slate-200 rounded-xl">
                <div className="pr-4">
                  <span className="font-bold text-xs text-slate-900 block">Allow New Business Registration</span>
                  <span className="text-[11px] text-slate-500">Controls whether new retail businesses can sign up for VerifyFlow.</span>
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

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireEmailVerification}
                    onChange={(e) => setRequireEmailVerification(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Require Email Verification</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireBusinessApproval}
                    onChange={(e) => setRequireBusinessApproval(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Require Business Admin Approval before Activation</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Billing Settings */}
        {activeTab === 'billing' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Billing & Subscriptions Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure currency settlements, invoice grace periods, and automated retry policies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Settlement Currency</label>
                <input
                  type="text"
                  disabled
                  value="NGN (₦) - Nigerian Naira"
                  className="w-full h-[40px] px-3.5 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Grace Period (Days)</label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Automatic Payment Retry</span>
                <span className="text-[11px] text-slate-500">Automatically re-attempt failed subscription card charges after 24 hours.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoRetryFailedPayments}
                  onChange={(e) => setAutoRetryFailedPayments(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        )}

        {/* Section 3: Verification Rules */}
        {activeTab === 'verification' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Verification Engine Rules</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure lookup rate limits, blacklist databases, and automated flags.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Rate Limit (Lookups / IP / minute)</label>
                <input
                  type="number"
                  value={rateLimitPerMinute}
                  onChange={(e) => setRateLimitPerMinute(Number(e.target.value))}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Primary GSMA Lookup Engine</label>
                <select
                  value={imeiLookupProvider}
                  onChange={(e) => setImeiLookupProvider(e.target.value)}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-semibold text-slate-900 outline-none"
                >
                  <option>Primary GSMA Gateway</option>
                  <option>National Police & NCC Cluster</option>
                  <option>Global TAC Registry</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Auto-Flag Suspicious Activity</span>
                <span className="text-[11px] text-slate-500">Automatically flag IMEI numbers searched more than 5 times from distinct IP ranges.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoFlagSuspicious}
                  onChange={(e) => setAutoFlagSuspicious(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        )}

        {/* Section 4: Security Protocols */}
        {activeTab === 'security' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>HQ Security Protocols</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure administrator session timeouts, two-factor authentication, and audit logs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Audit Log Retention (Days)</label>
                <input
                  type="number"
                  value={auditLogRetentionDays}
                  onChange={(e) => setAuditLogRetentionDays(Number(e.target.value))}
                  className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Enforce 2-Factor Authentication (2FA)</span>
                <span className="text-[11px] text-slate-500">Require TOTP authenticator app verification for all HQ Admin logins.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={require2FAAdmin}
                  onChange={(e) => setRequire2FAAdmin(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            className="px-5 h-[38px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully</span>
        </div>
      )}
    </div>
  );
}
