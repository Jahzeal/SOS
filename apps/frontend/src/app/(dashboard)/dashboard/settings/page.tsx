'use client';


import { notify, confirmDialog } from '@/lib/feedback';
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
  UserCircle,
  Lock,
  Key,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select, Textarea, TextInput } from '@/components/ui/Input';
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from '@/components/ui/DataTable';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { TeamPanel } from '@/components/team/TeamPanel';
import { BranchesPanel } from '@/components/team/BranchesPanel';
import { can } from '@/lib/permissions';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function RebuiltSettingsPage() {
  const { user, setAuth, logout } = useAuthStore();
  // Which settings sections this person's role may open.
  const canSee = (tab: 'account' | 'profile' | 'users' | 'branches' | 'billing') =>
    tab === 'account' ||
    (tab === 'profile' && can(user, 'storeSettings')) ||
    ((tab === 'users' || tab === 'branches') && can(user, 'manageStaff')) ||
    (tab === 'billing' && can(user, 'billing'));
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'profile' | 'users' | 'branches' | 'billing'>('account');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete Account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Operator Account Profile State
  const [operatorForm, setOperatorForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setOperatorForm((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

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
        notify('File size exceeds 5MB limit. Please choose a smaller image.');
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

  // Handle Operator Profile Save
  const handleSaveOperatorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorForm.firstName.trim()) {
      setSaveError('First Name cannot be empty.');
      return;
    }
    if (operatorForm.password && operatorForm.password !== operatorForm.confirmPassword) {
      setSaveError('Passwords do not match.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.updateUserProfile({
        firstName: operatorForm.firstName.trim(),
        lastName: operatorForm.lastName.trim(),
        password: operatorForm.password ? operatorForm.password.trim() : undefined,
      });

      if (res?.user) {
        const token = localStorage.getItem('vf_access_token') || '';
        setAuth(res.user, token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('vf_user', JSON.stringify(res.user));
        }
      }

      setOperatorForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update operator profile:', err);
      setSaveError(err.message || 'Failed to update operator profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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


  return (
    <div className="space-y-6 pb-24 font-sans text-slate-900">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Settings & Workspace Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Manage your personal operator account, store profile, team members, branches, and subscription.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 text-success-800 text-xs font-bold rounded-xl shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-success-600" /> Changes Saved Successfully!
          </div>
        )}
      </div>

      {/* Settings Tab Dropdown Select */}
      <div className="relative z-30 max-w-xs">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
          aria-label="Settings section"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-control shadow-subtle text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {activeSubTab === 'account' && (
              <>
                <UserCircle className="w-4 h-4 text-accent-600" />
                <span>My Account (Operator)</span>
              </>
            )}
            {activeSubTab === 'profile' && (
              <>
                <Building className="w-4 h-4 text-accent-600" />
                <span>Business & Store Profile</span>
              </>
            )}
            {activeSubTab === 'users' && (
              <>
                <Users className="w-4 h-4 text-accent-600" />
                <span>Users & Roles</span>
              </>
            )}
            {activeSubTab === 'branches' && (
              <>
                <Store className="w-4 h-4 text-accent-600" />
                <span>Branches</span>
              </>
            )}
            {activeSubTab === 'billing' && (
              <>
                <CreditCard className="w-4 h-4 text-accent-600" />
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
            <div role="menu" className="absolute left-0 mt-2 w-full bg-white rounded-card border border-slate-200 shadow-xl p-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSubTab('account');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-control transition-colors font-bold text-left cursor-pointer ${
                  activeSubTab === 'account' ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <UserCircle className="w-4 h-4 shrink-0 text-accent-600" />
                <span>My Account (Operator)</span>
              </button>
              {canSee('profile') && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSubTab('profile');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-control transition-colors font-bold text-left cursor-pointer ${
                  activeSubTab === 'profile' ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4 shrink-0 text-accent-600" />
                <span>Business & Store Profile</span>
              </button>
              )}
              {canSee('users') && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSubTab('users');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-control transition-colors font-bold text-left cursor-pointer ${
                  activeSubTab === 'users' ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-accent-600" />
                <span>Users & Roles</span>
              </button>
              )}
              {canSee('branches') && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSubTab('branches');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-control transition-colors font-bold text-left cursor-pointer ${
                  activeSubTab === 'branches' ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4 shrink-0 text-accent-600" />
                <span>Branches</span>
              </button>
              )}
              {canSee('billing') && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveSubTab('billing');
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-control transition-colors font-bold text-left cursor-pointer ${
                  activeSubTab === 'billing' ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-accent-600" />
                <span>Billing & Plan</span>
              </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: OPERATOR ACCOUNT PROFILE                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveOperatorProfile} className="space-y-6">
              
              {saveError && (
                <div className="p-3.5 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{saveError}</span>
                </div>
              )}

              {/* Personal Details Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Personal Operator Information</h3>
                    <p className="text-xs text-slate-500 font-medium">This name is used for dashboard greetings, activity logs, and receipts.</p>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-accent-50 text-accent-700 border border-accent-200 uppercase">
                    {user?.role || 'OWNER'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <TextInput
                      label="First Name"
                      type="text"
                      value={operatorForm.firstName}
                      onChange={(e) => setOperatorForm({ ...operatorForm, firstName: e.target.value })}
                      placeholder="e.g. Collins"
                      required
                    />
                  </div>

                  <div>
                    <TextInput
                      label="Last Name"
                      type="text"
                      value={operatorForm.lastName}
                      onChange={(e) => setOperatorForm({ ...operatorForm, lastName: e.target.value })}
                      placeholder="e.g. Nwadia"
                    />
                  </div>
                </div>

                <div>
                  <TextInput
                    label="Login Email Address"
                    type="email"
                    value={operatorForm.email}
                    disabled
                  />
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Your authenticated account identifier. Contact support if you need to transfer ownership.
                  </p>
                </div>
              </div>

              {/* Password & Security Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span>Change Password</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Leave blank if you do not want to change your current login password.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <TextInput
                      label="New Password"
                      type="password"
                      value={operatorForm.password}
                      onChange={(e) => setOperatorForm({ ...operatorForm, password: e.target.value })}
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div>
                    <TextInput
                      label="Confirm New Password"
                      type="password"
                      value={operatorForm.confirmPassword}
                      onChange={(e) => setOperatorForm({ ...operatorForm, confirmPassword: e.target.value })}
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={saving}
                >
                  Save Account Changes
                </Button>
              </div>
            </form>

            {/* Danger Zone — OWNER only */}
            {user?.storeRole === 'OWNER' && (
              <div className="p-5 rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 space-y-3">
                <div className="flex items-center gap-2 border-b border-red-200 dark:border-red-900/60 pb-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400">Danger Zone</h4>
                </div>
                <p className="text-xs text-red-700/80 dark:text-red-400/80 font-medium leading-relaxed">
                  Permanently delete your store and all associated data — inventory, sales, customers, staff, and billing history.
                  This action is <span className="font-bold">irreversible</span>.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(null); }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Delete Account
                </button>
              </div>
            )}
          </div>

          {/* Right Operator Summary Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 dark:bg-accent-600 text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-md">
                {operatorForm.firstName?.[0] || 'U'}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {operatorForm.firstName || 'Store'} {operatorForm.lastName || 'Owner'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{operatorForm.email}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-left space-y-2">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Account Role:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{user?.role || 'STORE OWNER'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Primary Store:</span>
                  <span className="font-bold text-accent-700 dark:text-accent-400 truncate max-w-[130px]">{user?.business?.name || 'My Store'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Branch Access:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">All Branches</span>
                </div>
              </div>
            </div>

            {/* Appearance & Theme Preferences */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-warning-500" />
                  <span>Theme & Appearance</span>
                </h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 border border-accent-200/60 dark:border-accent-800/40">
                  Instant Switch
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Choose how NOXGUARDA looks on your display. Supports Light, Dark, and automatic system detection.
              </p>
              <div className="pt-1 flex justify-center">
                <ThemeToggle variant="compact" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900 w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Account Permanently</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This will erase your store, all inventory, sales, customers, and staff. <span className="font-bold text-red-600 dark:text-red-400">This cannot be undone.</span>
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{deleteError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm your password to continue
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                autoComplete="current-password"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || !deletePassword}
                onClick={async () => {
                  setDeleteError(null);
                  setDeleting(true);
                  try {
                    await api.deleteAccount(deletePassword);
                    // Clear session and redirect
                    logout();
                    window.location.href = '/login?deleted=true';
                  } catch (err: any) {
                    setDeleteError(err?.message || 'Failed to delete account. Check your password.');
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : null}
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <span className="text-xs font-bold">No Logo</span>
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
                        variant="ghostDanger"
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        Remove
                      </Button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      aria-label="Upload New Logo"
                      tabIndex={-1}
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
                  <TextInput
                    label="Business Name"
                    type="text"
                    value={businessProfile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <TextInput
                    label="Legal Name"
                    type="text"
                    value={businessProfile.legalName}
                    onChange={(e) => handleProfileChange('legalName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <Select
                  label="Business Category / Type"
                  value={businessProfile.businessType}
                  onChange={(e) => handleProfileChange('businessType', e.target.value)}
                >
                  <option value="retail">Phone Retailer & Gadgets Store</option>
                  <option value="wholesale">Wholesale Phone Distributor</option>
                  <option value="repair">Device Repair Center</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <TextInput
                    label="Store Phone Number"
                    type="tel"
                    value={businessProfile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <TextInput
                    label="Store Email Address"
                    type="email"
                    value={businessProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <Textarea
                  label="Physical Store Address"
                  rows={3}
                  value={businessProfile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  className="resize-none"
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
                <div className="p-2 rounded-xl bg-accent-50 text-accent-700 border border-accent-100">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <TextInput
                    label="Bank Name"
                    type="text"
                    value={businessProfile.bankName}
                    onChange={(e) => handleProfileChange('bankName', e.target.value)}
                    placeholder="e.g. Access Bank, Opay, GTBank"
                  />
                </div>

                <div className="space-y-1.5">
                  <TextInput
                    label="Account Number (10 Digits)"
                    type="text"
                    maxLength={10}
                    value={businessProfile.accountNumber}
                    onChange={(e) => handleProfileChange('accountNumber', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 0123456789"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <TextInput
                    label="Account Beneficiary Name"
                    type="text"
                    value={businessProfile.accountName}
                    onChange={(e) => handleProfileChange('accountName', e.target.value)}
                    placeholder="e.g. Apex Cellular Hub Ltd"
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
                  <label key={item.key} htmlFor={`setting-${item.key}`} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <input
                      id={`setting-${item.key}`}
                      type="checkbox"
                      checked={(businessProfile as any)[item.key]}
                      onChange={(e) => handleProfileChange(item.key, e.target.checked)}
                      className="w-4 h-4 rounded accent-accent-600 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Live Customer Preview */}
            <div className="p-6 rounded-2xl bg-slate-100/70 border border-slate-200/80 shadow-sm text-center space-y-4">
              <div className="text-xs font-extrabold uppercase text-slate-500 tracking-wider text-left">
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
                  <div className="font-mono text-xs text-slate-500 font-semibold mt-0.5">IMEI: 354892019283741</div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-center space-y-1">
                  <div className="text-xs uppercase font-bold text-slate-400">Registered By</div>
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
                <Info className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 font-medium">
                  Internal supplier costs, wholesale margins, and private ledger records are never exposed to customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {/* Users & Roles: real staff accounts (owners and managers only) */}
      {activeSubTab === 'users' && canSee('users') && <TeamPanel />}

      {/* Branches: real branches (owners manage, managers view) */}
      {activeSubTab === 'branches' && canSee('branches') && <BranchesPanel />}

      {activeSubTab === 'billing' && (
        <div className="space-y-8">
          {/* Current Subscription Status Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-xl space-y-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {liveBusinessData?.subscriptionStatus === 'ACTIVE' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-success-500 text-white shadow-sm">
                      Active (Paid Subscription)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-accent-500 text-white shadow-sm">
                      {liveBusinessData?.subscriptionStatus === 'TRIAL'
                        ? 'Trial'
                        : liveBusinessData?.subscriptionStatus === 'EXPIRED' || liveBusinessData?.subscriptionStatus === 'PAST_DUE'
                        ? 'Plan Expired'
                        : 'Free Forever'}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    Tier: {liveBusinessData?.plan || user?.business?.plan || 'FREE'}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-white">
                  {liveBusinessData?.plan === 'ENTERPRISE'
                    ? 'Enterprise Network Plan'
                    : liveBusinessData?.plan === 'BUSINESS'
                    ? 'Business Hub Plan'
                    : (liveBusinessData?.plan || 'FREE') === 'FREE'
                    ? 'Free Plan'
                    : 'Starter Retailer Plan'}
                </h2>
                
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {liveBusinessData?.subscriptionEndsAt ? (
                    <>Active until {new Date(liveBusinessData.subscriptionEndsAt).toLocaleDateString()} • Renews via Paystack</>
                  ) : liveBusinessData?.subscriptionStatus === 'EXPIRED' || (liveBusinessData?.subscriptionStatus === 'TRIAL' && liveBusinessData?.trialEndsAt && new Date(liveBusinessData.trialEndsAt) <= new Date()) ? (
                    <>
                      {liveBusinessData?.subscriptionStatus === 'TRIAL'
                        ? `Trial ended on ${new Date(liveBusinessData?.trialEndsAt || Date.now()).toLocaleDateString()}`
                        : 'Your plan has expired'}{' '}
                      • Pay for a plan to keep full access, or use the Free plan
                    </>
                  ) : liveBusinessData?.subscriptionStatus === 'TRIAL' && liveBusinessData?.trialEndsAt ? (
                    <>Trial ends on {new Date(liveBusinessData.trialEndsAt).toLocaleDateString()} • Pay anytime to keep full access</>
                  ) : (liveBusinessData?.plan || 'FREE') === 'FREE' ? (
                    <>Free forever • Up to 10 devices • Upgrade when you need more</>
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
                    // A Free store upgrades to the first paid plan; a paid store renews its own.
                    const upgradePlan =
                      availablePlans.find((p) => p.code === liveBusinessData?.plan && (p.monthlyPriceNgn || 0) > 0) ||
                      availablePlans.find((p) => (p.monthlyPriceNgn || 0) > 0) ||
                      availablePlans[0];
                    if (upgradePlan) {
                      setSelectedPlanForCheckout(upgradePlan);
                      setIsPaystackModalOpen(true);
                    }
                  }}
                  className="bg-success-600 hover:bg-success-500 text-white font-bold shadow-lg shadow-success-600/20"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {liveBusinessData?.subscriptionStatus === 'EXPIRED' || (liveBusinessData?.subscriptionStatus === 'TRIAL' && liveBusinessData?.trialEndsAt && new Date(liveBusinessData.trialEndsAt) <= new Date())
                    ? 'Pay & Activate Plan with Paystack →'
                    : 'Pay / Upgrade with Paystack →'}
                </Button>
              </div>
            </div>

            {/* Live Store Usage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Registered Devices</span>
                  <span className="text-success-400 font-mono">
                    {liveBusinessData?._count?.phoneRecords || 0} Devices
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-success-500 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Total Sales Processed</span>
                  <span className="text-accent-400 font-mono">
                    {liveBusinessData?._count?.sales || 0} Receipts
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-accent-500 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Staff Accounts</span>
                  <span className="text-accent-400 font-mono">
                    {liveBusinessData?._count?.users || 1} Staff
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-accent-500 rounded-full w-full" />
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
                    className={`p-6 rounded-2xl bg-white border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'border-accent-600 ring-2 ring-accent-600/20 shadow-md'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-lg">{p.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent-50 text-accent-700 border border-accent-200">
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
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          or ₦{(p.annualPriceNgn || p.monthlyPriceNgn * 10).toLocaleString()} / year (Save ~17%)
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 text-xs">
                        <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">Features Included:</div>
                        <div className="space-y-1.5 text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success-500 shrink-0" />
                            <span>{p.maxDevices ? `Up to ${p.maxDevices.toLocaleString()} Devices` : 'Unlimited Devices'}</span>
                          </div>
                          {Array.isArray(p.features) &&
                            p.features.map((feat: string, fIdx: number) => (
                              <div key={fIdx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-success-500 shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      <Button
                        fullWidth
                        size="lg"
                        variant={isCurrent ? 'secondary' : 'primary'}
                        className="text-xs"
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedPlanForCheckout(p);
                          setIsPaystackModalOpen(true);
                        }}
                      >
                        {isCurrent
                          ? liveBusinessData?.subscriptionStatus === 'EXPIRED' || (liveBusinessData?.subscriptionStatus === 'TRIAL' && liveBusinessData?.trialEndsAt && new Date(liveBusinessData.trialEndsAt) <= new Date())
                            ? `Pay & Activate ${p.name}`
                            : 'Renew / Extend with Paystack'
                          : `Switch to ${p.name}`}
                      </Button>
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
        <div className="fixed bottom-4 right-6 left-6 md:left-[300px] bg-slate-900 dark:bg-slate-800 text-white p-4 px-6 rounded-card border border-slate-800 dark:border-slate-700 shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-warning-400 animate-pulse" />
            <span className="text-xs font-bold">Unsaved changes made to business settings</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Discard Changes
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
