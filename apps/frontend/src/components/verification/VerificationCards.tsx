'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Calendar,
  UserCheck,
  Store,
  QrCode,
  AlertOctagon,
  Award,
  Clock,
  ExternalLink,
} from 'lucide-react';

export interface VerifiedPhoneData {
  imei: string;
  serialNumber: string;
  makeModel: string;
  colorStorage: string;
  retailerName: string;
  branch: string;
  purchaseDate: string;
  customerName: string;
  warrantyStatus: 'ACTIVE' | 'EXPIRED';
  warrantyUntil: string;
}

// 1. Verified Phone Card Component
export function VerifiedPhoneCard({ data }: { data: VerifiedPhoneData }) {
  const isWarrantyActive = data.warrantyStatus === 'ACTIVE';

  return (
    <Card className="p-6 border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-50/40 to-white relative overflow-hidden">
      {/* Verification Stamp Banner */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Official Retail Record Verified
            </h3>
            <p className="text-xs text-emerald-700 font-medium">Verified by VerifyFlow Enterprise Network</p>
          </div>
        </div>
        <Badge variant="verified" size="md">
          GENUINE PRODUCT
        </Badge>
      </div>

      {/* Main Device Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Device / Model</div>
            <div className="text-sm font-bold text-slate-900">{data.makeModel}</div>
            <div className="text-xs text-slate-500">{data.colorStorage}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <Store className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-xs font-semibold text-slate-500">Authorized Retailer</div>
            <div className="text-sm font-bold text-slate-900">{data.retailerName}</div>
            <div className="text-xs text-slate-500">{data.branch} Branch</div>
          </div>
        </div>
      </div>

      {/* Key Numbers & Warranty Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          <div className="text-[11px] text-slate-500 font-medium">IMEI Number</div>
          <div className="font-mono font-bold text-slate-800 truncate mt-0.5">{data.imei}</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          <div className="text-[11px] text-slate-500 font-medium">Serial Number</div>
          <div className="font-mono font-bold text-slate-800 truncate mt-0.5">{data.serialNumber}</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          <div className="text-[11px] text-slate-500 font-medium">Purchase Date</div>
          <div className="font-semibold text-slate-800 mt-0.5">{data.purchaseDate}</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
          <div className="text-[11px] text-slate-500 font-medium">Registered Buyer</div>
          <div className="font-semibold text-slate-800 truncate mt-0.5">{data.customerName}</div>
        </div>
      </div>

      {/* Warranty Pill Banner */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">Manufacturer Warranty:</span>
          {isWarrantyActive ? (
            <Badge variant="warrantyActive">Active until {data.warrantyUntil}</Badge>
          ) : (
            <Badge variant="warrantyExpired">Expired on {data.warrantyUntil}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
          Download Certificate
        </Button>
      </div>
    </Card>
  );
}

// 2. Phone Not Found Card
export function PhoneNotFoundCard({ searchedTerm }: { searchedTerm: string }) {
  return (
    <Card className="p-6 border-2 border-rose-200 bg-rose-50/30 text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <Badge variant="error" size="md" className="mb-2">
        RECORD NOT FOUND
      </Badge>
      <h3 className="text-base font-bold text-slate-900">Unverified Phone Identifier</h3>
      <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md leading-relaxed">
        No official retail registration found for <code className="px-1.5 py-0.5 bg-rose-100/70 rounded font-mono text-rose-900 font-bold">{searchedTerm}</code>. This device may not have been purchased through an authorized VerifyFlow partner.
      </p>

      <div className="mt-5 flex items-center gap-3">
        <Button variant="secondary" size="sm">
          Try Different Search
        </Button>
        <Button variant="destructive" size="sm" leftIcon={<AlertOctagon className="w-3.5 h-3.5" />}>
          Report Stolen / Suspicious
        </Button>
      </div>
    </Card>
  );
}

// 3. QR Scan Feedback Cards
export function QRScanSuccessCard({ code }: { code: string }) {
  return (
    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
          <QrCode className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-emerald-950">QR Code Scanned</div>
          <div className="text-[11px] font-mono text-emerald-700">{code}</div>
        </div>
      </div>
      <Badge variant="verified" size="sm">
        Scanned
      </Badge>
    </div>
  );
}
