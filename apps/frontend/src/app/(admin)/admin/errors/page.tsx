'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Copy,
  Check,
  Terminal,
  Clock,
  Globe,
  User,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Code,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminErrorsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalErrors: 0, serverErrors500: 0, clientErrors400: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusCode, setSelectedStatusCode] = useState<number | null>(null);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getErrorLogs({
        search: searchQuery.trim() || undefined,
        statusCode: selectedStatusCode || undefined,
        errorType: selectedErrorType || undefined,
        limit: 100,
      });

      if (res) {
        setLogs(res.logs || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch error logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedStatusCode, selectedErrorType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all recorded error logs?')) return;
    try {
      await api.clearAllErrorLogs();
      setActionSuccess('All error logs cleared.');
      setSelectedLog(null);
      fetchLogs();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Failed to clear logs: ' + err.message);
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      await api.deleteErrorLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      if (selectedLog?.id === id) {
        setSelectedLog(null);
      }
      setActionSuccess('Log entry deleted.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Failed to delete log: ' + err.message);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyDiagnosticReport = (log: any) => {
    const report = `### 🚨 NoxGuarda Error Diagnostic Report
- **Endpoint:** \`${log.method || 'GET'} ${log.endpoint || 'N/A'}\`
- **Status Code:** \`${log.statusCode || 500}\`
- **Error Type:** \`${log.errorType || 'Error'}\`
- **Timestamp:** \`${new Date(log.createdAt).toISOString()}\`
- **User Email:** \`${log.userEmail || 'Unauthenticated / Anonymous'}\`
- **Business ID:** \`${log.businessId || 'N/A'}\`

#### 📝 Error Message:
\`\`\`
${log.message}
\`\`\`

#### 🔍 Stack Trace:
\`\`\`
${log.stack || 'No stack trace captured'}
\`\`\`
`;
    copyToClipboard(report, 'full-report');
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              System Error Logs & Diagnostics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time telemetry and error log tracker for backend endpoints, database queries, and server exceptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-xs transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Errors Logged</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalErrors}</p>
          <p className="text-[11px] text-slate-400 font-medium">Recorded exception events</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span>500 Server Errors</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700">{stats.serverErrors500}</p>
          <p className="text-[11px] text-rose-600/80 font-medium">Internal server / unhandled errors</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>4xx Client / Validation</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">{stats.clientErrors400}</p>
          <p className="text-[11px] text-amber-600/80 font-medium">Bad requests, 404s, or conflicts</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by endpoint (/dashboard/summary), error type (Prisma), user email, or message..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Search Logs
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          <button
            onClick={() => setSelectedStatusCode(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatusCode === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Statuses
          </button>
          <button
            onClick={() => setSelectedStatusCode(500)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatusCode === 500 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            500 Internal Error
          </button>
          <button
            onClick={() => setSelectedStatusCode(400)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatusCode === 400 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            400 Bad Request
          </button>
          <button
            onClick={() => setSelectedStatusCode(409)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              selectedStatusCode === 409 ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            409 Conflict / Duplicate
          </button>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
            <p className="text-xs font-bold">Fetching diagnostic logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <div>
              <p className="text-sm font-black text-slate-700">No Error Logs Found</p>
              <p className="text-xs text-slate-400 mt-0.5">Your system is currently running clean with zero recorded errors.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">HTTP & Route</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Error Type</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const is500 = (log.statusCode || 500) >= 500;
                  const dateStr = new Date(log.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            log.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            log.method === 'GET' ? 'bg-emerald-100 text-emerald-800' :
                            log.method === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.method || 'GET'}
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[200px]">
                            {log.endpoint || '/'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                          is500 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {log.statusCode || 500}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-700 font-semibold truncate max-w-[150px] block">
                          {log.errorType || 'Error'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-slate-600 font-medium truncate max-w-[320px]">
                          {log.message}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOne(log.id);
                            }}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition"
                            title="Delete this log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  (selectedLog.statusCode || 500) >= 500 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900">{selectedLog.method || 'GET'} {selectedLog.endpoint}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      (selectedLog.statusCode || 500) >= 500 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      HTTP {selectedLog.statusCode || 500}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Error Message Card */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{selectedLog.errorType || 'Error Exception'}</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedLog.message, 'message')}
                    className="text-[11px] font-bold text-rose-700 hover:underline flex items-center gap-1"
                  >
                    {copiedField === 'message' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'message' ? 'Copied' : 'Copy Message'}</span>
                  </button>
                </div>
                <p className="text-rose-900 font-mono font-medium leading-relaxed break-words">
                  {selectedLog.message}
                </p>
              </div>

              {/* Context Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">User Context</span>
                  <p className="font-bold text-slate-900 font-mono text-xs">{selectedLog.userEmail || 'Anonymous / Unauthenticated'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Business Store ID</span>
                  <p className="font-bold text-slate-900 font-mono text-xs truncate">{selectedLog.businessId || 'N/A'}</p>
                </div>
              </div>

              {/* Stack Trace Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-slate-500" />
                    <span>Stack Trace (Source Lines)</span>
                  </label>
                  {selectedLog.stack && (
                    <button
                      onClick={() => copyToClipboard(selectedLog.stack, 'stack')}
                      className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'stack' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'stack' ? 'Copied Stack' : 'Copy Stack'}</span>
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[220px] shadow-inner border border-slate-800">
                  <pre className="whitespace-pre-wrap break-words">{selectedLog.stack || 'No stack trace captured.'}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => copyDiagnosticReport(selectedLog)}
                className="w-full sm:w-auto px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                {copiedField === 'full-report' ? <Check className="w-3.5 h-3.5 text-white" /> : <FileText className="w-3.5 h-3.5" />}
                <span>{copiedField === 'full-report' ? 'Report Copied to Clipboard!' : 'Copy Full Diagnostic Report'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleDeleteOne(selectedLog.id)}
                  className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-xs rounded-xl transition"
                >
                  Delete Entry
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
