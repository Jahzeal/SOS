'use client';

import React from 'react';
import { HelpCircle, AlertCircle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export default function AdminSupportPage() {
  const tickets = [
    { id: '#1042', subject: 'IMEI verification showing incorrect result for iPhone 15', business: 'Dave Phones', priority: 'HIGH', status: 'OPEN', time: '20 min ago' },
    { id: '#1041', subject: 'Thermal receipt printer 80mm formatting margin issue', business: 'Mobile Hub Lagos', priority: 'MEDIUM', status: 'PENDING', time: '2 hours ago' },
    { id: '#1040', subject: 'Requesting plan upgrade to Enterprise Tier with API access', business: 'Phone Plaza Ikeja', priority: 'LOW', status: 'RESOLVED', time: 'Yesterday' },
  ];

  return (
    <div className="space-y-6 pb-8 font-sans">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Support & Helpdesk</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Review and resolve merchant support inquiries, technical issues, and verification disputes.
        </p>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-600 text-xs">{t.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  t.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {t.priority} Priority
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="font-bold text-xs text-slate-900">{t.business}</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{t.subject}</h3>
              <p className="text-xs text-slate-500 font-medium">Reported {t.time}</p>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                t.status === 'OPEN' ? 'bg-amber-50 text-amber-800 border border-amber-200' : t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
              }`}>
                {t.status}
              </span>
              <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                Resolve Ticket →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
