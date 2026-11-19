'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Megaphone, Plus, RefreshCw, X } from 'lucide-react';
import { api } from '@/lib/api';
import { InviteLinkNotice, MarketerStatusBadge } from '@/components/marketers/MarketerBits';

export default function AdminMarketersPage() {
  const [marketers, setMarketers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{ email: string; inviteLink: string; emailSent: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setMarketers((await api.adminListMarketers()) || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load marketers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      return setFormError('Enter their first name, last name and email.');
    }
    setSaving(true);
    try {
      const res = await api.adminCreateMarketer({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      });
      setLastInvite(res);
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
      load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not add this marketer.');
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; type?: string; placeholder: string; optional?: boolean }[] = [
    { key: 'firstName', label: 'First name', placeholder: 'Tobi' },
    { key: 'lastName', label: 'Last name', placeholder: 'Adeyemi' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'tobi@gmail.com' },
    { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '0803 000 0000', optional: true },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans w-full min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Marketers</h1>
          <p className="text-sm text-slate-500 mt-1">
            People who show NoxGuarda to businesses. Each one gets a free store on Gold to demo with, and lists the businesses they onboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            aria-label="Refresh"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setShowAdd(true);
              setFormError(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-bold hover:bg-accent-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add marketer
          </button>
        </div>
      </div>

      {lastInvite && <InviteLinkNotice invite={lastInvite} onClose={() => setLastInvite(null)} />}

      {showAdd && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">Add a marketer</h2>
            <button type="button" onClick={() => setShowAdd(false)} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`mk-${f.key}`} className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
                <input
                  id={`mk-${f.key}`}
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            They get an email with a link to choose a password. Use an email that has never been used on NoxGuarda.
          </p>
          {formError && <p role="alert" className="text-xs font-semibold text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-bold hover:bg-accent-700 disabled:opacity-60 cursor-pointer">
              {saving ? 'Sending...' : 'Send invite'}
            </button>
          </div>
        </form>
      )}

      {loadError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{loadError}</div>}

      {!loading && !loadError && marketers.length === 0 ? (
        <div className="py-14 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500">No marketers yet. Add your first one.</p>
        </div>
      ) : (
        <>
          {/* Phones: cards */}
          <div className="md:hidden space-y-3">
            {marketers.map((m) => (
              <Link
                key={m.id}
                href={`/admin/marketers/${m.id}`}
                className="block bg-white border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-accent-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">{m.firstName} {m.lastName}</div>
                    <div className="text-xs text-slate-500 break-all">{m.email}</div>
                    {m.phone && <div className="text-xs text-slate-500">{m.phone}</div>}
                  </div>
                  <MarketerStatusBadge status={m.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Added', m.counts.added],
                    ['Signed up', m.counts.signedUp],
                    ['Paid', m.counts.paid],
                  ].map(([l, v]) => (
                    <div key={l as string} className="bg-slate-50 rounded-xl py-2">
                      <div className="font-extrabold text-slate-900">{v}</div>
                      <div className="text-[11px] text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
            {loading && marketers.length === 0 && <div className="py-10 text-center text-xs text-slate-400">Loading marketers...</div>}
          </div>

          {/* Bigger screens: table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold">Marketer</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Added</th>
                  <th className="px-4 py-3 font-semibold text-center">Signed up</th>
                  <th className="px-4 py-3 font-semibold text-center">Paid</th>
                  <th className="px-4 py-3 font-semibold">Since</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marketers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/marketers/${m.id}`} className="font-extrabold text-slate-900 hover:text-accent-700">
                        {m.firstName} {m.lastName}
                      </Link>
                      <div className="text-xs text-slate-500">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
                    </td>
                    <td className="px-4 py-3.5"><MarketerStatusBadge status={m.status} /></td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-900">{m.counts.added}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-amber-700">{m.counts.signedUp}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{m.counts.paid}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/admin/marketers/${m.id}`} aria-label={`Open ${m.firstName}`} className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-accent-700 hover:bg-accent-50">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {loading && marketers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-400">Loading marketers...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
