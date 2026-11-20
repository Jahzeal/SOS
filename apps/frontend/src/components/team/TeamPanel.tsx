'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, Info, Lock, Mail, Plus, RefreshCw, Trash2, Users, X } from 'lucide-react';
import { api } from '@/lib/api';
import { notify, confirmDialog } from '@/lib/feedback';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, StoreRole, storeRoleOf } from '@/lib/permissions';
import { Button } from '@/components/ui/Button';
import { Select, TextInput } from '@/components/ui/Input';

type Team = Awaited<ReturnType<typeof api.getTeam>>;

const ROLE_TONE: Record<StoreRole, string> = {
  OWNER: 'bg-slate-900 text-white border-slate-900',
  MANAGER: 'bg-accent-50 text-accent-800 border-accent-200',
  SALES: 'bg-success-50 text-success-800 border-success-200',
  TECHNICIAN: 'bg-warning-50 text-warning-800 border-warning-200',
};

function RoleBadge({ role }: { role: string }) {
  const r = (role || 'OWNER') as StoreRole;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold ${ROLE_TONE[r] || ROLE_TONE.SALES}`}>
      {ROLE_LABELS[r] || role}
    </span>
  );
}

const seatsText = (used: number, max: number) => (max === 0 ? `${used} staff accounts (no limit)` : `${used} of ${max} staff accounts used`);

/**
 * Settings → Users & Roles. Owners and managers invite staff, change their role or
 * branch, and switch accounts off. Everything is checked again on the server.
 */
export function TeamPanel() {
  const { user } = useAuthStore();
  const myRole = storeRoleOf(user);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', storeRole: '', branchId: '' });
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<{ email: string; link: string; emailSent: boolean; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setTeam(await api.getTeam());
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load your team.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Roles this person may give on this plan: managers can add sales staff and technicians only.
  const givableRoles = useMemo(() => {
    const planRoles = (team?.limits.assignableRoles || []) as StoreRole[];
    return planRoles.filter((r) => myRole === 'OWNER' || r === 'SALES' || r === 'TECHNICIAN');
  }, [team, myRole]);

  const openBranches = (team?.branches || []).filter((b) => b.isActive);
  const atSeatLimit = !!team && team.limits.maxStaff > 0 && team.seatsUsed >= team.limits.maxStaff;
  const planHasStaff = givableRoles.length > 0;

  const startInvite = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      storeRole: givableRoles.includes('SALES') ? 'SALES' : givableRoles[0] || '',
      branchId: openBranches.find((b) => b.isMain)?.id || openBranches[0]?.id || '',
    });
    setFormError(null);
    setShowInvite(true);
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) return setFormError('Please enter their first and last name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setFormError('Please enter a valid email address.');
    if (!form.storeRole) return setFormError('Please choose a role.');

    setSending(true);
    try {
      const res = await api.inviteStaff({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        storeRole: form.storeRole,
        branchId: form.branchId || null,
      });
      setLastInvite({ email: res.email, link: res.inviteLink, emailSent: res.emailSent, name: form.firstName.trim() });
      setShowInvite(false);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not send the invitation.');
    } finally {
      setSending(false);
    }
  };

  const changeMember = async (id: string, payload: { storeRole?: string; branchId?: string | null; isActive?: boolean }, confirmText?: string) => {
    if (confirmText && !(await confirmDialog(confirmText, { confirmLabel: 'Yes, continue' }))) return;
    setBusyId(id);
    try {
      await api.updateStaffMember(id, payload);
      await load();
    } catch (err: any) {
      notify(err?.message || 'Could not update this staff member.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteMember = async (m: { id: string; firstName: string; email: string }) => {
    const ok = await confirmDialog(
      `Delete ${m.firstName}'s account for good? Their login is removed and they can use ${m.email} to open their own store. Their sales and records stay in your store. This cannot be undone.`,
      { confirmLabel: 'Delete account', cancelLabel: 'Keep it' },
    );
    if (!ok) return;
    setBusyId(m.id);
    try {
      await api.deleteStaffMember(m.id);
      notify(`${m.firstName}'s account was deleted.`, 'success');
      await load();
    } catch (err: any) {
      notify(err?.message || 'Could not delete this staff member.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const cancelInvite = async (id: string, email: string) => {
    if (!(await confirmDialog(`Cancel the invitation for ${email}? The link they received will stop working.`, { confirmLabel: 'Cancel invitation', cancelLabel: 'Keep it' }))) return;
    setBusyId(id);
    try {
      await api.revokeStaffInvite(id);
      await load();
    } catch (err: any) {
      notify(err?.message || 'Could not cancel the invitation.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      notify('Invitation link copied.', 'success');
    } catch {
      notify('Could not copy. Select the link and copy it by hand.', 'error');
    }
  };

  if (loading) {
    return <div className="p-8 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500 text-center">Loading your team...</div>;
  }
  if (loadError || !team) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-sm text-center space-y-3">
        <p className="text-danger-600 font-semibold">{loadError || 'Could not load your team.'}</p>
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { setLoading(true); load(); }}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Plan allowance */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 text-accent-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Your team</h3>
            <p className="text-xs text-slate-500 font-medium">
              {team.limits.planName} plan • {seatsText(team.seatsUsed, team.limits.maxStaff)}
            </p>
          </div>
        </div>
        {team.canManage && planHasStaff && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={startInvite}
            disabled={atSeatLimit}
            title={atSeatLimit ? 'All staff accounts on your plan are in use' : undefined}
          >
            Add staff member
          </Button>
        )}
      </div>

      {/* Plan does not include staff, or all seats used */}
      {(!planHasStaff || atSeatLimit) && (
        <div className="p-4 rounded-2xl bg-accent-50 border border-accent-200/80 text-xs text-accent-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">
              {!planHasStaff
                ? myRole === 'OWNER'
                  ? `Your ${team.limits.planName} plan is for the owner only. Upgrade to Starter to add sales staff and technicians, or Gold to add managers.`
                  : 'Only the owner can add staff on this plan.'
                : `All ${team.limits.maxStaff} staff accounts on your ${team.limits.planName} plan are in use. Switch someone off or upgrade to add more.`}
            </span>
          </div>
          {myRole === 'OWNER' && (
            <Link href="/dashboard/subscription" className="shrink-0 text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 px-3 py-2 rounded-xl text-center">
              Upgrade plan
            </Link>
          )}
        </div>
      )}

      {/* Link from the invitation just sent */}
      {lastInvite && (
        <div className="p-4 rounded-2xl bg-success-50 border border-success-200 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-success-900 leading-relaxed">
              {lastInvite.emailSent
                ? `Invitation emailed to ${lastInvite.email}. You can also send them this link on WhatsApp:`
                : `We could not send the email, so send ${lastInvite.name} this link yourself (for example on WhatsApp):`}
            </p>
            <button type="button" onClick={() => setLastInvite(null)} aria-label="Close" className="text-success-700 hover:text-success-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly value={lastInvite.link} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 text-xs font-mono px-3 py-2 rounded-xl border border-success-200 bg-white text-slate-700" aria-label="Invitation link" />
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => copyLink(lastInvite.link)}>
                Copy
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hello ${lastInvite.name}, join our store on NoxGuarda: ${lastInvite.link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-bold"
              >
                Send on WhatsApp
              </a>
            </div>
          </div>
          <p className="text-xs text-success-800">The link works for 7 days and can be used once.</p>
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <form onSubmit={sendInvite} className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-accent-200 shadow-sm space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900">Add a staff member</h4>
            <button type="button" onClick={() => setShowInvite(false)} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="First name" value={form.firstName} maxLength={80} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="e.g. Amaka" />
            <TextInput label="Last name" value={form.lastName} maxLength={80} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="e.g. Okafor" />
            <div className="sm:col-span-2">
              <TextInput label="Their email address" type="email" value={form.email} maxLength={160} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="amaka@example.com" leftIcon={<Mail className="w-4 h-4" />} />
            </div>
            <div>
              <Select label="Role" value={form.storeRole} onChange={(e) => setForm({ ...form, storeRole: e.target.value })}>
                {givableRoles.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
              {form.storeRole && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ROLE_DESCRIPTIONS[form.storeRole as StoreRole]}</p>}
            </div>
            <Select label="Branch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {form.storeRole === 'MANAGER' && <option value="">All branches</option>}
              {openBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          {formError && <p role="alert" className="text-xs font-semibold text-danger-600">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={sending} leftIcon={<Mail className="w-4 h-4" />}>
              Send invitation
            </Button>
          </div>
        </form>
      )}

      {/* Members */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Staff accounts</div>
        <ul className="divide-y divide-slate-100">
          {team.members.map((m) => {
            const role = (m.storeRole || 'OWNER') as StoreRole;
            const isSelf = m.id === user?.id;
            const editable =
              team.canManage && role !== 'OWNER' && !isSelf && (myRole === 'OWNER' || role === 'SALES' || role === 'TECHNICIAN');
            const roleOptions = Array.from(new Set([role, ...givableRoles]));
            return (
              <li key={m.id} className={`p-4 flex flex-col lg:flex-row lg:items-center gap-3 ${m.isActive ? '' : 'bg-slate-50/70'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${m.isActive ? 'bg-accent-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {(m.firstName?.[0] || '') + (m.lastName?.[0] || '')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {m.firstName} {m.lastName}
                        {isSelf && <span className="text-slate-400 font-semibold"> (you)</span>}
                      </span>
                      <RoleBadge role={role} />
                      {!m.isActive && <span className="text-xs font-bold text-slate-500">Switched off</span>}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {m.email} • {m.branch?.name || 'All branches'}
                    </div>
                  </div>
                </div>

                {editable && (
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <div className="w-36">
                    <Select
                      aria-label={`Role for ${m.firstName}`}
                      value={role}
                      disabled={busyId === m.id || !m.isActive}
                      onChange={(e) => changeMember(m.id, { storeRole: e.target.value })}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </Select>
                    </div>
                    <div className="w-40">
                    <Select
                      aria-label={`Branch for ${m.firstName}`}
                      value={m.branch?.id || ''}
                      disabled={busyId === m.id || !m.isActive}
                      onChange={(e) => changeMember(m.id, { branchId: e.target.value || null })}
                    >
                      {role === 'MANAGER' && <option value="">All branches</option>}
                      {openBranches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </Select>
                    </div>
                    <Button
                      variant={m.isActive ? 'dangerOutline' : 'secondary'}
                      size="sm"
                      disabled={busyId === m.id}
                      onClick={() =>
                        changeMember(
                          m.id,
                          { isActive: !m.isActive },
                          m.isActive
                            ? `Switch off ${m.firstName}'s account? They will be signed out and cannot sign in. Their sales and records stay.`
                            : undefined,
                        )
                      }
                    >
                      {m.isActive ? 'Switch off' : 'Switch on'}
                    </Button>
                    <Button
                      variant="dangerOutline"
                      size="sm"
                      disabled={busyId === m.id}
                      onClick={() => deleteMember(m)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pending invitations */}
      {team.invites.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Waiting to join</div>
          <ul className="divide-y divide-slate-100">
            {team.invites.map((inv) => (
              <li key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{inv.firstName} {inv.lastName}</span>
                    <RoleBadge role={inv.storeRole} />
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {inv.email} • {inv.branch?.name || 'All branches'} • link works until{' '}
                    {new Date(inv.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {team.canManage && (
                  <Button variant="ghost" size="sm" disabled={busyId === inv.id} onClick={() => cancelInvite(inv.id, inv.email)}>
                    Cancel invitation
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What each role can do */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
          <Info className="w-4 h-4 text-accent-600" /> What each role can do
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['OWNER', 'MANAGER', 'SALES', 'TECHNICIAN'] as StoreRole[]).map((r) => (
            <li key={r} className="text-xs text-slate-600 leading-relaxed">
              <RoleBadge role={r} /> <span className="ml-1">{ROLE_DESCRIPTIONS[r]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
