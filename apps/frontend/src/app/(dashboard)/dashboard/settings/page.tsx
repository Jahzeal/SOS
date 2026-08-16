'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Building,
  Users,
  Store,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Check,
  Upload,
  Info,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function RebuiltSettingsPage() {
  const { user } = useAuthStore();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'users' | 'branches' | 'billing'>('profile');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    name: user?.business?.name || 'Ikeja Mobile Hub',
    legalName: 'Ikeja Mobile Hub Ltd',
    businessType: 'retail',
    phone: '+234 800 000 0000',
    email: user?.email || 'hello@ikejamobilehub.com',
    address: '12 Computer Village Road, Ikeja, Lagos, Nigeria.',
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRntZfETk-UGxQGDWh4XSe1TaWFuDe8dNJdYw4oj6x-PZvGNkVoCfmvWz3TENAMpbz_-XI-qyiJ7DhG9bfiM_LXeJfw38ybHzSawp4-WKHqzF3RVXA3MZ8wJXZNALE0D-9R87Uf5KOtAdQMahBKth1Kc3acJEe-871XUjkiHiAa0eQ5xBpCHzAZDRalkyta2fBIPyGX9Mx-sao2AEmqbJyHmjW-u0uOmi6nuy1FClYutIU2L2gVLypzQ',
    showName: true,
    showLogo: true,
    showPhone: true,
    showEmail: false,
    showWebsite: false,
  });

  // Users & Roles State
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [usersList, setUsersList] = useState([
    { id: '1', name: 'David Ibeh', email: 'david@example.com', role: 'Management', branch: 'All Branches', status: 'ACTIVE', lastActive: 'Just now', initials: 'DI', color: 'bg-blue-600' },
    { id: '2', name: 'Amaka Okafor', email: 'amaka@example.com', role: 'Sales', branch: 'Ikeja', status: 'ACTIVE', lastActive: '5 min ago', initials: 'AO', color: 'bg-indigo-600' },
    { id: '3', name: 'John Ade', email: 'john@example.com', role: 'Manager', branch: 'Ikeja', status: 'ACTIVE', lastActive: '1 hour ago', initials: 'JA', color: 'bg-amber-600' },
    { id: '4', name: 'Peter James', email: 'peter@example.com', role: 'Technician', branch: 'Lekki', status: 'ACTIVE', lastActive: 'Yesterday', initials: 'PJ', color: 'bg-slate-700' },
    { id: '5', name: 'Sarah Cole', email: 'sarah@example.com', role: 'Sales', branch: 'Lekki', status: 'INACTIVE', lastActive: '3 days ago', initials: 'SC', color: 'bg-slate-400' },
  ]);

  // Branches State
  const [branches, setBranches] = useState([
    { id: 'b1', name: 'Ikeja Main Store', address: '12 Computer Village Road, Ikeja, Lagos', phone: '+234 801 111 2222', isHeadquarters: true, staffCount: 5, stockValue: '₦48,500,000' },
    { id: 'b2', name: 'Lekki Mall Branch', address: 'Suite 40, Admiralty Way, Lekki Phase 1', phone: '+234 802 333 4444', isHeadquarters: false, staffCount: 3, stockValue: '₦24,200,000' },
  ]);

  // Handle Form Change Trackers
  const handleProfileChange = (field: string, value: any) => {
    setBusinessProfile((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    setHasUnsavedChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDiscard = () => {
    setHasUnsavedChanges(false);
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    if (roleFilter !== 'ALL' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (branchFilter !== 'ALL' && !u.branch.toLowerCase().includes(branchFilter.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && u.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Store Settings & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Manage business credentials, team roles, retail branches, and store subscription plans.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Changes Saved Successfully!
          </div>
        )}
      </div>

      {/* Settings Tab Dropdown Select */}
      <div className="relative z-30 max-w-xs">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {activeSubTab === 'profile' && (
              <>
                <Building className="w-4 h-4 text-blue-600" />
                <span>Business Profile</span>
              </>
            )}
            {activeSubTab === 'users' && (
              <>
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Users & Roles</span>
              </>
            )}
            {activeSubTab === 'branches' && (
              <>
                <Store className="w-4 h-4 text-amber-600" />
                <span>Branches</span>
              </>
            )}
            {activeSubTab === 'billing' && (
              <>
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Billing & Plan</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop overlay to close dropdown when clicking outside */}
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            
            {/* Menu options */}
            <div className="absolute left-0 mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
              <button
                onClick={() => {
                  setActiveSubTab('profile');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Business Profile</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('users');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>Users & Roles</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('branches');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'branches' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Branches</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('billing');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'billing' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Billing & Plan</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* TAB 1: BUSINESS PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo Upload Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Business Logo</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center shadow-subtle">
                  <img
                    src={businessProfile.logoUrl}
                    alt="Business Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This logo appears on digital QR receipts, thermal receipts, and public IMEI verification pages. Recommended size: 512x512px.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Button variant="primary" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />}>
                      Upload New Logo
                    </Button>
                    <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details Form */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Business Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Business Name</label>
                  <input
                    type="text"
                    value={businessProfile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Legal Name</label>
                  <input
                    type="text"
                    value={businessProfile.legalName}
                    onChange={(e) => handleProfileChange('legalName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-800">Business Category / Type</label>
                <select
                  value={businessProfile.businessType}
                  onChange={(e) => handleProfileChange('businessType', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="retail">Phone Retailer & Gadgets Store</option>
                  <option value="wholesale">Wholesale Phone Distributor</option>
                  <option value="repair">Device Repair Center</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Store Phone Number</label>
                  <input
                    type="tel"
                    value={businessProfile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Store Email Address</label>
                  <input
                    type="email"
                    value={businessProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-800">Physical Store Address</label>
                <textarea
                  rows={3}
                  value={businessProfile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Public Identity Toggles & Customer Preview */}
          <div className="space-y-6">
            {/* Public Toggles Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 text-xs">
              <h3 className="text-base font-extrabold text-slate-900">Public Verification Identity</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Control which information is publicly displayed when buyers scan your verification QR receipts.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { key: 'showName', label: 'Show Business Name' },
                  { key: 'showLogo', label: 'Show Store Logo' },
                  { key: 'showPhone', label: 'Show Phone Contact' },
                  { key: 'showEmail', label: 'Show Email Address' },
                  { key: 'showWebsite', label: 'Show Store Website' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(businessProfile as any)[item.key]}
                      onChange={(e) => handleProfileChange(item.key, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Live Customer Preview */}
            <div className="p-6 rounded-2xl bg-slate-100/70 border border-slate-200/80 shadow-sm text-center space-y-4">
              <div className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider text-left">
                Customer Verification Preview
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3 text-left max-w-xs mx-auto">
                <div className="flex justify-center">
                  <Badge variant="verified" size="sm">
                    Phone Verified
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-slate-900 text-sm">iPhone 16 Pro Max</div>
                  <div className="font-mono text-[11px] text-slate-500 font-semibold mt-0.5">IMEI: 354892019283741</div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-center space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Registered By</div>
                  <div className="flex items-center justify-center gap-2">
                    {businessProfile.showLogo && (
                      <img src={businessProfile.logoUrl} alt="Logo" className="w-5 h-5 rounded object-cover" />
                    )}
                    {businessProfile.showName && (
                      <span className="font-bold text-xs text-slate-900">{businessProfile.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-left bg-white p-3 rounded-xl border border-slate-200 text-xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 font-medium">
                  Internal supplier costs, wholesale margins, and private ledger records are never exposed to customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Multi-Staff Permission Management:</span> Your store owner account controls staff roles and branch access. Assigned staff can register devices and record sales without seeing private store financials.
            </div>
          </div>

          {/* KPI Summary Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Total Users</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{usersList.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Active Staff</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
                {usersList.filter((u) => u.status === 'ACTIVE').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Inactive</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1">
                {usersList.filter((u) => u.status === 'INACTIVE').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <span className="text-xs font-semibold text-slate-500">Pending Invites</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-400 mt-1">0</div>
            </div>
          </div>

          {/* Table Card Container */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search staff name or email..."
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium text-slate-900"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Management">Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Technician">Technician</option>
                </select>

                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
                >
                  <option value="ALL">All Branches</option>
                  <option value="Ikeja">Ikeja Main Store</option>
                  <option value="Lekki">Lekki Branch</option>
                </select>

                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Staff Member
                </Button>
              </div>
            </div>

            {/* Mobile Cards View (Hidden on larger screens) */}
            <div className="block sm:hidden space-y-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.color} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>
                        {u.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Role</span>
                      <span className="font-bold text-slate-800">{u.role}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Branch</span>
                      <span className="text-slate-600 font-medium">{u.branch}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Status</span>
                      {u.status === 'ACTIVE' ? (
                        <Badge variant="verified" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-600 border-slate-200">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Active</span>
                      <span className="text-slate-500 text-[11px] font-medium">{u.lastActive}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200 text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Branch Location</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${u.color} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>
                            {u.initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{u.role}</td>
                      <td className="px-4 py-3 text-slate-600">{u.branch}</td>
                      <td className="px-4 py-3">
                        {u.status === 'ACTIVE' ? (
                          <Badge variant="verified" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm" className="bg-slate-100 text-slate-600 border-slate-200">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{u.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCHES */}
      {activeSubTab === 'branches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Retail Store Locations</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage multi-branch inventory LEDGER and staff locations.</p>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Add Store Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((b) => (
              <div key={b.id} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="font-extrabold text-slate-900 text-base">{b.name}</span>
                  </div>
                  {b.isHeadquarters && (
                    <Badge variant="verified" size="sm">HEADQUARTERS</Badge>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">{b.address}</p>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Staff</span>
                    <span className="font-extrabold text-slate-900 text-sm">{b.staffCount} Team Members</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Stock Valuation</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{b.stockValue}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">{b.phone}</span>
                  <Button variant="secondary" size="sm" className="text-xs font-bold">Manage Branch</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BILLING & PLAN */}
      {activeSubTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Subscription Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl space-y-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <Badge variant="verified" size="sm" className="bg-blue-600 text-white border-none mb-2">
                  ACTIVE SUBSCRIPTION
                </Badge>
                <h2 className="text-2xl font-extrabold tracking-tight">Business Scale Plan</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Renews on September 12, 2026 • ₦45,000 / month
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold">
                  Manage Billing
                </Button>
                <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
                  Upgrade Plan →
                </Button>
              </div>
            </div>

            {/* Plan Usage Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Phone Registrations</span>
                  <span className="text-emerald-400">1,240 / 2,000</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[62%]" />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Store Branches</span>
                  <span className="text-blue-400">2 / 3 Branches</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[66%]" />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Staff Accounts</span>
                  <span className="text-indigo-400">5 / 10 Accounts</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[50%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Unsaved Changes Floating Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 right-6 left-6 md:left-[300px] bg-slate-900 text-white p-4 px-6 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold">Unsaved changes made to business settings</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Discard Changes
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
