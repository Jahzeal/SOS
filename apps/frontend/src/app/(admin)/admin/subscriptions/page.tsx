'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Building2,
  RefreshCw,
  MoreVertical,
  Plus,
  CreditCard,
  Layers,
  Settings,
  Edit2,
  Trash2,
  Check,
  X,
  Shield,
  Zap,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalSubscribers: 0,
    activeMRR: 0,
    projectedARR: 0,
    averageRevenuePerUser: 0,
    tierCounts: {} as Record<string, number>,
    tierPricing: {} as Record<string, number>,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');

  // Modal State for Plan Creation / Editing
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    description: '',
    monthlyPriceNgn: 15000,
    annualPriceNgn: 150000,
    maxDevices: 100,
    customBranding: false,
    prioritySupport: false,
    isActive: true,
    isPublic: true,
  });
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchSubscriptionsAndPlans = async () => {
    setLoading(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        api.adminGetSubscriptions(),
        api.adminGetPlans(),
      ]);

      if (subsRes?.success) {
        setSubscribers(subsRes.data || []);
        if (subsRes.summary) {
          setSummary(subsRes.summary);
        }
      }

      if (plansRes?.success && Array.isArray(plansRes.plans)) {
        setDbPlans(plansRes.plans);
      }
    } catch (err) {
      console.error('Failed to load subscriptions & plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionsAndPlans();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      code: '',
      description: '',
      monthlyPriceNgn: 25000,
      annualPriceNgn: 250000,
      maxDevices: 500,
      customBranding: true,
      prioritySupport: false,
      isActive: true,
      isPublic: true,
    });
    setShowPlanModal(true);
  };

  const handleOpenEditModal = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      monthlyPriceNgn: plan.monthlyPriceNgn,
      annualPriceNgn: plan.annualPriceNgn || plan.monthlyPriceNgn * 10,
      maxDevices: plan.maxDevices || 100,
      customBranding: plan.customBranding,
      prioritySupport: plan.prioritySupport,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      if (editingPlan) {
        await api.adminUpdatePlan(editingPlan.id, planForm);
      } else {
        await api.adminCreatePlan(planForm);
      }
      setShowPlanModal(false);
      fetchSubscriptionsAndPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (plan: any) => {
    if (confirm(`Are you sure you want to deactivate or delete the "${plan.name}" plan?`)) {
      try {
        await api.adminDeletePlan(plan.id);
        fetchSubscriptionsAndPlans();
      } catch (err: any) {
        alert(err.message || 'Failed to delete plan');
      }
    }
  };

  const filteredSubscribers = subscribers.filter((s) => {
    if (planFilter !== 'ALL' && s.plan !== planFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12 font-sans w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscriptions & Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage custom store tiers, device capacity limits, and live subscription MRR.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>

          <button
            onClick={fetchSubscriptionsAndPlans}
            title="Refresh Metrics"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 flex items-center justify-center transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Active Subscribers
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {summary.totalSubscribers}
          </div>
          <span className="text-[11px] font-bold text-blue-600">Merchant accounts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Monthly Recurring Revenue (MRR)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            ₦{summary.activeMRR.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">Live billings</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Projected ARR
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            ₦{summary.projectedARR.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-amber-600">Annual run rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            ARPU (Avg Revenue)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            ₦{summary.averageRevenuePerUser.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-purple-600">Per subscriber / mo</span>
        </div>
      </div>

      {/* Dynamic Database Plans Grid (Plan Builder Section) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Configured Store Plans ({dbPlans.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Create, adjust pricing, device limits, and receipt branding flags for all live store plans.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dbPlans.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                      {p.code}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{p.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      title="Edit Plan"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p)}
                      title="Deactivate/Delete Plan"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                  {p.description || 'Custom store subscription package.'}
                </p>

                <div className="py-2 border-y border-slate-100">
                  <div className="text-2xl font-extrabold text-slate-900">
                    ₦{p.monthlyPriceNgn?.toLocaleString()}
                    <span className="text-xs font-semibold text-slate-400"> / mo</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    Annual: ₦{p.annualPriceNgn?.toLocaleString() || (p.monthlyPriceNgn * 10).toLocaleString()} / yr
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Device Inventory Capacity:</span>
                    <strong className="text-slate-900 font-mono">{p.maxDevices?.toLocaleString() || 100} devices</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Custom Thermal Receipt Logo:</span>
                    <strong>{p.customBranding ? '✓ Yes' : '✗ No'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Priority Helpdesk Support:</span>
                    <strong>{p.prioritySupport ? '✓ Enabled' : '✗ Standard'}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-500">
                  Active Stores: <strong className="text-blue-600">{p.subscribersCount || 0}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                    p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business subscriber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Tiers</option>
            {dbPlans.map((p) => (
              <option key={p.id} value={p.code}>
                {p.name} (₦{(p.monthlyPriceNgn / 1000).toFixed(0)}k/mo)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[840px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Subscriber</th>
                <th className="px-4 py-3 font-semibold">Tier Plan</th>
                <th className="px-4 py-3 font-semibold">Monthly Price</th>
                <th className="px-4 py-3 font-semibold text-center">Registered Inventory</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Member Since</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSubscribers.length > 0 ? (
                filteredSubscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-slate-900">{s.businessName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/{s.slug}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <select
                        value={s.plan}
                        onChange={async (e) => {
                          const newPlan = e.target.value;
                          try {
                            await api.adminUpdateBusinessPlan(s.id, newPlan);
                            fetchSubscriptionsAndPlans();
                          } catch (err) {
                            console.error('Failed to update plan:', err);
                          }
                        }}
                        className="text-[11px] font-extrabold py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                      >
                        {dbPlans.map((dp) => (
                          <option key={dp.id} value={dp.code}>
                            {dp.name} (₦{(dp.monthlyPriceNgn / 1000).toFixed(0)}k/mo)
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ₦{s.price?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                      {s.usage?.registeredDevices || 0} devices
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                      {s.memberSince ? new Date(s.memberSince).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading subscribers...' : 'No subscribers found in database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Builder Modal (Create / Edit) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingPlan ? `Edit "${editingPlan.name}"` : 'Create New Subscription Plan'}
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diamond Wholesaler"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plan Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    placeholder="e.g. WHOLESALE_DIAMOND"
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold outline-none focus:border-blue-600 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Target audience and plan description..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Monthly Price (₦) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={planForm.monthlyPriceNgn}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyPriceNgn: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Annual Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.annualPriceNgn}
                    onChange={(e) => setPlanForm({ ...planForm, annualPriceNgn: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Max Registered Inventory / Devices Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={planForm.maxDevices}
                  onChange={(e) => setPlanForm({ ...planForm, maxDevices: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-blue-600"
                />
              </div>

              {/* Feature Checkboxes */}
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={planForm.customBranding}
                    onChange={(e) => setPlanForm({ ...planForm, customBranding: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow Custom Thermal Receipt Logo Branding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={planForm.prioritySupport}
                    onChange={(e) => setPlanForm({ ...planForm, prioritySupport: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Priority Helpdesk Support Queue</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={planForm.isPublic}
                    onChange={(e) => setPlanForm({ ...planForm, isPublic: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Publicly visible on Store Onboarding</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm disabled:opacity-60"
                >
                  {savingPlan ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
