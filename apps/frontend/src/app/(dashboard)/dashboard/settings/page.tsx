'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';

export default function RebuiltSettingsPage() {
  const { user } = useAuthStore();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'users' | 'branches' | 'billing'>('profile');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Paystack & Billing State
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [liveBusinessData, setLiveBusinessData] = useState<any>(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);
  const [isPaystackModalOpen, setIsPaystackModalOpen] = useState(false);

  const logoInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          handleProfileChange('logoUrl', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleProfileChange('logoUrl', '');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    name: user?.business?.name || '',
    legalName: '',
    businessType: 'retail',
    phone: '',
    email: user?.email || '',
    address: '',
    logoUrl: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    showName: true,
    showLogo: true,
    showPhone: true,
    showEmail: false,
    showWebsite: false,
  });

  const loadLiveProfileAndPlans = async () => {
    try {
      const [profileData, plansData] = await Promise.all([
        api.getBusinessProfile().catch(() => null),
        api.getPlans().catch(() => null),
      ]);

      if (profileData) {
        setLiveBusinessData(profileData);
        setBusinessProfile((prev) => ({
          ...prev,
          name: profileData.name || prev.name,
          phone: profileData.phone || prev.phone,
          email: profileData.email || prev.email,
          address: profileData.address || prev.address,
          logoUrl: profileData.logoUrl || prev.logoUrl,
          bankName: profileData.bankName || '',
          accountNumber: profileData.accountNumber || '',
          accountName: profileData.accountName || '',
        }));
      }

      if (plansData?.plans) {
        setAvailablePlans(plansData.plans);
      }
    } catch (err) {
      console.warn('Backend business profile load skipped/offline:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadLiveProfileAndPlans();
  }, []);

  // Users & Roles State
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [usersList, setUsersList] = useState([
    { id: '1', name: 'David Ibeh', email: 'david@example.com', role: 'Management', branch: 'All Branches', status: 'ACTIVE', lastActive: 'Just now', initials: 'DI', color: 'bg-teal-600' },
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

  const handleSaveChanges = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.updateBusinessSettings({
        name: businessProfile.name,
        phone: businessProfile.phone,
        email: businessProfile.email,
        address: businessProfile.address,
        logoUrl: businessProfile.logoUrl,
        bankName: businessProfile.bankName,
        accountNumber: businessProfile.accountNumber,
        accountName: businessProfile.accountName,
      });

      setHasUnsavedChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error('Failed to update business settings:', err);
      setSaveError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
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
                <Building className="w-4 h-4 text-teal-600" />
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
                  activeSubTab === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4 shrink-0 text-teal-600" />
                <span>Business Profile</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('users');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'users' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-teal-600" />
                <span>Users & Roles</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('branches');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'branches' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4 shrink-0 text-teal-600" />
                <span>Branches</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('billing');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition font-bold text-left ${
                  activeSubTab === 'billing' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-teal-600" />
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
                <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center shadow-subtle relative group">
                  {businessProfile.logoUrl ? (
                    <img
                      src={businessProfile.logoUrl}
                      alt="Business Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Building className="w-8 h-8 text-slate-400" />
                      <span className="text-[10px] font-bold">No Logo</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This logo appears on digital QR receipts, thermal receipts, and public IMEI verification pages. Recommended size: 512x512px.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      Upload New Logo
                    </Button>
                    {businessProfile.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 font-bold"
                        onClick={handleRemoveLogo}
                      >
                        Remove
                      </Button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Legal Name</label>
                  <input
                    type="text"
                    value={businessProfile.legalName}
                    onChange={(e) => handleProfileChange('legalName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-800">Business Category / Type</label>
                <select
                  value={businessProfile.businessType}
                  onChange={(e) => handleProfileChange('businessType', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Store Email Address</label>
                  <input
                    type="email"
                    value={businessProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-800">Physical Store Address</label>
                <textarea
                  rows={3}
                  value={businessProfile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Store Settlement & Bank Transfer Account Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Store Settlement & Bank Account
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Displayed to cashiers on the POS counter checkout screen when customers pay via Bank Transfer.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Bank Name</label>
                  <input
                    type="text"
                    value={businessProfile.bankName}
                    onChange={(e) => handleProfileChange('bankName', e.target.value)}
                    placeholder="e.g. Access Bank, Opay, GTBank"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Account Number (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={businessProfile.accountNumber}
                    onChange={(e) => handleProfileChange('accountNumber', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 0123456789"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Account Beneficiary Name</label>
                  <input
                    type="text"
                    value={businessProfile.accountName}
                    onChange={(e) => handleProfileChange('accountName', e.target.value)}
                    placeholder="e.g. Apex Cellular Hub Ltd"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
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
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
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
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
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
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 text-xs text-teal-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
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
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 mt-1">
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
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 font-medium text-slate-900"
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
                    <Store className="w-5 h-5 text-teal-600" />
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
        <div className="space-y-8">
          {/* Current Subscription Status Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl space-y-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {liveBusinessData?.subscriptionStatus === 'ACTIVE' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white shadow-sm">
                      Active (Paid Subscription)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500 text-white shadow-sm">
                      14-Day Free Trial
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    Tier: {liveBusinessData?.plan || user?.business?.plan || 'STARTER'}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white">
                  {liveBusinessData?.plan === 'ENTERPRISE'
                    ? 'Enterprise Network Plan'
                    : liveBusinessData?.plan === 'BUSINESS'
                    ? 'Business Hub Plan'
                    : 'Starter Retailer Plan'}
                </h2>
                
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {liveBusinessData?.subscriptionEndsAt ? (
                    <>Active until {new Date(liveBusinessData.subscriptionEndsAt).toLocaleDateString()} • Renews via Paystack</>
                  ) : liveBusinessData?.trialEndsAt ? (
                    <>Trial ends on {new Date(liveBusinessData.trialEndsAt).toLocaleDateString()} • Upgrade to maintain full access</>
                  ) : (
                    <>Instant verification, POS, and thermal receipt generation active</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const upgradePlan = availablePlans.find((p) => p.code !== (liveBusinessData?.plan || 'STARTER')) || availablePlans[0];
                    if (upgradePlan) {
                      setSelectedPlanForCheckout(upgradePlan);
                      setIsPaystackModalOpen(true);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade with Paystack →
                </Button>
              </div>
            </div>

            {/* Live Store Usage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Registered Devices</span>
                  <span className="text-emerald-400 font-mono">
                    {liveBusinessData?._count?.phoneRecords || 0} Devices
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Total Sales Processed</span>
                  <span className="text-teal-400 font-mono">
                    {liveBusinessData?._count?.sales || 0} Receipts
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Staff Accounts</span>
                  <span className="text-indigo-400 font-mono">
                    {liveBusinessData?._count?.users || 1} Staff
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Available Subscription Plans */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Available Subscription Tiers</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Select a subscription plan to upgrade or renew your store directly with Paystack.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePlans.map((p) => {
                const isCurrent = (liveBusinessData?.plan || 'STARTER').toUpperCase() === p.code.toUpperCase();
                return (
                  <div
                    key={p.code}
                    className={`p-6 rounded-3xl bg-white border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-lg">{p.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Current Tier
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {p.description || 'Ideal for expanding phone stores & gadget retailers.'}
                      </p>

                      <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          ₦{p.monthlyPriceNgn.toLocaleString()}
                          <span className="text-xs text-slate-400 font-sans font-medium ml-1">/ month</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          or ₦{(p.annualPriceNgn || p.monthlyPriceNgn * 10).toLocaleString()} / year (Save ~17%)
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Features Included:</div>
                        <div className="space-y-1.5 text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p.maxDevices ? `Up to ${p.maxDevices.toLocaleString()} Devices` : 'Unlimited Devices'}</span>
                          </div>
                          {Array.isArray(p.features) &&
                            p.features.map((feat: string, fIdx: number) => (
                              <div key={fIdx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedPlanForCheckout(p);
                          setIsPaystackModalOpen(true);
                        }}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isCurrent ? 'Renew / Extend with Paystack' : `Upgrade to ${p.name}`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Paystack Checkout Modal */}
      {isPaystackModalOpen && selectedPlanForCheckout && (
        <PaystackCheckoutModal
          isOpen={isPaystackModalOpen}
          onClose={() => setIsPaystackModalOpen(false)}
          plan={selectedPlanForCheckout}
          onSuccess={(updatedBiz) => {
            setLiveBusinessData(updatedBiz);
            loadLiveProfileAndPlans();
          }}
        />
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
