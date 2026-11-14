'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Lock, MapPin, Pencil, Phone, Plus, RefreshCw, X } from 'lucide-react';
import { api } from '@/lib/api';
import { notify, confirmDialog } from '@/lib/feedback';
import { useAuthStore } from '@/store/useAuthStore';
import { can } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Input';

type Team = Awaited<ReturnType<typeof api.getTeam>>;
type Branch = Team['branches'][number];

const emptyForm = { name: '', address: '', phone: '' };

/**
 * Settings → Branches. Only the owner adds, renames or closes branches; managers
 * can see them. The number of open branches is limited by the plan.
 */
export function BranchesPanel() {
  const { user } = useAuthStore();
  const isOwner = can(user, 'manageBranches');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Branch | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setTeam(await api.getTeam());
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your branches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="p-8 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500 text-center">Loading branches...</div>;
  }
  if (loadError || !team) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-center space-y-3">
        <p className="text-danger-600 font-semibold">{loadError || 'Could not load your branches.'}</p>
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); load(); }}>
          Try again
        </Button>
      </div>
    );
  }

  const { maxBranches, planName } = team.limits;
  const atLimit = maxBranches > 0 && team.branchesUsed >= maxBranches;
  const staffIn = (branchId: string) => team.members.filter((m) => m.isActive && m.branch?.id === branchId).length;

  const openForm = (b: Branch | 'new') => {
    setEditing(b);
    setForm(b === 'new' ? emptyForm : { name: b.name, address: b.address || '', phone: b.phone || '' });
    setFormError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('Please enter a branch name.');
    setSaving(true);
    setFormError(null);
    try {
      const payload = { name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim() };
      if (editing === 'new') await api.createBranch(payload);
      else if (editing) await api.updateBranch(editing.id, payload);
      setEditing(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not save the branch.');
    } finally {
      setSaving(false);
    }
  };

  const toggleOpen = async (b: Branch) => {
    if (b.isActive && !(await confirmDialog(`Close ${b.name}? Its records stay, but no new sales or stock can be filed there.`, { confirmLabel: 'Close branch' }))) return;
    try {
      await api.updateBranch(b.id, { isActive: !b.isActive });
      await load();
    } catch (err: any) {
      notify(err?.message || 'Could not update the branch.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 text-accent-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Branches</h3>
            <p className="text-xs text-slate-500 font-medium">
              {planName} plan • {maxBranches === 0 ? `${team.branchesUsed} open (no limit)` : `${team.branchesUsed} of ${maxBranches} open`}
            </p>
          </div>
        </div>
        {isOwner && (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openForm('new')} disabled={atLimit}>
            Add branch
          </Button>
        )}
      </div>

      {isOwner && atLimit && (
        <div className="p-4 rounded-2xl bg-accent-50 border border-accent-200/80 text-xs text-accent-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              Your {planName} plan allows {maxBranches} branch{maxBranches === 1 ? '' : 'es'}. Upgrade to Gold for a second branch, or Enterprise for as many as you need.
            </span>
          </div>
          <Link href="/dashboard/subscription" className="shrink-0 text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 px-3 py-2 rounded-xl text-center">
            Upgrade plan
          </Link>
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-accent-200 shadow-sm space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900">{editing === 'new' ? 'Add a branch' : `Edit ${editing.name}`}</h4>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="Branch name" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lekki branch" />
            <TextInput label="Phone (optional)" value={form.phone} maxLength={30} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0803 000 0000" />
            <div className="sm:col-span-2">
              <TextInput label="Address (optional)" value={form.address} maxLength={200} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 12 Admiralty Way, Lekki" />
            </div>
          </div>
          {formError && <p role="alert" className="text-xs font-semibold text-danger-600">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>Save branch</Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.branches.map((b) => (
          <div key={b.id} className={`p-4 sm:p-5 rounded-2xl border shadow-sm space-y-3 ${b.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200/70'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 truncate">{b.name}</span>
                  {b.isMain && <span className="px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 text-xs font-bold">Main</span>}
                  {!b.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">Closed</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{staffIn(b.id)} staff working here</p>
              </div>
              {isOwner && (
                <button type="button" onClick={() => openForm(b)} aria-label={`Edit ${b.name}`} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {b.address || 'No address added'}</div>
              <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {b.phone || 'No phone added'}</div>
            </div>
            {isOwner && !b.isMain && (
              <div className="pt-2 border-t border-slate-100">
                <Button variant={b.isActive ? 'ghostDanger' : 'secondary'} size="sm" onClick={() => toggleOpen(b)}>
                  {b.isActive ? 'Close branch' : 'Reopen branch'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
