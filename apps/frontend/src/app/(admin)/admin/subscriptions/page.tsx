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
  ShieldCheck,
  RefreshCw,
  X,
  Printer,
  Wrench,
  QrCode,
  Tag,
  Headphones,
  Smartphone,
  ShoppingCart,
  FileText,
  Users,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface FeatureCategory {
  category: string;
  icon: string;
  items: string[];
}

const PLATFORM_FEATURE_CATALOG: FeatureCategory[] = [
  {
    category: 'Device & Inventory Management',
    icon: '📱',
    items: [
      'Single Device Registration & Dual IMEI Ledger',
      'Bulk Excel & CSV Device Import',
      'Physical Condition Grading (New, Refurbished, Parts)',
      'Device Specs & Storage Capacity (GB) Ledger',
      'Device Passport & Warranty Management',
      'Camera & Barcode Multi-Identifier Scanner',
      'High-Speed Debounced Inventory Search & Filters',
    ],
  },
  {
    category: 'Point of Sale (POS) & Checkout',
    icon: '💳',
    items: [
      'Point of Sale (POS) Counter & Fast Checkout',
      'Multi-Payment Settlement (Cash, Card, Transfer, Split)',
      'Instant Automated Inventory Stock Deduction',
      'Complete Sales Transaction Archive & Lookups',
      'Daily Revenue & Cashier Shift Tracking',
    ],
  },
  {
    category: 'Receipts, Invoices & Branding',
    icon: '🧾',
    items: [
      'Standard POS Thermal Receipts (58mm/80mm)',
      'Commercial PDF Invoices with Bank Details',
      'Direct Email Receipts & Invoices to Customers',
      'Store Logo & Header Branding Customization',
      'Custom Warranty Terms & Receipt Footer Disclaimers',
    ],
  },
  {
    category: 'Public Verification & Anti-Theft Ledger',
    icon: '🛡️',
    items: [
      'Public Anti-Theft & Proof-of-Origin Portal (/verify)',
      'Instant Flagged-Stolen Device Warning Badges',
      'Verified Store Origin Authenticity Seals',
      'Public Verification Audit History Logs',
    ],
  },
  {
    category: 'Repair Counter & Diagnostics',
    icon: '🔧',
    items: [
      'Repair Ticketing & Diagnostics Lifecycle Tracking',
      'Customer Fault Notes & Cost Estimation Quotations',
      'Linked IMEI Diagnostic & Repair History',
      'Ready-for-Pickup Status Notifications',
    ],
  },
  {
    category: 'Customer CRM & Warranty Engine',
    icon: '👥',
    items: [
      'Customer Directory & Lifetime Purchase History',
      'Automated Warranty Expiration Clock & Claim Alerts',
      'Customer Phone & Contact Ledger',
    ],
  },
  {
    category: 'Financial Analytics & Reports',
    icon: '📊',
    items: [
      'Live Revenue, Gross Margin & Profit Analytics',
      'Payment Channel Distribution Breakdown',
      'Top-Selling Brands & Inventory Velocity Reports',
      'CSV Export for Accounting & Tax Records',
    ],
  },
  {
    category: 'Multi-Branch & Enterprise',
    icon: '🏢',
    items: [
      'Multi-Branch Store Workspaces',
      'Wholesaler Stock Allocation & Inter-Branch Transfers',
      'Role-Based Staff Access & Permissions',
      'Priority Helpdesk & Dedicated Account Support',
    ],
  },
];

const ALL_CATALOG_FEATURES = PLATFORM_FEATURE_CATALOG.flatMap((cat) => cat.items);

import { useAdminSubscriptions, useDashboardCacheUtils } from '@/hooks/useDashboardQueries';

export default function AdminSubscriptionsPage() {
  const { invalidateAdminSubscriptions } = useDashboardCacheUtils();
  const { data: subsRes, isLoading: loading, refetch: fetchSubscriptionsAndPlans } = useAdminSubscriptions();

  const subscribers = subsRes?.data || [];
  const dbPlans = subsRes?.plans || [];
  const summary = subsRes?.summary || {
    totalSubscribers: 0,
    activeMRR: 0,
    projectedARR: 0,
    averageRevenuePerUser: 0,
    tierCounts: {} as Record<string, number>,
    tierPricing: {} as Record<string, number>,
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');

  // Modal State for Plan Creation / Editing
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPublicPreviewModal, setShowPublicPreviewModal] = useState(false);
  const [previewBillingCycle, setPreviewBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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
    sortOrder: 0,
    features: [] as string[],
  });
  const [savingPlan, setSavingPlan] = useState(false);

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
      sortOrder: dbPlans.length + 1,
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
      maxDevices: plan.maxDevices !== undefined && plan.maxDevices !== null ? plan.maxDevices : 100,
      customBranding: plan.customBranding,
      prioritySupport: plan.prioritySupport,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : 0,
      features: Array.isArray(plan.features) ? plan.features : [],
    });
    setShowPlanModal(true);
  };

  const handleMovePlan = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dbPlans.length) return;

    const newPlans = [...dbPlans];
    const [moved] = newPlans.splice(index, 1);
    newPlans.splice(targetIndex, 0, moved);

    const reorderPayload = newPlans.map((p, idx) => ({
      id: p.id,
      sortOrder: idx + 1,
    }));

    setIsReordering(true);
    try {
      await api.adminReorderPlans(reorderPayload);
      invalidateAdminSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to reorder plans');
    } finally {
      setIsReordering(false);
    }
  };

  const handleTogglePublic = async (plan: any) => {
    try {
      await api.adminUpdatePlan(plan.id, { isPublic: !plan.isPublic });
      invalidateAdminSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    }
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
      invalidateAdminSubscriptions();
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
      invalidateAdminSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleAssignPlan = async (businessId: string, newPlanCode: string) => {
    try {
      await api.adminUpdateSubscriberPlan(businessId, newPlanCode);
      invalidateAdminSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to update subscriber plan');
    }
  };

  const handleCancelPlan = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to cancel the subscription plan for "${businessName}"?`)) {
      return;
    }
    try {
      await api.adminCancelSubscriberPlan(businessId);
      invalidateAdminSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscriber plan');
    }
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const name = sub?.name || sub?.businessName || '';
    const slug = sub?.slug || '';
    const plan = sub?.plan || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan =
      planFilter === 'ALL' || plan.toUpperCase() === planFilter.toUpperCase();
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
            onClick={() => setShowPublicPreviewModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer shadow-xs"
            title="Preview how plans appear to the public"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Preview Public (/pricing)</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>

          <button
            onClick={() => fetchSubscriptionsAndPlans()}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Configured Store Plans ({dbPlans.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Use <strong>◀ Move Left</strong> and <strong>Move Right ▶</strong> to arrange how cards appear on the public pricing page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPublicPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-extrabold border border-teal-200 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Live Public Preview</span>
            </button>
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
            {dbPlans.map((p, idx) => (
              <div
                key={p.id}
                className={`bg-white border rounded-2xl p-5 shadow-subtle flex flex-col justify-between transition-all ${
                  p.isPublic
                    ? 'border-slate-200 hover:border-blue-300'
                    : 'border-slate-200/60 bg-slate-50/40 opacity-90'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header & Sequence Position */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {p.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Pos #{idx + 1}
                        </span>
                        {p.code === 'BUSINESS' && (
                          <span className="text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            ★ Popular
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{p.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {p.description || 'Custom store subscription tier.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id, p.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Public Page Arrangement & Visibility Toolbar */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePlan(idx, 'left')}
                        disabled={idx === 0 || isReordering}
                        className="px-2 py-1 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                        title="Move Left (Show earlier on public page)"
                      >
                        ◀ Left
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePlan(idx, 'right')}
                        disabled={idx === dbPlans.length - 1 || isReordering}
                        className="px-2 py-1 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shadow-2xs"
                        title="Move Right (Show later on public page)"
                      >
                        Right ▶
                      </button>
                    </div>

                    {/* Quick Visibility Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePublic(p)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border ${
                        p.isPublic
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-200/80 text-slate-600 border-slate-300 hover:bg-slate-300'
                      }`}
                      title={p.isPublic ? 'Publicly visible on /pricing. Click to hide.' : 'Hidden from /pricing. Click to publish.'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.isPublic ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{p.isPublic ? 'Public' : 'Hidden'}</span>
                    </button>
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
                      <span className={`font-bold font-mono ${p.maxDevices && p.maxDevices > 0 ? 'text-slate-900' : 'text-emerald-700 font-extrabold'}`}>
                        {p.maxDevices && p.maxDevices > 0 ? `${p.maxDevices.toLocaleString()} devices` : 'Unlimited (∞)'}
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
                    <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Included Features ({p.features.length}):
                      </span>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {p.features.map((f: string, fIdx: number) => (
                          <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{f}</span>
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
                      <div className="font-bold text-slate-900">{sub.name || sub.businessName || 'Store'}</div>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>
                          ₦{((sub.planPrice ?? dbPlans.find((p) => p.code === sub.plan)?.monthlyPriceNgn) || 0).toLocaleString()} / mo
                        </span>
                        {sub.subscriptionStatus === 'TRIAL' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            (Trial)
                          </span>
                        )}
                        {sub.subscriptionStatus === 'CANCELLED' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            (Cancelled)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {sub.phoneRecordsCount || 0} / {sub.maxDevices ? sub.maxDevices.toLocaleString() : '∞'}
                    </td>
                    <td className="py-3 px-4">
                      {sub.subscriptionStatus === 'ACTIVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active (Paid)
                        </span>
                      ) : sub.subscriptionStatus === 'CANCELLED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          14-Day Trial
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub.subscriptionStatus !== 'CANCELLED' ? (
                          <button
                            onClick={() => handleCancelPlan(sub.id, sub.name || sub.businessName || 'Store')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Cancel Subscriber Plan"
                          >
                            Cancel Plan
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic">Cancelled</span>
                        )}
                      </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs">
                    Max Registered Inventory / Devices Capacity
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={planForm.maxDevices === 0 || planForm.maxDevices === -1}
                      onChange={(e) => {
                        setPlanForm({
                          ...planForm,
                          maxDevices: e.target.checked ? 0 : 100,
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Unlimited (∞)</span>
                  </label>
                </div>

                {planForm.maxDevices === 0 || planForm.maxDevices === -1 ? (
                  <div className="w-full px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Unlimited Devices Enabled (No inventory cap)</span>
                    </div>
                    <span className="font-mono text-base font-extrabold">∞</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500"
                      value={planForm.maxDevices}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, maxDevices: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-blue-600 text-xs pr-16"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium pointer-events-none">
                      devices
                    </span>
                  </div>
                )}
              </div>

              {/* Categorized Platform Feature Selector */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-xs">
                      Included Platform Features ({planForm.features.length}/{ALL_CATALOG_FEATURES.length} Selected)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check every capability included in this subscription tier.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, features: [...ALL_CATALOG_FEATURES] })}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 cursor-pointer"
                    >
                      Select All ({ALL_CATALOG_FEATURES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, features: [] })}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
                  {PLATFORM_FEATURE_CATALOG.map((cat) => {
                    const selectedInCat = cat.items.filter((item) => planForm.features.includes(item)).length;
                    const allCatSelected = selectedInCat === cat.items.length;

                    const toggleCat = () => {
                      if (allCatSelected) {
                        setPlanForm({
                          ...planForm,
                          features: planForm.features.filter((f) => !cat.items.includes(f)),
                        });
                      } else {
                        const newFeatures = Array.from(new Set([...planForm.features, ...cat.items]));
                        setPlanForm({ ...planForm, features: newFeatures });
                      }
                    };

                    return (
                      <div key={cat.category} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{cat.icon}</span>
                            <span>{cat.category}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({selectedInCat}/{cat.items.length})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={toggleCat}
                            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            {allCatSelected ? 'Deselect Category' : 'Select All in Category'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {cat.items.map((feat) => {
                            const isSelected = planForm.features.includes(feat);
                            return (
                              <button
                                key={feat}
                                type="button"
                                onClick={() => toggleFeature(feat)}
                                className={`text-left p-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 transition border cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className="leading-tight truncate">{feat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
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

      {/* Live Public Pricing Preview Modal */}
      {showPublicPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header with Billing Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Interactive Public View Preview</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Public Pricing Page Preview (/pricing)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This is exactly how prospective merchant stores view your subscription cards and features.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Billing Cycle Switch */}
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 border border-slate-300/60">
                  <button
                    onClick={() => setPreviewBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewBillingCycle === 'monthly'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setPreviewBillingCycle('annual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      previewBillingCycle === 'annual'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Annual
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                      -20%
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => setShowPublicPreviewModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white border border-slate-200 cursor-pointer shadow-2xs"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Public Cards Preview Grid */}
            {(() => {
              const publicPlans = dbPlans.filter((p) => p.isPublic !== false);
              if (publicPlans.length === 0) {
                return (
                  <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6 space-y-2">
                    <p className="text-sm font-bold text-slate-700">No plans are currently marked as Public.</p>
                    <p className="text-xs text-slate-400">Toggle "Public" on your plans to display them here.</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2">
                  {publicPlans.map((plan, idx) => {
                    const isFree = plan.code === 'FREE' || (!plan.monthlyPriceNgn && !plan.annualPriceNgn);
                    const monthlyPrice = plan.monthlyPriceNgn || 0;
                    const annualPrice = plan.annualPriceNgn && plan.annualPriceNgn > 0 ? plan.annualPriceNgn : monthlyPrice * 10;
                    const displayPrice = isFree
                      ? 0
                      : previewBillingCycle === 'annual'
                      ? Math.round(annualPrice / 12)
                      : monthlyPrice;
                    const isPopular = plan.code === 'BUSINESS';

                    return (
                      <div
                        key={plan.code || plan.id}
                        className={`rounded-2xl bg-white p-5 flex flex-col justify-between relative transition-all shadow-sm ${
                          isPopular
                            ? 'border-2 border-teal-600 shadow-xl ring-4 ring-teal-500/10'
                            : 'border border-slate-200'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-extrabold uppercase tracking-widest shadow-xs">
                            MOST POPULAR
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-extrabold text-slate-900">{plan.name}</h4>
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-1 min-h-[30px] line-clamp-2">
                              {plan.description || 'Verified device tracking, POS checkout, and receipts.'}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-slate-900 font-mono">
                                ₦{displayPrice.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-slate-500 font-bold">
                                {isFree ? '/ forever' : '/ mo'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {isFree
                                ? 'Zero credit card required'
                                : previewBillingCycle === 'annual'
                                ? `₦${annualPrice.toLocaleString()} / year (Save 20%)`
                                : 'Billed monthly'}
                            </p>
                          </div>

                          {/* Features */}
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                              Included Features:
                            </span>
                            <div className="space-y-1.5 text-[11px] text-slate-700 max-h-44 overflow-y-auto pr-1">
                              {Array.isArray(plan.features) && plan.features.length > 0 ? (
                                plan.features.map((feat: string, fIdx: number) => (
                                  <div key={fIdx} className="flex items-start gap-1.5 font-medium">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{feat}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-start gap-1.5 text-slate-500">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>
                                    {plan.maxDevices > 0
                                      ? `Up to ${plan.maxDevices.toLocaleString()} Devices`
                                      : 'Unlimited Devices'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-5">
                          <button
                            type="button"
                            disabled
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                              isPopular
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            Start 14-Day Free Trial →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500">
              <span>Showing active public plans in exact display sequence</span>
              <button
                onClick={() => setShowPublicPreviewModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
