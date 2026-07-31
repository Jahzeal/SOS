'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Building, ShieldCheck, Receipt, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const plan = mounted ? user?.business?.plan || 'STARTER' : 'STARTER';

  const [activeTab, setActiveTab] = useState<'business' | 'verification' | 'receipt'>('business');
  const [saved, setSaved] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({
    name: 'PhoneWorks Retail',
    email: 'contact@phoneworks.com',
    phone: '+1 800 555 0199',
    address: '104 Tech Boulevard, Suite 400',
    publicVerificationEnabled: true,
    customSuccessMessage: 'This phone is verified authentic by PhoneWorks Retail.',
    receiptFooter: 'Thank you for buying from PhoneWorks Retail! 12 Months Warranty Included.',
    paperSize: '80mm',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Configure business profile, public verification page, and receipt builder.</p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg font-medium">
            <Check className="w-4 h-4" /> Settings Saved!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('business')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'business'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" /> Business Info
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'verification'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Verification Portal
        </button>

        <button
          onClick={() => setActiveTab('receipt')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'receipt'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" /> Receipt Builder {plan !== 'ENTERPRISE' && '(Enterprise Tier)'}
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl space-y-6">
        {activeTab === 'business' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Store Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Store Email</label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Public Verification Settings</h3>
            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="pubCheck"
                checked={businessInfo.publicVerificationEnabled}
                onChange={(e) => setBusinessInfo({ ...businessInfo, publicVerificationEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="pubCheck" className="text-xs text-slate-300 font-medium">
                Enable Public Customer Verification Portal
              </label>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Custom Verification Success Message</label>
              <textarea
                rows={3}
                value={businessInfo.customSuccessMessage}
                onChange={(e) => setBusinessInfo({ ...businessInfo, customSuccessMessage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>
        )}

        {activeTab === 'receipt' && (
          <div className="space-y-4">
            {plan !== 'ENTERPRISE' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-medium">
                Receipt Builder is an Enterprise feature. Switch your plan tier in the sidebar to test full customization.
              </div>
            )}
            <h3 className="text-sm font-bold text-white">Receipt Design & Layout</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Paper Size</label>
              <select
                disabled={plan !== 'ENTERPRISE'}
                value={businessInfo.paperSize}
                onChange={(e) => setBusinessInfo({ ...businessInfo, paperSize: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              >
                <option value="80mm">Thermal 80mm POS Roll</option>
                <option value="58mm">Thermal 58mm POS Roll</option>
                <option value="A4">Standard A4 Sheet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Receipt Footer Note</label>
              <input
                type="text"
                disabled={plan !== 'ENTERPRISE'}
                value={businessInfo.receiptFooter}
                onChange={(e) => setBusinessInfo({ ...businessInfo, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
