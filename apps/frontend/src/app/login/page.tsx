'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { WatermarkBackground } from '@/components/brand/WatermarkBackground';

function SessionExpiredAlert() {
  const searchParams = useSearchParams();
  const isExpired = searchParams ? searchParams.get('expired') === 'true' : false;

  if (!isExpired) return null;

  return (
    <div className="p-3.5 rounded-control bg-warning-50 border border-warning-200 text-warning-900 text-xs flex items-start gap-2.5 shadow-sm">
      <AlertCircle className="w-4 h-4 text-warning-600 shrink-0 mt-0.5" />
      <div className="font-medium">Your session has expired or is invalid. Please sign in again to access your workspace.</div>
    </div>
  );
}

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
      const targetRoute = data.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (result: {
    credential: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.googleAuth({
        credential: result.credential,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      });

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
      // No account yet for this Google address: signing up requires choosing a plan.
      if (err?.code === 'PLAN_REQUIRED') {
        router.push('/onboarding');
        return;
      }
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-accent-600 selection:text-white relative font-sans overflow-hidden">
      <WatermarkBackground size="hero" opacity="opacity-[0.035]" />


      {/* Header Navigation */}
      <header className="px-4 sm:px-6 xl:px-12 py-3.5 sm:py-4 xl:py-5 flex items-center justify-between border-b border-slate-200 bg-white shadow-subtle z-10 gap-2">
        <Logo size="md" />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <PwaInstallButton variant="header" />
          
          <div className="hidden sm:flex items-center gap-2 text-xs xl:text-sm font-semibold">
            <span className="text-slate-500">No store account?</span>
            <Link href="/onboarding">
              <Button variant="secondary" size="sm">
                Get started →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 xl:py-16 z-10">
        <div className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl space-y-6 xl:space-y-8">
          
          {/* Card Header */}
          <div className="text-center space-y-2 xl:space-y-3">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm xl:text-base text-slate-500 max-w-sm xl:max-w-md mx-auto font-medium">
              Access your inventory, phone IMEI registry, thermal receipts, and real-time sales ledger.
            </p>
          </div>

          {/* White Form Card */}
          <div className="bg-white border border-slate-200 rounded-card p-6 sm:p-8 xl:p-10 shadow-xl space-y-5 xl:space-y-6">
            <Suspense fallback={null}>
              <SessionExpiredAlert />
            </Suspense>

            {error && (
              <div className="p-3.5 rounded-control bg-danger-50 border border-danger-200 text-danger-700 text-xs xl:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 xl:w-5 xl:h-5 text-danger-600 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            {/* Google Sign In Button */}
            <GoogleAuthButton
              mode="signin"
              disabled={loading}
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError(err)}
            />

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                or sign in with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 xl:space-y-5 text-xs xl:text-sm">
              <TextInput
                label="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@store.com"
                required
                disabled={loading}
                leftIcon={<Mail className="w-4 h-4" />}
                className="py-2.5"
              />

              <TextInput
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={loading}
                leftIcon={<Lock className="w-4 h-4" />}
                className="py-2.5"
                labelAction={
                  <Link href="/forgot-password" className="text-xs text-accent-600 font-bold hover:underline">
                    Forgot password?
                  </Link>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="mt-2 text-sm"
              >
                {loading ? 'Signing In...' : 'Sign In to Workspace'}
              </Button>

              {/* Mobile & Card Registration Link */}
              <div className="pt-3 border-t border-slate-100 text-center text-xs xl:text-sm">
                <span className="text-slate-500 font-medium">Don't have a store account? </span>
                <Link href="/onboarding" className="text-accent-600 font-bold hover:underline block sm:inline mt-1 sm:mt-0">
                  Create a business account →
                </Link>
              </div>
            </form>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 xl:py-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} NoxGuarda Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
}
