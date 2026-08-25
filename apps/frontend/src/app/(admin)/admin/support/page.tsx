'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  User,
  ArrowUpDown,
  MoreVertical,
  Building2,
  Copy,
  Check,
  ChevronDown,
  X,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Smartphone,
  Eye,
  Inbox,
  AlertTriangle,
} from 'lucide-react';

export interface SupportTicket {
  id: string; // e.g. "VF-1042"
  businessId: string;
  businessName: string;
  businessPlan: string;
  requesterName: string;
  requesterRole: string;
  requesterEmail: string;
  requesterPhone: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  assignedTo: string | null;
  lastUpdated: string;
  lastUpdatedTimestamp: number;
  createdAt: string;
  createdAtTimestamp: number;
  relatedImei?: string;
  relatedSerial?: string;
  relatedVerificationId?: string;
  unreadCount?: number;
}

const mockTickets: SupportTicket[] = [
  {
    id: 'VF-1042',
    businessId: '1',
    businessName: 'Dave Phones',
    businessPlan: 'Gold',
    requesterName: 'Amaka Okafor',
    requesterRole: 'Sales Staff',
    requesterEmail: 'amaka@davephones.com',
    requesterPhone: '+234 802 334 9912',
    subject: 'IMEI verification showing incorrect result for iPhone 15 Pro',
    description: 'The customer scanned the QR code on the receipt, but VerifyFlow says the device cannot be found in national registry.',
    priority: 'High',
    status: 'Open',
    assignedTo: 'David',
    lastUpdated: '2 min ago',
    lastUpdatedTimestamp: Date.now() - 2 * 60 * 1000,
    createdAt: '25 Aug 2026, 10:42 AM',
    createdAtTimestamp: Date.now() - 45 * 60 * 1000,
    relatedImei: '356892110482910',
    relatedSerial: 'DNQZX09LMD6P',
    relatedVerificationId: 'VER-10482',
  },
  {
    id: 'VF-1041',
    businessId: '2',
    businessName: 'Apex Cellular',
    businessPlan: 'Enterprise',
    requesterName: 'Tunde Adebayo',
    requesterRole: 'Store Manager',
    requesterEmail: 'tunde@apexcellular.ng',
    requesterPhone: '+234 803 112 4455',
    subject: 'Bulk verification API returning 429 rate limit errors',
    description: 'Our POS sync script is hitting unexpected rate limits during morning inventory check-in.',
    priority: 'Urgent',
    status: 'In Progress',
    assignedTo: 'Sarah',
    lastUpdated: '14 min ago',
    lastUpdatedTimestamp: Date.now() - 14 * 60 * 1000,
    createdAt: '25 Aug 2026, 09:15 AM',
    createdAtTimestamp: Date.now() - 120 * 60 * 1000,
  },
  {
    id: 'VF-1040',
    businessId: '3',
    businessName: 'Slot Ikeja Hub',
    businessPlan: 'Enterprise',
    requesterName: 'Emeka Nwosu',
    requesterRole: 'Operations Lead',
    requesterEmail: 'emeka.n@slot.ng',
    requesterPhone: '+234 809 778 1200',
    subject: 'Adding new branch in Port Harcourt needs staff allocation quota increase',
    description: 'We opened our new location on Aba Road and need 3 additional staff account slots.',
    priority: 'Normal',
    status: 'Pending',
    assignedTo: 'David',
    lastUpdated: '1 hour ago',
    lastUpdatedTimestamp: Date.now() - 60 * 60 * 1000,
    createdAt: '25 Aug 2026, 08:30 AM',
    createdAtTimestamp: Date.now() - 180 * 60 * 1000,
  },
  {
    id: 'VF-1039',
    businessId: '4',
    businessName: 'Kano Gadget Hub',
    businessPlan: 'Silver',
    requesterName: 'Ibrahim Musa',
    requesterRole: 'Owner',
    requesterEmail: 'ibrahim@kanogadgets.com',
    requesterPhone: '+234 806 554 9901',
    subject: 'Blacklisted device reported by buyer during trade-in inspection',
    description: 'Samsung S23 Ultra IMEI flagged as flagged lost/stolen. Customer claims original purchase receipt from Dubai.',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Sarah',
    lastUpdated: '2 hours ago',
    lastUpdatedTimestamp: Date.now() - 120 * 60 * 1000,
    createdAt: '24 Aug 2026, 04:12 PM',
    createdAtTimestamp: Date.now() - 1400 * 60 * 1000,
    relatedImei: '359812048991204',
    relatedVerificationId: 'VER-10471',
  },
  {
    id: 'VF-1038',
    businessId: '5',
    businessName: '3C Hub Abuja',
    businessPlan: 'Gold',
    requesterName: 'Chioma Eze',
    requesterRole: 'Cashier',
    requesterEmail: 'chioma@3chub.ng',
    requesterPhone: '+234 805 221 8844',
    subject: 'Receipt PDF formatting missing business CAC registration number',
    description: 'The PDF download template is cutting off our corporate registration text on 58mm thermal printouts.',
    priority: 'Low',
    status: 'Open',
    assignedTo: null,
    lastUpdated: '3 hours ago',
    lastUpdatedTimestamp: Date.now() - 180 * 60 * 1000,
    createdAt: '24 Aug 2026, 02:20 PM',
    createdAtTimestamp: Date.now() - 1500 * 60 * 1000,
  },
  {
    id: 'VF-1037',
    businessId: '6',
    businessName: 'Fine Brothers Enugu',
    businessPlan: 'Silver',
    requesterName: 'Obinna Ani',
    requesterRole: 'Store Manager',
    requesterEmail: 'obinna@finebrothers.com',
    requesterPhone: '+234 803 771 9900',
    subject: 'Subscription renewal payment receipt generation failed after bank transfer',
    description: 'Paystack bank transfer cleared but plan status was stuck in trial.',
    priority: 'Normal',
    status: 'Resolved',
    assignedTo: 'David',
    lastUpdated: 'Yesterday',
    lastUpdatedTimestamp: Date.now() - 1440 * 60 * 1000,
    createdAt: '23 Aug 2026, 11:10 AM',
    createdAtTimestamp: Date.now() - 2800 * 60 * 1000,
  },
  {
    id: 'VF-1036',
    businessId: '1',
    businessName: 'Dave Phones',
    businessPlan: 'Gold',
    requesterName: 'Dave Okon',
    requesterRole: 'Director',
    requesterEmail: 'dave@davephones.com',
    requesterPhone: '+234 802 110 0099',
    subject: 'Request to update primary business email and WhatsApp webhook notification',
    description: 'Changed company notification email to ops@davephones.com.',
    priority: 'Low',
    status: 'Closed',
    assignedTo: 'Sarah',
    lastUpdated: '2 days ago',
    lastUpdatedTimestamp: Date.now() - 2880 * 60 * 1000,
    createdAt: '22 Aug 2026, 09:00 AM',
    createdAtTimestamp: Date.now() - 4000 * 60 * 1000,
  },
];

export default function AdminSupportPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [businessFilter, setBusinessFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'recently_updated' | 'newest' | 'oldest' | 'priority'>('recently_updated');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Real Calculated Workload Metrics (calculated directly from ticket data)
  const openCount = mockTickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = mockTickets.filter((t) => t.status === 'In Progress').length;
  const pendingCount = mockTickets.filter((t) => t.status === 'Pending').length;
  const highUrgentCount = mockTickets.filter((t) => t.priority === 'High' || t.priority === 'Urgent').length;
  const resolvedCount = mockTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  // Filter & Search Logic
  const filteredTickets = useMemo(() => {
    return mockTickets
      .filter((t) => {
        if (statusFilter !== 'ALL' && t.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
        if (priorityFilter !== 'ALL' && t.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
        if (assigneeFilter !== 'ALL') {
          if (assigneeFilter === 'UNASSIGNED' && t.assignedTo !== null) return false;
          if (assigneeFilter !== 'UNASSIGNED' && t.assignedTo?.toLowerCase() !== assigneeFilter.toLowerCase()) return false;
        }
        if (businessFilter !== 'ALL' && t.businessName !== businessFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchId = t.id.toLowerCase().includes(q);
          const matchBusiness = t.businessName.toLowerCase().includes(q);
          const matchSubject = t.subject.toLowerCase().includes(q);
          const matchRequester = t.requesterName.toLowerCase().includes(q) || t.requesterEmail.toLowerCase().includes(q);
          const matchImei = t.relatedImei ? t.relatedImei.toLowerCase().includes(q) : false;
          const matchSerial = t.relatedSerial ? t.relatedSerial.toLowerCase().includes(q) : false;
          return matchId || matchBusiness || matchSubject || matchRequester || matchImei || matchSerial;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recently_updated') return b.lastUpdatedTimestamp - a.lastUpdatedTimestamp;
        if (sortBy === 'newest') return b.createdAtTimestamp - a.createdAtTimestamp;
        if (sortBy === 'oldest') return a.createdAtTimestamp - b.createdAtTimestamp;
        if (sortBy === 'priority') {
          const order = { Urgent: 4, High: 3, Normal: 2, Low: 1 };
          return order[b.priority] - order[a.priority];
        }
        return 0;
      });
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, businessFilter, sortBy]);

  const copyTicketId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setAssigneeFilter('ALL');
    setBusinessFilter('ALL');
    setSortBy('recently_updated');
  };

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    assigneeFilter !== 'ALL' ||
    businessFilter !== 'ALL' ||
    searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans w-full max-w-[1400px] mx-auto overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage business support requests and customer issues.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-[38px] px-3.5 border rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-subtle ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Support Workload Overview (Compact KPI Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Open
            </span>
            <span className="text-xl font-extrabold text-amber-600">{openCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              In Progress
            </span>
            <span className="text-xl font-extrabold text-blue-600">{inProgressCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Pending
            </span>
            <span className="text-xl font-extrabold text-slate-700">{pendingCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Inbox className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              High / Urgent
            </span>
            <span className="text-xl font-extrabold text-rose-600">{highUrgentCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl p-3.5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Avg. Response
            </span>
            <span className="text-xl font-mono font-extrabold text-slate-900">14m</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Global Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket ID, business, subject, requester, IMEI, or serial..."
              className="w-full h-[40px] pl-10 pr-4 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-[40px] px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="recently_updated">Recently updated</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Highest priority</option>
            </select>
          </div>
        </div>

        {/* Expandable Filter Row */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in-50 duration-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-[36px] px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full h-[36px] px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Assigned To</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full h-[36px] px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">All Agents</option>
                <option value="David">David</option>
                <option value="Sarah">Sarah</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Business</label>
              <select
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                className="w-full h-[36px] px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 outline-none"
              >
                <option value="ALL">All Businesses</option>
                <option value="Dave Phones">Dave Phones</option>
                <option value="Apex Cellular">Apex Cellular</option>
                <option value="Slot Ikeja Hub">Slot Ikeja Hub</option>
                <option value="Kano Gadget Hub">Kano Gadget Hub</option>
                <option value="3C Hub Abuja">3C Hub Abuja</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear all filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket List Table (Desktop View) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Business</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Last Updated</th>
              <th className="py-3 px-4 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/admin/support/${t.id}`)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  {/* Ticket ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    <div className="flex items-center gap-1.5">
                      <span>#{t.id}</span>
                      <button
                        onClick={(e) => copyTicketId(e, t.id)}
                        title="Copy Ticket ID"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
                      >
                        {copiedId === t.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Business */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{t.businessName}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{t.requesterName}</span>
                  </td>

                  {/* Subject */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-semibold text-slate-900 line-clamp-1 block">
                      {t.subject}
                    </span>
                    {t.relatedImei && (
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                        IMEI: {t.relatedImei}
                      </span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        t.priority === 'Urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold'
                          : t.priority === 'High'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                          : t.priority === 'Normal'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'Open'
                          ? 'bg-amber-100/70 text-amber-800 border border-amber-200'
                          : t.status === 'In Progress'
                          ? 'bg-blue-100/70 text-blue-800 border border-blue-200'
                          : t.status === 'Pending'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : t.status === 'Resolved'
                          ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  {/* Assigned To */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {t.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {t.assignedTo[0]}
                        </div>
                        <span className="font-semibold text-slate-700">{t.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium italic">Unassigned</span>
                    )}
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-500">
                    {t.lastUpdated}
                  </td>

                  {/* Created */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right text-slate-500 font-mono text-[11px]">
                    {t.createdAt}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300" />
                    <span className="text-sm font-bold text-slate-700">No tickets match your filters</span>
                    <p className="text-xs text-slate-400">Try adjusting search terms or clearing current filter selections.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Phones & Small Tablets) */}
      <div className="md:hidden space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin/support/${t.id}`)}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle active:bg-slate-50 transition space-y-2.5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-600">#{t.id}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      t.priority === 'Urgent' || t.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.status === 'Open'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : t.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{t.subject}</h3>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {t.businessName} • {t.requesterName}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated {t.lastUpdated}</span>
                <span className="font-semibold text-slate-700">
                  {t.assignedTo ? `Agent: ${t.assignedTo}` : 'Unassigned'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No tickets match your filters</p>
            <button
              onClick={clearFilters}
              className="mt-3 px-3.5 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
