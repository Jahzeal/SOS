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
  Code,
  Send,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'email' | 'platform' | 'paystack'>('profile');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Admin settings saved successfully');
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

  // Email Templates State
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(true);
  const [welcomeEmailSubject, setWelcomeEmailSubject] = useState('Welcome to VerifyFlow - Your {{businessName}} Store is Ready!');
  const [welcomeEmailHeading, setWelcomeEmailHeading] = useState('Welcome to VerifyFlow!');
  const [welcomeEmailSubheading, setWelcomeEmailSubheading] = useState('Your Verified Phone Inventory & Retail OS is Live');
  const [welcomeEmailBody, setWelcomeEmailBody] = useState(
    'Congratulations! Your store workspace "{{businessName}}" has been successfully created. You now have full access to our high-speed IMEI ledger, express POS checkout, and fraud prevention suite.'
  );
  const [welcomeEmailCtaText, setWelcomeEmailCtaText] = useState('Go to Your Store Dashboard →');

  // Test Email Modal State
  const [testEmailAddress, setTestEmailAddress] = useState(user?.email || 'jahzealibeh16@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

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
          if (res.data.welcomeEmailEnabled !== undefined) setWelcomeEmailEnabled(res.data.welcomeEmailEnabled);
          if (res.data.welcomeEmailSubject) setWelcomeEmailSubject(res.data.welcomeEmailSubject);
          if (res.data.welcomeEmailHeading) setWelcomeEmailHeading(res.data.welcomeEmailHeading);
          if (res.data.welcomeEmailSubheading) setWelcomeEmailSubheading(res.data.welcomeEmailSubheading);
          if (res.data.welcomeEmailBody) setWelcomeEmailBody(res.data.welcomeEmailBody);
          if (res.data.welcomeEmailCtaText) setWelcomeEmailCtaText(res.data.welcomeEmailCtaText);
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
        welcomeEmailEnabled,
        welcomeEmailSubject,
        welcomeEmailHeading,
        welcomeEmailSubheading,
        welcomeEmailBody,
        welcomeEmailCtaText,
      });
      setToastMessage('Admin settings and email templates saved successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return;
    setIsSendingTest(true);
    setTestEmailStatus(null);
    try {
      const res = await api.adminSendTestWelcomeEmail({
        email: testEmailAddress,
        template: {
          subject: welcomeEmailSubject,
          heading: welcomeEmailHeading,
          subheading: welcomeEmailSubheading,
          body: welcomeEmailBody,
          ctaText: welcomeEmailCtaText,
        },
      });

      if (res.success) {
        setTestEmailStatus(`Test email delivered to ${testEmailAddress}`);
      } else {
        setTestEmailStatus(`Failed: ${res.error || 'Check server mail logs'}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`Error: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const insertPlaceholder = (tag: string) => {
    setWelcomeEmailBody((prev) => `${prev} ${tag}`);
  };

  // Preview Interpolation
  const previewSubject = welcomeEmailSubject
    .replace(/{{recipientName}}/g, 'Alex Vance')
    .replace(/{{businessName}}/g, 'GadgetHub Lagos')
    .replace(/{{platformName}}/g, 'VerifyFlow');

  const previewHeading = welcomeEmailHeading
    .replace(/{{recipientName}}/g, 'Alex Vance')
    .replace(/{{businessName}}/g, 'GadgetHub Lagos');

  const previewSubheading = welcomeEmailSubheading
    .replace(/{{recipientName}}/g, 'Alex Vance')
    .replace(/{{businessName}}/g, 'GadgetHub Lagos');

  const previewBody = welcomeEmailBody
    .replace(/{{recipientName}}/g, 'Alex Vance')
    .replace(/{{businessName}}/g, 'GadgetHub Lagos')
    .replace(/{{planName}}/g, 'Starter Plan')
    .replace(/{{email}}/g, 'alex@gadgethub.ng');

  const previewCta = welcomeEmailCtaText || 'Go to Your Store Dashboard →';

  return (
    <div className="flex flex-col flex-1 pb-24 font-sans w-full max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Manage your administrator profile, public merchant contact info, email templates, and platform controls.
        </p>
      </div>

      {/* Clean Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px text-xs font-bold custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'profile'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <User className="w-4 h-4" />
          <span>Admin Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'email'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Mail className="w-4 h-4" />
          <span className="flex items-center gap-1.5">
            Email Templates
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'contact'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          <Phone className="w-4 h-4" />
          <span>Support & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('paystack')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'paystack'
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
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'platform'
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

        {/* ========================================================================= */}
        {/* TAB 1: ADMIN PROFILE                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Administrator Identity
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Display Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Login Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    disabled
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Change Master Password
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EMAIL TEMPLATES & WELCOME CUSTOMIZATION                             */}
        {/* ========================================================================= */}
        {activeTab === 'email' && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Top Config & Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    Merchant Welcome Email Template
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Automatically sent when a store owner creates an account and launches their store workspace.
                  </p>
                </div>

                {/* Enable / Disable Toggle */}
                <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">
                    {welcomeEmailEnabled ? 'Sending Enabled' : 'Sending Paused'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={welcomeEmailEnabled}
                      onChange={(e) => setWelcomeEmailEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>

              {/* Dynamic Placeholders Helper Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  <span>Click to Insert Dynamic Placeholders:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{{recipientName}}', desc: "Owner's Name" },
                    { tag: '{{businessName}}', desc: 'Store Name' },
                    { tag: '{{email}}', desc: 'Login Email' },
                    { tag: '{{planName}}', desc: 'Selected Plan' },
                    { tag: '{{platformName}}', desc: 'Platform Name' },
                    { tag: '{{dashboardUrl}}', desc: 'Portal Link' },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertPlaceholder(item.tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 font-mono text-[11px] font-bold transition flex items-center gap-1"
                      title={item.desc}
                    >
                      <span>{item.tag}</span>
                      <span className="text-[9px] text-slate-400 font-sans">({item.desc})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Split Grid: Left Editor & Right Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Left 6 Cols: Template Editor */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" /> Template Configuration
                </h3>

                {/* Email Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Subject Line</label>
                  <input
                    type="text"
                    value={welcomeEmailSubject}
                    onChange={(e) => setWelcomeEmailSubject(e.target.value)}
                    placeholder="Welcome to VerifyFlow - Your {{businessName}} Store is Ready!"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Header Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Banner Heading</label>
                    <input
                      type="text"
                      value={welcomeEmailHeading}
                      onChange={(e) => setWelcomeEmailHeading(e.target.value)}
                      placeholder="Welcome to VerifyFlow!"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Banner Subheading</label>
                    <input
                      type="text"
                      value={welcomeEmailSubheading}
                      onChange={(e) => setWelcomeEmailSubheading(e.target.value)}
                      placeholder="Your Verified Phone Inventory OS is Live"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Greeting & Message Body</label>
                  <textarea
                    rows={4}
                    value={welcomeEmailBody}
                    onChange={(e) => setWelcomeEmailBody(e.target.value)}
                    placeholder="Congratulations! Your store workspace has been created..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed custom-scrollbar"
                  />
                </div>

                {/* CTA Button Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Button Label</label>
                  <input
                    type="text"
                    value={welcomeEmailCtaText}
                    onChange={(e) => setWelcomeEmailCtaText(e.target.value)}
                    placeholder="Go to Your Store Dashboard →"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Test Email Dispatcher Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 pt-4 mt-2">
                  <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-600" /> Send Real Test Email
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="Enter test recipient email..."
                      className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      disabled={isSendingTest || !testEmailAddress}
                      onClick={handleSendTestEmail}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 shrink-0"
                    >
                      {isSendingTest ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Test</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testEmailStatus && (
                    <p className={`text-xs font-bold ${testEmailStatus.startsWith('Test email') ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {testEmailStatus}
                    </p>
                  )}
                </div>

              </div>

              {/* Right 6 Cols: Live Visual Preview */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" /> Live Visual Preview
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    Sample Data Render
                  </span>
                </div>

                {/* Email Mock Window */}
                <div className="rounded-2xl border border-slate-300 shadow-md bg-[#0f172a] text-slate-100 p-5 font-sans space-y-4 overflow-hidden">

                  {/* Mock Subject Header */}
                  <div className="border-b border-slate-800 pb-3 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Subject:</p>
                    <p className="text-xs font-bold text-white truncate">{previewSubject}</p>
                  </div>

                  {/* Header Branding */}
                  <div className="text-center pt-2 pb-1">
                    <div className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white font-extrabold text-base shadow-md mb-2">
                      VF
                    </div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">{previewHeading}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{previewSubheading}</p>
                  </div>

                  {/* Inner Card */}
                  <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700/80 space-y-4">
                    <h3 className="text-sm font-bold text-slate-100">Hello Alex Vance</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {previewBody}
                    </p>

                    {/* Store Card Snapshot */}
                    <div className="bg-[#0f172a] p-3.5 rounded-lg border border-slate-700/60 space-y-1.5 text-xs">
                      <div className="text-[9px] font-extrabold text-teal-400 uppercase tracking-wider">
                        Workspace Overview
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Store Name:</span>
                        <strong className="text-white">GadgetHub Lagos</strong>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Plan:</span>
                        <strong className="text-emerald-400">14-Day Full Access Trial</strong>
                      </div>
                    </div>

                    {/* Features Checklist */}
                    <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                      <p className="font-bold text-slate-200">What you can do next:</p>
                      <p>• <strong className="text-white">Scan & Stock Inventory:</strong> Add IMEIs with duplicate check.</p>
                      <p>• <strong className="text-white">Express POS Checkout:</strong> Print or email digital thermal receipts.</p>
                      <p>• <strong className="text-white">Public Verification:</strong> Verified scannable QR badge.</p>
                    </div>

                    {/* Mock Button */}
                    <div className="text-center pt-2">
                      <span className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-extrabold text-xs shadow-lg uppercase tracking-wide cursor-default">
                        {previewCta}
                      </span>
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    © {new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SUPPORT & CONTACT                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'contact' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              Public Support & Alert Endpoints
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Support Desk Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Support Hotline Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Merchant WhatsApp Desk</label>
                <input
                  type="text"
                  value={supportWhatsApp}
                  onChange={(e) => setSupportWhatsApp(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PAYSTACK GATEWAY                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'paystack' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Paystack Production Gateway API Keys
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Public Key</label>
                <input
                  type="text"
                  value={paystackPublicKey}
                  onChange={(e) => setPaystackPublicKey(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Secret Key</label>
                <input
                  type="password"
                  value={paystackSecretKey}
                  onChange={(e) => setPaystackSecretKey(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Webhook Signing Secret</label>
                <input
                  type="password"
                  value={paystackWebhookSecret}
                  onChange={(e) => setPaystackWebhookSecret(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PLATFORM CONTROLS                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'platform' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Platform Controls & Public Access
            </h2>

            <div className="space-y-3">
              <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="pr-4">
                  <span className="font-bold text-xs text-slate-900 block">Allow New Store Registrations</span>
                  <span className="text-[11px] text-slate-500">Enable or freeze new merchant registrations on the public onboarding portal.</span>
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
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
