'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  CreditCard,
  Building,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Search,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  X,
  Printer,
  Wrench,
  QrCode,
  Tag,
  Headphones,
} from 'lucide-react';

const AVAILABLE_APP_FEATURES = [
  'Digital & 58mm/80mm Thermal Receipts',
  'QR Origin IMEI Verification on Receipts',
  'Device Inventory Management & IMEI Tracking',
  'Point of Sale (POS) & Automated Sales Ledger',
  'Repair Ticketing & Diagnostics Tracking',
  'Customer Directory & Warranty Tracking',
  'Box Barcode & Multi-Identifier Scanner',
  'Custom Store Logo & Receipt Branding',
  'Priority Helpdesk Support Queue',
];

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
    features: [] as string[],
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
      monthlyPriceNgn: 0,
      annualPriceNgn: 0,
      maxDevices: 100,
      customBranding: false,
      prioritySupport: false,
      isActive: true,
      isPublic: true,
      features: [],
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
      features: Array.isArray(plan.features) ? plan.features : [],
    });
    setShowPlanModal(true);
  };

  const toggleFeature = (feature: string) => {
    setPlanForm((prev) => {
      const exists = prev.features.includes(feature);
      return {
        ...prev,
        features: exists
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      };
    });
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

  const handleDeletePlan = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the plan "${name}"?`)) return;
    try {
      await api.adminDeletePlan(id);
      fetchSubscriptionsAndPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleAssignPlan = async (businessId: string, newPlanCode: string) => {
    try {
      await api.adminUpdateSubscriberPlan(businessId, newPlanCode);
      fetchSubscriptionsAndPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to update subscriber plan');
    }
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan =
      planFilter === 'ALL' || sub.plan.toUpperCase() === planFilter.toUpperCase();
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Page Header */}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>

          <button
            onClick={fetchSubscriptionsAndPlans}
            title="Refresh Metrics"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 flex items-center justify-center transition shadow-xs cursor-pointer"
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
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 font-mono">
            ₦{summary.activeMRR.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">Live billings</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Projected ARR
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 font-mono">
            ₦{summary.projectedARR.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-amber-600">Annual run rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            ARPU (Avg Revenue)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 font-mono">
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
              Create, adjust pricing, device limits, receipt branding, and feature flags.
            </p>
          </div>
        </div>

        {dbPlans.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Subscription Plans Configured Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &quot;Create New Plan&quot; to define your first store tier, set device inventory limits, and customize features.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              + Create First Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dbPlans.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle flex flex-col justify-between hover:border-blue-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {p.code}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{p.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {p.description || 'Custom store subscription tier.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        ₦{p.monthlyPriceNgn.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">/ month</span>
                    </div>
                    {p.annualPriceNgn && (
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                        ₦{p.annualPriceNgn.toLocaleString()} billed annually
                      </span>
                    )}
                  </div>

                  {/* Plan Specs */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Device Inventory Limit:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {p.maxDevices ? `${p.maxDevices.toLocaleString()} devices` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Custom Logo Branding:</span>
                      <span
                        className={`font-bold ${
                          p.customBranding ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {p.customBranding ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Priority Support:</span>
                      <span
                        className={`font-bold ${
                          p.prioritySupport ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {p.prioritySupport ? 'Included' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  {Array.isArray(p.features) && p.features.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Included Features:
                      </span>
                      <div className="space-y-1">
                        {p.features.slice(0, 4).map((f: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {summary.tierCounts[p.code.toLowerCase()] || 0} active subscriber(s)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.isActive ? 'Active Tier' : 'Archived'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscriber Management Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Live Merchant Subscribers</h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time directory of registered merchant stores and their active billing tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search store name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 h-[36px] bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-[36px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Tiers</option>
              {dbPlans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Subscriber Store</th>
                <th className="py-3 px-4 font-semibold">Assigned Tier</th>
                <th className="py-3 px-4 font-semibold">Monthly Price</th>
                <th className="py-3 px-4 font-semibold">Device Inventory</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSubscribers.length > 0 ? (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{sub.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/{sub.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={sub.plan}
                        onChange={(e) => handleAssignPlan(sub.id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                      >
                        {dbPlans.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name} (₦{p.monthlyPriceNgn.toLocaleString()}/mo)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₦{(sub.monthlyPrice || 0).toLocaleString()} / mo
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {sub.phoneRecordsCount || 0} / {sub.maxDevices ? sub.maxDevices.toLocaleString() : '∞'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {sub.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    {loading ? 'Loading subscribers...' : 'No merchant subscribers registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Builder Modal (Create / Edit) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingPlan ? `Edit "${editingPlan.name}"` : 'Create New Subscription Plan'}
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Retail Store Plus"
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
                    placeholder="e.g. RETAIL_PLUS"
                    value={planForm.code}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                      })
                    }
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
                  placeholder="Target audience and plan benefits..."
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
                    placeholder="e.g. 15000"
                    value={planForm.monthlyPriceNgn === 0 ? '' : planForm.monthlyPriceNgn}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, monthlyPriceNgn: Number(e.target.value) || 0 })
                    }
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
                    placeholder="e.g. 150000"
                    value={planForm.annualPriceNgn === 0 ? '' : planForm.annualPriceNgn}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, annualPriceNgn: Number(e.target.value) || 0 })
                    }
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
                  placeholder="e.g. 500"
                  value={planForm.maxDevices === 0 ? '' : planForm.maxDevices}
                  onChange={(e) => setPlanForm({ ...planForm, maxDevices: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-blue-600"
                />
              </div>

              {/* Real App Features Selector */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Select Included Features
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {AVAILABLE_APP_FEATURES.map((feat) => {
                    const isSelected = planForm.features.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => toggleFeature(feat)}
                        className={`text-left p-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate">{feat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* High-Level Feature Checkboxes */}
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
                  className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm disabled:opacity-60 cursor-pointer"
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
