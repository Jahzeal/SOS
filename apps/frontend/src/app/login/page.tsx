'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function SessionExpiredAlert() {
  const searchParams = useSearchParams();
  const isExpired = searchParams ? searchParams.get('expired') === 'true' : false;

  if (!isExpired) return null;

  return (
    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="font-medium">Your session has expired or is invalid. Please sign in again to access your workspace.</div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      const targetRoute = data.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError(null);
    // Trigger Google OAuth flow or notification
    setTimeout(() => {
      setGoogleLoading(false);
      setError('Google Sign-In integration initialized. To complete authorization, connect Google Client ID in Admin Settings.');
    }, 600);
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
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Enterprise OS</span>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
          <span className="text-slate-500">Don't have a store account?</span>
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
            <Suspense fallback={null}>
              <SessionExpiredAlert />
            </Suspense>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl px-4 text-xs font-bold flex items-center justify-center gap-3 transition shadow-xs hover:border-slate-400 disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                or sign in with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Store Email */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs pl-9 focus:outline-none focus:border-teal-600 focus:bg-white font-medium placeholder:text-slate-400 transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">Password</label>
                  <Link href="/forgot-password" className="text-[11px] text-teal-600 font-bold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs pl-9 pr-10 focus:outline-none focus:border-teal-600 focus:bg-white font-medium placeholder:text-slate-400 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition p-0.5 rounded focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
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
                {loading ? 'Authenticating Session...' : 'Sign In to Workspace →'}
              </Button>

              {/* Mobile & Card Registration Link */}
              <div className="pt-3 border-t border-slate-100 text-center text-xs">
                <span className="text-slate-500 font-medium">Don't have a store account? </span>
                <Link href="/onboarding" className="text-teal-600 font-bold hover:underline block sm:inline mt-1 sm:mt-0">
                  Create a business account →
                </Link>
              </div>
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
