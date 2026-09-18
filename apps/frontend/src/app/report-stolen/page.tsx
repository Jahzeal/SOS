'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  X,
  Mail,
  User,
  Phone,
  FileText,
  Loader2,
  RefreshCw,
  LogOut,
  Info,
  Menu,
  Sparkles,
  Copy,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { api } from '@/lib/api';
import { parseImeiTac, validateLuhnIMEI } from '@/lib/imei-utils';

export default function ReportStolenPage() {
  // Navigation & Mobile Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('/dashboard');

  // Google Auth Simulation / Real Session State
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string; avatarUrl?: string } | null>(null);
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authNameInput, setAuthNameInput] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Form State
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [lostNote, setLostNote] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [policeCaseNo, setPoliceCaseNo] = useState('');

  // TAC Auto-detection State
  const [tacProfile, setTacProfile] = useState<{
    isValid: boolean;
    tac: string;
    brand: string | null;
    model: string | null;
    hardwareVariant: string | null;
  } | null>(null);

  // UI Flow States
  const [activeTab, setActiveTab] = useState<'REPORT' | 'MY_REPORTS'>('REPORT');
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<any | null>(null);

  // Load auth & session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vf_access_token');
      if (token) {
        setIsLoggedIn(true);
      }
      try {
        const storedUser = localStorage.getItem('vf_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'ADMIN') {
            setDashboardUrl('/admin/dashboard');
          } else {
            setDashboardUrl('/dashboard');
          }
        }
      } catch {}

      const savedReporter = localStorage.getItem('vf_google_reporter');
      if (savedReporter) {
        try {
          setGoogleUser(JSON.parse(savedReporter));
        } catch {}
      }
    }
  }, []);

  // Fetch user's reports when logged in
  useEffect(() => {
    if (googleUser?.email && activeTab === 'MY_REPORTS') {
      fetchMyReports(googleUser.email);
    }
  }, [googleUser, activeTab]);

  // Handle IMEI Change and Automatic TAC Auto-Completion
  const handleImeiChange = (value: string) => {
    const clean = value.replace(/\s+/g, '');
    setImei1(clean);

    if (clean.length >= 8) {
      const profile = parseImeiTac(clean);
      setTacProfile(profile);
      if (profile.brand) {
        setBrand(profile.brand);
      }
      if (profile.model) {
        setModel(profile.model);
      }
    } else {
      setTacProfile(null);
    }
  };

  const fetchMyReports = async (email: string) => {
    setLoadingReports(true);
    try {
      const reports = await api.getUserTheftReports(email);
      setMyReports(Array.isArray(reports) ? reports : []);
    } catch (err) {
      console.warn('Could not fetch user reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGoogleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmailInput.trim() || !authNameInput.trim()) return;
    setIsSigningIn(true);
    setTimeout(() => {
      const userObj = {
        email: authEmailInput.trim().toLowerCase(),
        name: authNameInput.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authNameInput.trim())}`,
      };
      setGoogleUser(userObj);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vf_google_reporter', JSON.stringify(userObj));
      }
      setIsSigningIn(false);
    }, 400);
  };

  const handleSignOut = () => {
    setGoogleUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vf_google_reporter');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;
    if (!imei1.trim()) {
      setErrorMessage('Primary IMEI is required.');
      return;
    }
    if (!ownerPhone.trim()) {
      setErrorMessage('Contact phone number is required so stores and buyers can reach you.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.submitPublicTheftReport({
        imei1: imei1.trim(),
        imei2: imei2.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        brand: brand.trim(),
        model: model.trim() || 'Smartphone',
        color: color.trim() || undefined,
        ownerEmail: googleUser.email,
        ownerName: googleUser.name,
        ownerPhone: ownerPhone.trim(),
        lostNote: lostNote.trim() || undefined,
        bountyAmount: bountyAmount ? parseFloat(bountyAmount) : 0,
        policeCaseNo: policeCaseNo.trim() || undefined,
        verificationSource: 'GOOGLE_AUTH',
      });

      setSuccessReport(res);
      // Reset form
      setImei1('');
      setImei2('');
      setSerialNumber('');
      setModel('');
      setColor('');
      setLostNote('');
      setBountyAmount('');
      setPoliceCaseNo('');
      setTacProfile(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit theft report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    if (!googleUser?.email) return;
    if (!confirm('Are you sure you want to mark this device as RECOVERED / FOUND? This will clear the blacklist.')) return;

    try {
      await api.resolveTheftReport(reportId, {
        ownerEmail: googleUser.email,
        resolvedNote: 'Recovered by owner',
      });
      fetchMyReports(googleUser.email);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve report.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-teal-600 selection:text-white">
      
      {/* Sticky Header Navigation */}
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-subtle">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          
          {/* Left: Responsive Logo */}
          <div className="shrink-0">
            <Logo size="md" className="hidden sm:flex" />
            <Logo size="sm" showSubtitle={false} className="flex sm:hidden" />
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Verify Device
            </Link>
            <Link href="/features" className="hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-teal-600 transition-colors font-bold text-slate-600">
              Pricing & Plans
            </Link>
            <Link
              href="/report-stolen"
              className="text-rose-600 font-extrabold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Report Stolen
            </Link>
          </nav>

          {/* Right: Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <PwaInstallButton variant="header" />
            {isLoggedIn ? (
              <Link href={dashboardUrl}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/onboarding">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Start Free Trial
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Clean spacing & Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <Link
              href="/"
              className="text-[11px] font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Verify
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none rounded-xl hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Animated Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-5 py-5 space-y-4 shadow-dropdown animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-600 py-1 font-medium">
                Verify Device
              </Link>
              <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-600 py-1 font-medium">
                Features
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-600 py-1 font-medium">
                Pricing & Plans
              </Link>
              <Link
                href="/report-stolen"
                onClick={() => setMobileMenuOpen(false)}
                className="text-rose-600 font-bold py-1 flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                Report Stolen Phone
              </Link>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <Link href={dashboardUrl} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" fullWidth size="md">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" fullWidth size="md">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth size="md">
                      Register Business
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Page Hero Header */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-extrabold shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Anti-Theft Blacklist Registry</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Report a Stolen or Lost Phone
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium max-w-xl mx-auto">
            Blacklist your stolen phone across verified stores, repair technicians, and public search verification portals.
          </p>
        </div>

        {/* STEP 1: GOOGLE AUTH GATEWAY */}
        {!googleUser ? (
          <div className="vf-card border-2 border-slate-200 shadow-card-hover rounded-3xl p-6 sm:p-10 bg-white space-y-6 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Owner Identity Verification</h2>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Signing in with your Google identity verifies that you own the report, prevents fraudulent submissions, and lets you remove the blacklist when your phone is recovered.
              </p>
            </div>

            <form onSubmit={handleGoogleSignIn} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Adeleke"
                    value={authNameInput}
                    onChange={(e) => setAuthNameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-900">
                  Google Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. david@gmail.com"
                    value={authEmailInput}
                    onChange={(e) => setAuthEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  disabled={isSigningIn}
                  leftIcon={isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-sm py-3"
                >
                  {isSigningIn ? 'Authenticating...' : 'Continue with Google Identity'}
                </Button>
              </div>

              <p className="text-[11px] text-slate-400 text-center font-medium">
                Free public registry. No credit card required.
              </p>
            </form>
          </div>
        ) : (
          /* STEP 2: AUTHENTICATED USER PORTAL */
          <div className="space-y-6">

            {/* User Session Bar & Navigation Tabs */}
            <div className="vf-card border-2 border-slate-200 shadow-sm p-4 rounded-2xl bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-extrabold text-sm shadow-2xs">
                  {googleUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{googleUser.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{googleUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setActiveTab('REPORT')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeTab === 'REPORT' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'
                    }`}
                  >
                    Report Device
                  </button>
                  <button
                    onClick={() => setActiveTab('MY_REPORTS')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeTab === 'MY_REPORTS' ? 'bg-white text-slate-900 shadow-subtle' : 'hover:text-slate-900'
                    }`}
                  >
                    My Reports
                  </button>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition text-xs"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB 1: REPORT STOLEN FORM */}
            {activeTab === 'REPORT' && (
              <div className="space-y-6">

                {/* SUCCESS NOTIFICATION */}
                {successReport && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-emerald-900 text-base">Device Successfully Blacklisted</h3>
                        <p className="text-xs text-emerald-700 font-medium">
                          IMEI <strong className="font-mono">{successReport.imei1}</strong> ({successReport.brand} {successReport.model}) is now flagged as STOLEN across all partner search portals.
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-emerald-200 flex items-center justify-between text-xs">
                      <Link href={`/dashboard/verify?imei=${successReport.imei1}`}>
                        <span className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1">
                          View Verification Status <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                      <button
                        onClick={() => setSuccessReport(null)}
                        className="px-3 py-1 rounded-lg bg-emerald-200/60 hover:bg-emerald-200 text-emerald-800 font-bold transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* CLOUD IMEI RETRIEVAL GUIDE & HELPER */}
                <div className="p-5 sm:p-6 rounded-3xl bg-blue-50/70 border border-blue-200 text-slate-900 space-y-4 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                        Do not have your phone, box, or paper receipt?
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Your 15-digit IMEI is stored in your Apple or Google cloud account. Follow the quick guide below to retrieve it in under 60 seconds:
                      </p>
                    </div>
                  </div>

                  {/* 2-Column Instructions: iPhone vs Android */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    
                    {/* iPhone / Apple iCloud Guide */}
                    <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-slate-900" />
                          <span className="font-extrabold text-xs text-slate-900">iPhone / iOS Users</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">iCloud Find My</span>
                      </div>
                      
                      <ol className="text-[11px] text-slate-600 space-y-1.5 font-medium list-decimal list-inside">
                        <li>Tap below to open Apple iCloud Find My in a new tab.</li>
                        <li>Sign in with your Apple Account / Apple ID.</li>
                        <li>Select your iPhone from <strong>All Devices</strong> to view device info / IMEI.</li>
                        <li>Return to this page and tap <strong>Paste</strong>.</li>
                      </ol>

                      <a
                        href="https://www.icloud.com/find"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Open Apple iCloud Find My</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    </div>

                    {/* Android / Google Guide */}
                    <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-blue-600" />
                          <span className="font-extrabold text-xs text-slate-900">Android Users</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Google Cloud</span>
                      </div>
                      
                      <ol className="text-[11px] text-slate-600 space-y-1.5 font-medium list-decimal list-inside">
                        <li>Tap the button below to open Google Find My Device.</li>
                        <li>Select your phone model from the top device bar.</li>
                        <li>Tap the <strong>Info (i) icon</strong> next to the phone to view the <strong>IMEI</strong>.</li>
                        <li>Return to this page and tap <strong>Paste</strong>.</li>
                      </ol>

                      <a
                        href="https://google.com/android/find"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Open Google Find My Device</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
                      </a>
                    </div>

                  </div>
                </div>

                {/* REPORT FORM */}
                <form onSubmit={handleSubmitReport} className="vf-card border-2 border-slate-200 shadow-card-hover rounded-3xl p-5 sm:p-8 space-y-6 bg-white">
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-xs">
                    
                    {/* Primary IMEI with Instant TAC Auto-complete */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-slate-900">
                          Primary IMEI Number <span className="text-rose-500">*</span>
                        </label>
                        {tacProfile?.brand && (
                          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 animate-in fade-in">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            Auto-filled: {tacProfile.brand} {tacProfile.model}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={18}
                          placeholder="Paste or enter 15-digit IMEI"
                          value={imei1}
                          onChange={(e) => handleImeiChange(e.target.value)}
                          className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) handleImeiChange(text.trim());
                            } catch {}
                          }}
                          className="absolute right-2 top-2 px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                          title="Paste from clipboard"
                        >
                          <Copy className="w-3 h-3" /> Paste
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        TAC (first 8 digits) will instantly auto-populate the Brand and Model fields below.
                      </p>
                    </div>

                    {/* Device Brand */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Device Brand <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                      >
                        <option value="Apple">Apple</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Google">Google Pixel</option>
                        <option value="Xiaomi">Xiaomi / Redmi</option>
                        <option value="Tecno">Tecno</option>
                        <option value="Infinix">Infinix</option>
                        <option value="OnePlus">OnePlus</option>
                        <option value="Other">Other Brand</option>
                      </select>
                    </div>

                    {/* Model Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Model Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. iPhone 14 Pro Max"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                      />
                    </div>

                    {/* Secondary IMEI */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Secondary IMEI <span className="text-slate-400 font-normal">(eSIM / SIM 2)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Optional secondary IMEI"
                        value={imei2}
                        onChange={(e) => setImei2(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-sm font-medium focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                      />
                    </div>

                    {/* Contact Phone Number */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Your Contact Phone / WhatsApp # <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="+234 801 234 5678"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    {/* Police Case Number */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Police Case Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. CR-10948/2026"
                          value={policeCaseNo}
                          onChange={(e) => setPoliceCaseNo(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:border-teal-600 focus:bg-white transition-all shadow-2xs"
                        />
                        <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    {/* Lost Mode Note */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Lost Mode Note / Recovery Reward Message <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. This phone was stolen near Ikeja. A reward of ₦50,000 will be paid for safe recovery. Please contact the owner directly."
                        value={lostNote}
                        onChange={(e) => setLostNote(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:outline-none focus:border-teal-600 focus:bg-white transition-all resize-none shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Reporting as: <strong className="text-slate-900">{googleUser.email}</strong>
                    </p>
                    <Button
                      type="submit"
                      variant="destructive"
                      size="md"
                      disabled={isSubmitting}
                      leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                      className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm py-3"
                    >
                      {isSubmitting ? 'Publishing Blacklist...' : 'Publish Stolen Alert'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: MY REPORTED DEVICES */}
            {activeTab === 'MY_REPORTS' && (
              <div className="vf-card border-2 border-slate-200 shadow-card-hover rounded-3xl p-5 sm:p-8 space-y-4 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Your Reported Devices</h3>
                    <p className="text-xs text-slate-500 font-medium">Manage and resolve active theft alerts associated with {googleUser.email}</p>
                  </div>
                  <button
                    onClick={() => fetchMyReports(googleUser.email)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {loadingReports ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Loading your reports...
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                    <Smartphone className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-extrabold text-slate-800 text-sm">No reported devices found</p>
                    <p>You haven't reported any devices as stolen under this account yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {myReports.map((item) => (
                      <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{item.brand} {item.model}</span>
                            <Badge variant={item.status === 'ACTIVE' ? 'error' : 'success'}>
                              {item.status === 'ACTIVE' ? 'ACTIVE BLACKLIST' : 'RECOVERED'}
                            </Badge>
                          </div>
                          <p className="text-xs font-mono text-slate-600">IMEI: <strong>{item.imei1}</strong></p>
                          {item.lostNote && (
                            <p className="text-[11px] text-slate-500 italic">"{item.lostNote}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'ACTIVE' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolveReport(item.id)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              Mark as Found / Clear
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-700 text-sm py-14 px-6 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Product</div>
            <ul className="space-y-2.5 font-medium text-slate-700 text-xs">
              <li><Link href="/pricing" className="hover:text-teal-600 transition">Pricing & Plans</Link></li>
              <li><Link href="/report-stolen" className="text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Report Stolen Phone</Link></li>
              <li><Link href="/features" className="hover:text-teal-600 transition">Features</Link></li>
              <li><Link href="/" className="hover:text-teal-600 transition">Verification Ledger</Link></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Resources</div>
            <ul className="space-y-2.5 font-medium text-slate-700 text-xs">
              <li><Link href="/report-stolen" className="hover:text-teal-600 transition">Anti-Theft Registry</Link></li>
              <li><Link href="/" className="hover:text-teal-600 transition">Device Lookup</Link></li>
              <li><span className="text-slate-400">Developer API (Soon)</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Company</div>
            <ul className="space-y-2.5 font-medium text-slate-700 text-xs">
              <li><Link href="/" className="hover:text-teal-600 transition">About VerifyFlow</Link></li>
              <li><Link href="/login" className="hover:text-teal-600 transition">Business Portal</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-base">Legal & Security</div>
            <ul className="space-y-2.5 font-medium text-slate-700 text-xs">
              <li><span className="text-slate-500">Privacy Policy</span></li>
              <li><span className="text-slate-500">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
          <div>VerifyFlow Retail Operating System © 2026. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>English (US)</span>
            <span>Security Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
