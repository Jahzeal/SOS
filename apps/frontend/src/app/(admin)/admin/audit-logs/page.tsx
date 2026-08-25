'use client';

import React from 'react';
import { FileText, ShieldAlert, CheckCircle2, User, Clock, Lock } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const auditLogs = [
    { actor: 'VerifyFlow HQ Admin', action: 'SUSPEND_STORE', target: 'Abuja Tech Point', reason: 'Repeated non-payment of subscription invoice', time: 'Aug 19, 12:42 PM', ip: '102.89.44.12' },
    { actor: 'VerifyFlow HQ Admin', action: 'PLAN_UPGRADE', target: 'Dave Phones', reason: 'Upgraded to Business Plan upon Paystack checkout', time: 'Aug 19, 11:18 AM', ip: '102.89.44.12' },
    { actor: 'System Auto-Engine', action: 'NEW_BUSINESS_REGISTERED', target: 'Phone Plaza Ikeja', reason: 'Onboarding registration completed', time: 'Aug 19, 10:04 AM', ip: '197.210.65.8' },
    { actor: 'VerifyFlow HQ Admin', action: 'RATE_LIMIT_OVERRIDE', target: 'Mobile Hub Lagos', reason: 'Authorized 50,000 extra monthly API lookups', time: 'Aug 18, 04:30 PM', ip: '102.89.44.12' },
  ];

  return (
    <div className="space-y-6 pb-8 font-sans">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Security Audit Logs</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Immutable platform security audit trail recording all administrative actions, plan overrides, and store interventions.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200 uppercase">
                <th className="py-3 px-4 font-semibold">Actor / Admin</th>
                <th className="py-3 px-4 font-semibold">Action Code</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">Details & Reason</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {auditLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.actor}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 text-[11px]">{log.action}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{log.target}</td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{log.reason}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ip}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-[11px]">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
