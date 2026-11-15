import React, { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  RefreshCw,
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Database,
  ArrowRight,
  CheckCheck,
  HelpCircle,
  AlertCircle,
  FileText,
  MapPin,
  Clock,
} from 'lucide-react'

/**
 * ReviewApprovals Component
 * Reviewer command center for certification, approval lifecycle tracking,
 * pending review queues, secret redaction, and handover locking.
 */
export default function ReviewApprovals({
  project,
  claims = [],
  onToggleApprove,
  onToggleSensitive,
  onUpdateStatement,
  onApproveAll,
  onLockHandover,
  onNavigateTab,
  currentUser,
  activeApiBase,
  authToken,
}) {
  const [activeQueue, setActiveQueue] = useState('pending') // 'pending' | 'conflicts' | 'redactions' | 'unverified'
  const [queueSearch, setQueueSearch] = useState('')
  const [confirmLockOpen, setConfirmLockOpen] = useState(false)

  const isReviewer = currentUser?.role === 'project_reviewer'
  const conflicts = project?.conflicts || []
  const unresolvedConflicts = conflicts.filter((c) => c.status === 'unresolved')

  const pendingClaims = claims.filter((c) => !c.is_approved)
  const redactedClaims = claims.filter((c) => c.is_sensitive)
  const unverifiedClaims = claims.filter(
    (c) => c.validation_status === 'needs_human_review' || c.validation_status === 'missing_evidence'
  )

  // Items for active queue
  const queueItems = (() => {
    switch (activeQueue) {
      case 'pending':
        return pendingClaims
      case 'redactions':
        return redactedClaims
      case 'unverified':
        return unverifiedClaims
      default:
        return pendingClaims
    }
  })().filter((c) => {
    if (!queueSearch.trim()) return true
    const q = queueSearch.toLowerCase()
    return (
      c.statement?.toLowerCase().includes(q) ||
      c.source_filename?.toLowerCase().includes(q) ||
      c.source_location?.toLowerCase().includes(q)
    )
  })

  const isApproved = project?.status === 'approved'

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header Banner & Lifecycle Pipeline */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                // CERTIFICATION PIPELINE & SIGN-OFF GATEWAY
              </span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
              Review & Approvals
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Review, edit, and certify extracted operational claims before successor transfer. Authorized reviewers
              approve statements, mask sensitive credentials, and certify the final handover package.
            </p>
          </div>

          {/* Primary Action Cluster */}
          <div className="flex items-center gap-2.5 font-mono text-xs shrink-0 flex-wrap">
            {isReviewer && (
              <button
                type="button"
                onClick={onApproveAll}
                className="px-3.5 py-2 rounded-lg bg-[#111728] border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-bold uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Batch Approve All</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLockHandover}
              disabled={unresolvedConflicts.length > 0}
              className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition flex items-center gap-2 active:scale-95 ${
                unresolvedConflicts.length > 0
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isApproved ? 'Handover Locked' : 'Lock Handover'}</span>
            </button>
          </div>
        </div>

        {/* 5-Stage Approval Lifecycle Tracker */}
        <div className="pt-4 border-t border-[#1e293b]">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span>Handover Certification Lifecycle</span>
            <span className={isApproved ? 'text-emerald-400' : 'text-amber-400'}>
              {isApproved ? 'STAGE 5: Certified & Locked' : 'STAGE 4: Reviewer Certification Pending'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            {/* Stage 1 */}
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>1. INGESTION</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{project?.raw_sources?.length || 0} Docs Parsed</div>
            </div>

            {/* Stage 2 */}
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>2. EXTRACTION</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{claims.length} Claims Verified</div>
            </div>

            {/* Stage 3 */}
            <div
              className={`p-2.5 rounded-lg border ${
                unresolvedConflicts.length === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {unresolvedConflicts.length === 0 ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-rose-400 animate-pulse" />
                )}
                <span>3. CONFLICTS</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {unresolvedConflicts.length === 0 ? '0 Inconsistencies' : `${unresolvedConflicts.length} Blockers Active`}
              </div>
            </div>

            {/* Stage 4 */}
            <div
              className={`p-2.5 rounded-lg border ${
                pendingClaims.length === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {pendingClaims.length === 0 ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-400" />
                )}
                <span>4. APPROVALS</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{pendingClaims.length} Awaiting Sign-off</div>
            </div>

            {/* Stage 5 */}
            <div
              className={`p-2.5 rounded-lg border ${
                isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3 h-3" />
                <span>5. LOCK GATE</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{isApproved ? 'Successor Transfer Ready' : 'Pending Review'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Review Queues Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Queue Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
          {[
            { id: 'pending', label: `Pending Approvals (${pendingClaims.length})`, count: pendingClaims.length },
            { id: 'conflicts', label: `Contradictions (${unresolvedConflicts.length})`, count: unresolvedConflicts.length, isBlocker: true },
            { id: 'redactions', label: `Redaction Review (${redactedClaims.length})`, count: redactedClaims.length },
            { id: 'unverified', label: `Needs Review (${unverifiedClaims.length})`, count: unverifiedClaims.length },
          ].map((queue) => (
            <button
              key={queue.id}
              type="button"
              onClick={() => setActiveQueue(queue.id)}
              className={`px-3 py-2 rounded-lg font-semibold transition uppercase shrink-0 flex items-center gap-1.5 ${
                activeQueue === queue.id
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'bg-[#0c101c] border border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{queue.label}</span>
              {queue.isBlocker && queue.count > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Search inside queue */}
        {activeQueue !== 'conflicts' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search queue items..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0c101c] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none placeholder:text-slate-500"
            />
          </div>
        )}
      </div>

      {/* 3. Queue Content */}
      {activeQueue === 'conflicts' ? (
        /* Unresolved Conflicts Queue View */
        <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Contradiction Blockers Awaiting Triage</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('conflicts')}
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Open Conflict Lab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {unresolvedConflicts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Zero unresolved contradictions detected!</p>
              <p className="mt-0.5">All ingested documents are consistent. Handover locking is unblocked.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unresolvedConflicts.map((conf, idx) => (
                <div
                  key={conf.id}
                  className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-300">CONTRADICTION #{idx + 1}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-slate-300 uppercase">{conf.conflict_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-slate-200 line-clamp-2 font-body text-xs leading-relaxed">
                      {conf.explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('conflicts')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider transition shrink-0 self-start md:self-auto"
                  >
                    <span>Reconcile &rarr;</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Claims Queue View */
        <div className="space-y-3">
          {queueItems.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs rounded-xl bg-[#0c101c] border border-[#1e293b]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Queue is clear!</p>
              <p className="mt-0.5">No items currently requiring attention in this category.</p>
            </div>
          ) : (
            queueItems.map((claim) => (
              <div
                key={claim.id}
                className="p-4 sm:p-5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-cyan-400">
                      CLAIM #{claim.id}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {claim.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Confidence: {Math.round((claim.confidence ?? 1.0) * 100)}%
                    </span>
                    {claim.is_sensitive && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                        SENSITIVE / REDACTED
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    "{claim.statement}"
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>
                      {claim.source_filename || claim.evidence?.source_name || 'Document'} &bull;{' '}
                      {claim.source_location || claim.evidence?.line_or_section || 'Section'}
                    </span>
                  </div>
                </div>

                {/* Review Controls */}
                <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => onToggleApprove && onToggleApprove(claim.id)}
                    className={`px-3 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                      claim.is_approved
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{claim.is_approved ? 'Approved' : 'Approve'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSensitive && onToggleSensitive(claim.id)}
                    className={`p-2 rounded-lg border transition ${
                      claim.is_sensitive
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-[#111728] border-[#1e293b] text-slate-400 hover:text-white'
                    }`}
                    title={claim.is_sensitive ? 'Unmask secret' : 'Redact secret from successor'}
                  >
                    {claim.is_sensitive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
