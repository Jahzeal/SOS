'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Clock,
  Send,
  Lock,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Check,
  ChevronDown,
  RotateCcw,
  Tag,
  AlertTriangle,
  FileText,
  History,
  X,
} from 'lucide-react';

interface Message {
  id: string;
  senderName: string;
  senderRole: string;
  senderType: 'requester' | 'admin' | 'internal_note';
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string }[];
}

interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const ticketId = resolvedParams.id || 'VF-1042';

  // Ticket State
  const [status, setStatus] = useState<'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed'>('Open');
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('High');
  const [assignee, setAssignee] = useState<string>('David');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Composer State
  const [composerMode, setComposerMode] = useState<'reply' | 'internal'>('reply');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Conversation Thread
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      senderName: 'Amaka Okafor',
      senderRole: 'Sales Staff',
      senderType: 'requester',
      content:
        'The customer scanned the QR code on the receipt, but VerifyFlow says the device cannot be found. They are standing right here at our Ikeja branch counter and need proof of clearance for customs.',
      timestamp: '25 Aug 2026 · 10:42 AM',
      attachments: [{ name: 'receipt_scan_error.png', size: '342 KB' }],
    },
    {
      id: 'm2',
      senderName: 'David',
      senderRole: 'VerifyFlow Support',
      senderType: 'admin',
      content:
        "Hello Amaka, we're checking the device record against the GSMA national gateway now. Looking into whether there was a momentary delay in receipt QR generation during POS sync.",
      timestamp: '25 Aug 2026 · 11:03 AM',
    },
    {
      id: 'm3',
      senderName: 'David',
      senderRole: 'Internal Staff Note',
      senderType: 'internal_note',
      content:
        'Checked device registry. IMEI 356892110482910 is cleared in carrier database, but receipt #REC-9821 had its status pending webhook confirmation. Triggering manual reconciliation.',
      timestamp: '25 Aug 2026 · 11:05 AM',
    },
  ]);

  // Activity Log
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([
    { id: 'a1', actor: 'Amaka Okafor', action: 'Created support ticket #VF-1042', timestamp: '10:42 AM' },
    { id: 'a2', actor: 'System', action: 'Assigned ticket to David', timestamp: '10:43 AM' },
    { id: 'a3', actor: 'David', action: 'Changed priority from Normal to High', timestamp: '10:45 AM' },
    { id: 'a4', actor: 'David', action: 'Sent reply to customer', timestamp: '11:03 AM' },
    { id: 'a5', actor: 'David', action: 'Added internal investigation note', timestamp: '11:05 AM' },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: `m_${Date.now()}`,
        senderName: 'David',
        senderRole: composerMode === 'internal' ? 'Internal Staff Note' : 'VerifyFlow Support',
        senderType: composerMode === 'internal' ? 'internal_note' : 'admin',
        content: messageText.trim(),
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, newMessage]);
      setActivityEvents((prev) => [
        {
          id: `a_${Date.now()}`,
          actor: 'David',
          action: composerMode === 'internal' ? 'Added internal note' : 'Sent reply to business',
          timestamp: 'Just now',
        },
        ...prev,
      ]);

      if (composerMode === 'reply' && status === 'Open') {
        setStatus('In Progress');
      }

      setMessageText('');
      setIsSending(false);
    }, 400);
  };

  const handleResolveTicket = () => {
    setStatus('Resolved');
    setShowResolveModal(false);
    setActivityEvents((prev) => [
      {
        id: `a_${Date.now()}`,
        actor: 'David',
        action: `Resolved ticket (${resolutionSummary || 'Issue resolved successfully'})`,
        timestamp: 'Just now',
      },
      ...prev,
    ]);
  };

  const handleReopenTicket = () => {
    setStatus('In Progress');
    setActivityEvents((prev) => [
      {
        id: `a_${Date.now()}`,
        actor: 'David',
        action: 'Reopened support ticket',
        timestamp: 'Just now',
      },
      ...prev,
    ]);
  };

  return (
    <div className="flex flex-col flex-1 pb-20 font-sans w-full max-w-[1400px] mx-auto">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Support Queue</span>
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          Created: 25 Aug 2026, 10:42 AM • Updated: 2 min ago
        </span>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono font-extrabold text-blue-600 text-sm">#{ticketId}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                priority === 'Urgent' || priority === 'High'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {priority} Priority
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'Open'
                  ? 'bg-amber-100/70 text-amber-800 border border-amber-200'
                  : status === 'In Progress'
                  ? 'bg-blue-100/70 text-blue-800 border border-blue-200'
                  : status === 'Pending'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : status === 'Resolved'
                  ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            IMEI verification showing incorrect result for iPhone 15 Pro
          </h1>
        </div>

        {/* Quick Status / Assign Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Status Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Assignee Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assignee:</span>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="David">David</option>
              <option value="Sarah">Sarah</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* Resolve / Reopen Action */}
          {status !== 'Resolved' && status !== 'Closed' ? (
            <button
              onClick={() => setShowResolveModal(true)}
              className="h-[36px] px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Ticket</span>
            </button>
          ) : (
            <button
              onClick={handleReopenTicket}
              className="h-[36px] px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid: Conversation (Left) & Context Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Chronological Conversation & Reply Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation Thread */}
          <div className="space-y-4">
            {messages.map((m) => {
              const isInternal = m.senderType === 'internal_note';
              const isAdmin = m.senderType === 'admin';

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl p-5 border transition ${
                    isInternal
                      ? 'bg-amber-50/60 border-amber-200'
                      : isAdmin
                      ? 'bg-blue-50/40 border-blue-200'
                      : 'bg-white border-slate-200 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isInternal
                            ? 'bg-amber-200 text-amber-900'
                            : isAdmin
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {m.senderName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{m.senderName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">({m.senderRole})</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block">{m.timestamp}</span>
                      </div>
                    </div>

                    {isInternal && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
                        Internal — Not visible to business
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>

                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                      {m.attachments.map((att) => (
                        <div
                          key={att.name}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                        >
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>{att.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({att.size})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reply & Internal Note Composer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-3">
            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setComposerMode('reply')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  composerMode === 'reply'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Public Reply to Business</span>
              </button>

              <button
                type="button"
                onClick={() => setComposerMode('internal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  composerMode === 'internal'
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Add Internal Note</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div
                className={`border rounded-xl p-3 transition ${
                  composerMode === 'internal'
                    ? 'bg-amber-50/40 border-amber-200 focus-within:border-amber-400'
                    : 'bg-slate-50/50 border-slate-200 focus-within:border-blue-500'
                }`}
              >
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    composerMode === 'internal'
                      ? 'Type an internal note (only visible to VerifyFlow staff)...'
                      : 'Write a response to Amaka Okafor and Dave Phones...'
                  }
                  className="w-full bg-transparent text-xs font-medium text-slate-900 outline-none resize-none placeholder:text-slate-400"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <button
                      type="button"
                      className="p-1 hover:text-slate-600 rounded transition"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    {composerMode === 'internal' && (
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Private Note
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSending || !messageText.trim()}
                    className={`h-[36px] px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 ${
                      composerMode === 'internal'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSending ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{composerMode === 'internal' ? 'Add Note' : 'Send Reply'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Business, Requester, VerifyFlow Data & Activity */}
        <div className="lg:col-span-1 space-y-6">
          {/* Business Context Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Business Context
                </h3>
              </div>
              <Link
                href="/admin/businesses"
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <span>View Store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Business:</span>
                <span className="font-extrabold text-slate-900">Dave Phones</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Subscription:</span>
                <span className="font-bold text-slate-800">Gold Plan (Active)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Branches:</span>
                <span className="font-semibold text-slate-700">3 Retail Branches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Active Staff:</span>
                <span className="font-semibold text-slate-700">8 Users</span>
              </div>
            </div>
          </div>

          {/* Requester Profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Requester
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-extrabold text-slate-900 block text-sm">Amaka Okafor</span>
                <span className="text-[11px] text-slate-500 font-medium">Sales Staff (Ikeja Branch)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 pt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href="mailto:amaka@davephones.com" className="hover:text-blue-600 font-medium">
                  amaka@davephones.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-medium">+234 802 334 9912</span>
              </div>
            </div>
          </div>

          {/* VerifyFlow System Context (Device & Verification Data) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                VerifyFlow Context
              </h3>
            </div>

            {/* Device Record */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-slate-900">Apple iPhone 15 Pro Max</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  Sold
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                IMEI: <strong className="text-slate-800 font-bold">356892110482910</strong>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Serial: <span className="text-slate-700 font-semibold">DNQZX09LMD6P</span>
              </div>
            </div>

            {/* Verification Lookup Record */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-start">
                <span className="font-mono font-bold text-blue-600">#VER-10482</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                  Pending QR
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Timestamp: 25 Aug 2026 · 10:39 AM
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Ticket Activity
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {activityEvents.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-800 font-semibold block">{act.action}</span>
                    <span className="text-[10px] text-slate-400">{act.actor} • {act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Resolve Ticket #{ticketId}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Provide a brief summary of how this support issue was resolved for future history.
                </p>
              </div>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Resolution Summary (Optional)
              </label>
              <textarea
                rows={3}
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="e.g. IMEI was successfully linked to customer's receipt and verified in national registry."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveTicket}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
