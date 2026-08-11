'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative font-sans">
      {/* Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-subtle z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold shadow-md">
            VF
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight leading-none block">VerifyFlow</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Enterprise OS</span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="text-slate-500 hidden sm:inline">Don't have a store account?</span>
          <Link href="/onboarding">
            <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 font-bold">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
              Access your inventory, phone IMEI registry, thermal receipts, and real-time sales ledger.
            </p>
          </div>

          {/* White Form Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Store Email */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Store Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs pl-9 focus:outline-none focus:border-blue-600 focus:bg-white font-medium placeholder:text-slate-400 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">Password</label>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Please contact store administrator to reset credentials.'); }} className="text-[11px] text-blue-600 font-bold hover:underline">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs pl-9 focus:outline-none focus:border-blue-600 focus:bg-white font-medium placeholder:text-slate-400 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full py-2.5 font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border-none shadow-md mt-2"
              >
                {loading ? 'Authenticating Store Session...' : 'Sign In to Dashboard →'}
              </Button>
            </form>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
      </footer>
    </div>
  );
}
