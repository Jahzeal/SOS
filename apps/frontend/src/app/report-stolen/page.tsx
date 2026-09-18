'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Smartphone,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  Copy,
  Mail,
  User,
  Phone,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  LogOut,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ReportStolenPage() {
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

  // UI Flow States
  const [activeTab, setActiveTab] = useState<'REPORT' | 'MY_REPORTS'>('REPORT');
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReport, setSuccessReport] = useState<any | null>(null);

  // Load saved Google session from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('vf_google_reporter');
      if (savedUser) {
        try {
          setGoogleUser(JSON.parse(savedUser));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white pb-20">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-extrabold shadow-lg shadow-rose-600/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">VerifyFlow</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Anti-Theft Registry
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition">
              Public Search & Scanner
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Business Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Page Hero Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Global Device Blacklist & Lost Mode Network</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Report a Stolen or Lost Phone
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            Lock your stolen device's IMEI across thousands of verified retail shops, buyback stores, technicians, and public search engines.
          </p>
        </div>

        {/* GOOGLE AUTH GATEWAY */}
        {!googleUser ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-lg">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Owner Identity Verification</h2>
              <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                Sign in with your Google account to ensure accountability, prevent anonymous spam, and manage your reported devices.
              </p>
            </div>

            <form onSubmit={handleGoogleSignIn} className="space-y-3.5 text-left max-w-sm mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Adeleke"
                  value={authNameInput}
                  onChange={(e) => setAuthNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. david@gmail.com"
                  value={authEmailInput}
                  onChange={(e) => setAuthEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
              >
                {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <Lock className="w-4 h-4 text-slate-900" />}
                Continue with Google Identity
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED USER PORTAL */
          <div className="space-y-6">

            {/* User Session Bar & Navigation Tabs */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-sm">
                  {googleUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">{googleUser.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{googleUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('REPORT')}
                    className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'REPORT' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Report Device
                  </button>
                  <button
                    onClick={() => setActiveTab('MY_REPORTS')}
                    className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'MY_REPORTS' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    My Reports
                  </button>
                </div>

                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition text-xs"
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
                  <div className="p-6 rounded-3xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <h3 className="font-extrabold text-white text-base">Device Successfully Blacklisted</h3>
                        <p className="text-xs text-emerald-300">
                          IMEI <strong>{successReport.imei1}</strong> ({successReport.brand} {successReport.model}) is now flagged as STOLEN across all partner search portals.
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                      <Link href={`/verify?imei=${successReport.imei1}`}>
                        <span className="text-emerald-300 hover:underline font-bold flex items-center gap-1">
                          View Live Verification Status <ExternalLink className="w-3 h-3" />
                        </span>
                      </Link>
                      <button
                        onClick={() => setSuccessReport(null)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* HELPER BOX: GOOGLE FIND MY DEVICE & APPLE ID */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Info className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-white text-xs sm:text-sm">Don't have your phone box or paper receipt?</h4>
                      <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-medium">
                        Your IMEI is saved in the cloud. Click below to open your device manager in a new tab, copy the IMEI, and paste it here:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1 pl-0 sm:pl-12">
                    <a
                      href="https://google.com/android/find"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
                    >
                      <span>🔍 Open Google Find My Device (Android)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://appleid.apple.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
                    >
                      <span>🍏 Open Apple ID Devices (iPhone)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* REPORT FORM */}
                <form onSubmit={handleSubmitReport} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Primary IMEI Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="15-digit IMEI (dial *#06# or copy from cloud)"
                        value={imei1}
                        onChange={(e) => setImei1(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Secondary IMEI (eSIM / SIM 2)</label>
                      <input
                        type="text"
                        placeholder="Optional secondary IMEI"
                        value={imei2}
                        onChange={(e) => setImei2(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl font-mono text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Device Brand</label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500"
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

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Model Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. iPhone 14 Pro Max / Galaxy S23"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Your Contact Phone / WhatsApp # *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +234 801 234 5678"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-bold placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Shops who scan your phone will be able to call/WhatsApp this number.</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Police Case Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. CR-10948/2026"
                        value={policeCaseNo}
                        onChange={(e) => setPoliceCaseNo(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-300 mb-1">
                        Lost Mode Note / Recovery Reward Message
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. This phone was stolen in Ikeja on Friday. A reward of $100/₦150,000 will be paid to any technician or shop that facilitates its safe return. Please do not service or buy."
                        value={lostNote}
                        onChange={(e) => setLostNote(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Logged in as: <strong>{googleUser.email}</strong>
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                      Publish Stolen Alert & Blacklist
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: MY REPORTED DEVICES */}
            {activeTab === 'MY_REPORTS' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">Your Reported Devices</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage and resolve active theft alerts associated with {googleUser.email}</p>
                  </div>
                  <button
                    onClick={() => fetchMyReports(googleUser.email)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {loadingReports ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading your reports...
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <Smartphone className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="font-bold text-white">No reported devices found</p>
                    <p>You haven't reported any devices as stolen under this account yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {myReports.map((item) => (
                      <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">{item.brand} {item.model}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${item.status === 'ACTIVE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                              {item.status === 'ACTIVE' ? 'ACTIVE BLACKLIST' : 'RECOVERED'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-400">IMEI: <strong>{item.imei1}</strong></p>
                          {item.lostNote && (
                            <p className="text-[11px] text-slate-300 italic">"{item.lostNote}"</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleResolveReport(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Found / Clear Blacklist
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-bold">Resolved</span>
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
    </div>
  );
}
