'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Eye, EyeOff, Loader2, Lock, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { saveSession } from '@/lib/session';

type Invite = Awaited<ReturnType<typeof api.describeMarketerInvite>>;

/** A new marketer opens the link from their email, chooses a password and gets their Gold store. */
function JoinForm() {
  const token = useSearchParams()?.get('token') || '';
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(token ? null : 'This link is not complete. Open the link from your email again.');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .describeMarketerInvite(token)
      .then((inv) => {
        setInvite(inv);
        setStoreName(`${inv.firstName}'s Store`);
      })
      .catch((err: any) => setLoadError(err?.message || 'This link is not valid.'));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Your password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setJoining(true);
    try {
      const res = await api.acceptMarketerInvite(token, password, storeName.trim() || undefined);
      saveSession(res);
      // Full page load so every part of the app starts with the new account.
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.message || 'Could not set up your account. Please try again.');
      setJoining(false);
    }
  };

  if (loadError) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-danger-50 text-danger-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">This link cannot be used</h1>
        <p className="text-sm text-slate-600">{loadError}</p>
        <Link href="/login" className="inline-block text-sm font-bold text-accent-700 hover:underline">Go to sign in</Link>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Opening your link...
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-accent-50 border border-accent-200 text-accent-700 flex items-center justify-center mx-auto">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Welcome, {invite.firstName}</h1>
        <p className="text-sm text-slate-600">
          You are now a NoxGuarda marketer. You get your own store on the <strong>Gold plan</strong>, free, to show businesses how NoxGuarda works.
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        You will sign in with <strong className="text-slate-900">{invite.email}</strong>
      </div>

      <div>
        <label htmlFor="join-store" className="block text-xs font-bold text-slate-700 mb-1">Store name</label>
        <input
          id="join-store"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          maxLength={80}
          className="w-full text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20"
        />
        <p className="text-[11px] text-slate-500 mt-1">Shown on the receipts you print during demos. You can change it later in Settings.</p>
      </div>

      {[
        { id: 'join-password', label: 'Choose a password', value: password, set: setPassword },
        { id: 'join-confirm', label: 'Type it again', value: confirm, set: setConfirm },
      ].map((f) => (
        <div key={f.id}>
          <label htmlFor={f.id} className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
          <div className="relative">
            <input
              id={f.id}
              type={show ? 'text' : 'password'}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full text-sm pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}

      {error && <p role="alert" className="text-xs font-semibold text-danger-600">{error}</p>}

      <Button type="submit" variant="primary" fullWidth isLoading={joining}>
        Open my store
      </Button>
      <p className="text-xs text-slate-500 text-center">
        By continuing you agree to the <Link href="/terms" className="font-semibold text-accent-700 underline">Terms</Link> and{' '}
        <Link href="/privacy" className="font-semibold text-accent-700 underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}

export default function MarketerJoinPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center">
        <Logo size="md" />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
          <Suspense fallback={null}>
            <JoinForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
