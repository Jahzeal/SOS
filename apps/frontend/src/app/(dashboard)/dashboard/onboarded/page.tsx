'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { ReferralCounts, ReferralStatusBadge } from '@/components/marketers/ReferralStatus';

/**
 * Marketers only: the businesses they onboarded, by the owner's email. When that
 * business signs up on NoxGuarda with the same email, its status updates here.
 */
export default function OnboardedBusinessesPage() {
  const user = useAuthStore((s) => s.user) as any;
  const isMarketer = !!user?.business?.isMarketerStore;

  const [data, setData] = useState<{ counts: { added: number; signedUp: number; paid: number }; referrals: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', shopName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getMyOnboardedBusinesses());
      setLoadError(null);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your businesses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMarketer) load();
    else setLoading(false);
  }, [isMarketer, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setFormError("Enter the business owner's email address.");
    setSaving(true);
    try {
      const r = await api.addOnboardedBusiness({
        email: form.email.trim(),
        shopName: form.shopName.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      setAdded(r?.shopName || r?.email || form.email.trim());
      setForm({ email: '', shopName: '', phone: '' });
      setShowAdd(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not add this business.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: any) => {
    if (!confirm(`Remove ${r.shopName || r.email} from your list?`)) return;
    try {
      await api.removeOnboardedBusiness(r.id);
      load();
    } catch (err: any) {
      alert(err?.message || 'Could not remove it.');
    }
  };

  if (!isMarketer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-2">
        <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm text-slate-500">This page is only for NoxGuarda marketers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 w-full min-w-0 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Onboarded Businesses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add the email of each business owner you onboard. When they sign up on NoxGuarda with that email, you will see it here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} aria-label="Refresh" className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setShowAdd(true);
              setFormError(null);
              setAdded(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-bold hover:bg-accent-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add new business
          </button>
        </div>
      </div>

      {added && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-start justify-between gap-3">
          <span><strong>{added}</strong> was added to your list.</span>
          <button onClick={() => setAdded(null)} aria-label="Close" className="text-emerald-700 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">Add a business</h2>
            <button type="button" onClick={() => setShowAdd(false)} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'email', label: "Owner's email", type: 'email', placeholder: 'adaphones@gmail.com' },
              { key: 'shopName', label: 'Shop name (optional)', type: 'text', placeholder: 'Ada Phones' },
              { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '0803 000 0000' },
            ].map((f) => (
              <div key={f.key}>
                <label htmlFor={`ob-${f.key}`} className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
                <input
                  id={`ob-${f.key}`}
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Use the same email the owner signs up with (their Gmail if they use Google sign-in).
          </p>
          {formError && <p role="alert" className="text-xs font-semibold text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-accent-600 text-white text-sm font-bold hover:bg-accent-700 disabled:opacity-60 cursor-pointer">
              {saving ? 'Adding...' : 'Add business'}
            </button>
          </div>
        </form>
      )}

      {loadError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{loadError}</div>}

      {data && <ReferralCounts counts={data.counts} />}

      {data && data.referrals.length === 0 && (
        <div className="py-14 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500">No businesses yet. Tap “Add new business” after you onboard one.</p>
        </div>
      )}

      {data && data.referrals.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {data.referrals.map((r) => (
            <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate">{r.storeName || r.shopName || r.email}</div>
                <div className="text-xs text-slate-500 break-all">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                <div className="text-[11px] text-slate-400">
                  Added {new Date(r.addedAt).toLocaleDateString()}
                  {r.signedUpAt ? ` · Signed up ${new Date(r.signedUpAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ReferralStatusBadge status={r.status} planName={r.planName} />
                {(r.status === 'NOT_SIGNED_UP' || r.status === 'ALREADY_CUSTOMER') && (
                  <button
                    onClick={() => remove(r)}
                    aria-label={`Remove ${r.email}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && !data && <div className="py-10 text-center text-xs text-slate-400">Loading...</div>}
    </div>
  );
}
