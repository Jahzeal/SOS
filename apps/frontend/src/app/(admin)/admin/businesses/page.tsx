'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  X,
  ArrowDown,
  Eye,
  Edit2,
  MoreVertical,
  RotateCcw,
  Building2,
  Briefcase,
  Store,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
} from 'lucide-react';

interface BusinessItem {
  id: string;
  initials: string;
  name: string;
  regNo: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'Enterprise' | 'Professional' | 'Basic';
  devicesUsed: number;
  devicesMax: number;
  status: 'Active' | 'Trial' | 'Suspended' | 'Cancelled';
}

const mockBusinesses: BusinessItem[] = [
  {
    id: 'b1',
    initials: 'DL',
    name: 'Dangote Logistics Ltd.',
    regNo: 'RC-1049283',
    city: 'Lagos',
    ownerName: 'Adeyemi Bello',
    ownerEmail: 'a.bello@dangotelogistics.com',
    plan: 'Enterprise',
    devicesUsed: 42,
    devicesMax: 50,
    status: 'Active',
  },
  {
    id: 'b2',
    initials: 'ZP',
    name: 'Zenith Properties NG',
    regNo: 'RC-992011',
    city: 'Abuja',
    ownerName: 'Ngozi Okafor',
    ownerEmail: 'admin@zenithprops.ng',
    plan: 'Professional',
    devicesUsed: 8,
    devicesMax: 10,
    status: 'Trial',
  },
  {
    id: 'b3',
    initials: 'FA',
    name: 'First Agro-Allied',
    regNo: 'RC-332901',
    city: 'Kano',
    ownerName: 'Ibrahim Musa',
    ownerEmail: 'i.musa@firstagro.com',
    plan: 'Enterprise',
    devicesUsed: 102,
    devicesMax: 150,
    status: 'Suspended',
  },
  {
    id: 'b4',
    initials: 'MS',
    name: 'Mainland Stores',
    regNo: 'RC-445821',
    city: 'Lagos',
    ownerName: 'Chika Ude',
    ownerEmail: 'chika@mainlandstores.ng',
    plan: 'Basic',
    devicesUsed: 0,
    devicesMax: 3,
    status: 'Cancelled',
  },
  {
    id: 'b5',
    initials: 'DP',
    name: 'Dave Phones & Gadgets',
    regNo: 'RC-781920',
    city: 'Ikeja, Lagos',
    ownerName: 'David Ibeh',
    ownerEmail: 'david@davephones.ng',
    plan: 'Professional',
    devicesUsed: 35,
    devicesMax: 50,
    status: 'Active',
  },
  {
    id: 'b6',
    initials: 'MH',
    name: 'Mobile Hub Hub Port Harcourt',
    regNo: 'RC-629104',
    city: 'Port Harcourt',
    ownerName: 'Amaka Okafor',
    ownerEmail: 'amaka@mobilehubph.com',
    plan: 'Enterprise',
    devicesUsed: 64,
    devicesMax: 100,
    status: 'Active',
  },
];

export default function AdminBusinessesManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === mockBusinesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mockBusinesses.map((b) => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter(null);
    setRegionFilter(null);
    setSearchTerm('');
  };

  const filtered = mockBusinesses.filter((b) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        b.name.toLowerCase().includes(q) ||
        b.ownerName.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter && b.status !== statusFilter) return false;
    if (regionFilter && b.city !== regionFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 pb-8 font-sans w-full max-w-full overflow-hidden">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Businesses Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            View and manage registered businesses, active plans, and device allocations across regions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search businesses..."
              className="w-full h-[36px] pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors shadow-subtle"
            />
          </div>

          {/* Filters & New Business Buttons Side-by-Side */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 h-[36px] bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-subtle">
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filters</span>
            </button>

            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 h-[36px] bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
              <Plus className="w-4 h-4" />
              <span>New Business</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-subtle w-full max-w-full overflow-hidden">
        {/* Table Controls / Filters Summary Bar */}
        <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">342</span>
            <span>total businesses found</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-subtle">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter(null)} className="hover:text-slate-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {regionFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-subtle">
                Region: {regionFilter}
                <button onClick={() => setRegionFilter(null)} className="hover:text-slate-900">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {(statusFilter || regionFilter || searchTerm) && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:underline text-[11px] font-bold ml-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Mobile Compact Card View (Shown on small screens to prevent overlay clipping) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((b) => (
            <div key={b.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-blue-700 font-extrabold text-xs">
                    {b.initials}
                  </div>
                  <div>
                    <div className={`font-bold text-slate-900 text-sm ${b.status === 'Cancelled' ? 'line-through' : ''}`}>
                      {b.name}
                    </div>
                    <div className="text-slate-400 text-[11px] font-mono">
                      {b.regNo} • {b.city}
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    b.status === 'Active'
                      ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                      : b.status === 'Trial'
                      ? 'bg-[#e8f0fe] text-[#1967d2] border border-[#d2e3fc]'
                      : b.status === 'Suspended'
                      ? 'bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]'
                      : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Owner</span>
                  <div className="font-semibold text-slate-800 truncate">{b.ownerName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Plan & Devices</span>
                  <div className="font-semibold text-slate-800">{b.plan} ({b.devicesUsed}/{b.devicesMax})</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-400 font-mono truncate">{b.ownerEmail}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                    View
                  </button>
                  <button className="p-1 text-slate-500 hover:text-slate-800">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Responsive Desktop Table Wrapper */}
        <div className="hidden md:block overflow-x-auto w-full max-w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead className="bg-white sticky top-0 z-10 border-b border-slate-200">
              <tr className="text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="px-4 py-3 font-medium w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === mockBusinesses.length && mockBusinesses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:text-slate-900 group">
                  <div className="flex items-center gap-1">
                    <span>Business Name</span>
                    <ArrowDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">Owner / Contact</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold text-right">Devices</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    b.status === 'Cancelled' ? 'opacity-70' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(b.id)}
                      onChange={() => toggleSelectOne(b.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-blue-700 font-extrabold text-xs">
                        {b.initials}
                      </div>
                      <div>
                        <div className={`font-bold text-slate-900 ${b.status === 'Cancelled' ? 'line-through' : ''}`}>
                          {b.name}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          {b.regNo} • {b.city}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <div className="font-bold text-slate-900">{b.ownerName}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{b.ownerEmail}</div>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <span className="inline-flex items-center gap-1 font-bold">
                      {b.plan === 'Enterprise' ? (
                        <>
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-slate-800">Enterprise</span>
                        </>
                      ) : b.plan === 'Professional' ? (
                        <>
                          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-slate-800">Professional</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-600">Basic</span>
                        </>
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle text-right font-mono font-bold text-slate-900">
                    {b.devicesUsed}/{b.devicesMax}
                  </td>

                  <td className="px-4 py-3 align-middle text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'Active'
                          ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                          : b.status === 'Trial'
                          ? 'bg-[#e8f0fe] text-[#1967d2] border border-[#d2e3fc]'
                          : b.status === 'Suspended'
                          ? 'bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]'
                          : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {b.status === 'Cancelled' ? (
                        <button
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="More"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">1</span> to{' '}
            <span className="font-bold text-slate-900">{filtered.length}</span> of{' '}
            <span className="font-bold text-slate-900">342</span> businesses
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              disabled
              className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm text-xs">
              1
            </button>
            <button className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs">
              2
            </button>
            <button className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs">
              35
            </button>
            <button className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
