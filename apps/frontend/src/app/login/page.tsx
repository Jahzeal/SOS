'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      
      // Cache token & user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('vf_access_token', data.accessToken);
        localStorage.setItem('vf_user', JSON.stringify(data.user));
      }

      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('owner@retailer.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorator Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Navigation */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center font-extrabold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            VF
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight">VerifyFlow</span>
            <span className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">Enterprise OS</span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-slate-400 hidden sm:inline">Don't have a store account?</span>
          <Link href="/onboarding">
            <Button variant="secondary" size="sm" className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800">
              Register Business →
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> SECURE STORE PORTAL
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Access your inventory, phone IMEI registry, thermal receipts, and real-time sales ledger.
            </p>
          </div>

          {/* Form Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-xl">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Store Email */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">Store Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs pl-9 focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-600 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-300">Password</label>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Please contact store administrator to reset credentials.'); }} className="text-[11px] text-blue-400 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs pl-9 focus:outline-none focus:border-blue-500 font-medium placeholder:text-slate-600 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full py-2.5 font-bold text-xs bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-none shadow-lg shadow-blue-500/25 mt-2"
              >
                {loading ? 'Authenticating Store Session...' : 'Sign In to Dashboard →'}
              </Button>
            </form>

            {/* Quick Demo Fill Button */}
            <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
              <span className="text-[11px] text-slate-500 font-medium">Testing or exploring?</span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/60 transition flex items-center justify-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                Fill Demo Credentials (owner@retailer.com)
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> 256-Bit SSL Encrypted</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-400" /> Live Database Sync</span>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-600 border-t border-slate-900 bg-slate-950">
        © {new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
      </footer>
    </div>
  );
}
