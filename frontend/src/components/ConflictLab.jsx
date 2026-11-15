import React, { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  GitCompare,
  FileCode2,
} from 'lucide-react'

/**
 * ConflictLab Component
 * Full-width dedicated contradiction triage workspace.
 * Displays competing evidence side-by-side with exact file provenance,
 * detection explanation, and reviewer resolution form requiring an engineering rationale.
 */
export default function ConflictLab({
  conflicts = [],
  onResolveConflict,
  onInspectEvidence,
  onNavigateTab,
  isReviewer = true,
  currentUser,
}) {
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'unresolved' | 'resolved'
  const [activeConflictId, setActiveConflictId] = useState(conflicts.length > 0 ? conflicts[0].id : null)

  // Resolution Form State (per conflict)
  const [resolutionChoice, setResolutionChoice] = useState('claim_1')
  const [resolutionStatus, setResolutionStatus] = useState('resolved')
  const [rationale, setRationale] = useState('')
  const [submittingId, setSubmittingId] = useState(null)

  const unresolvedCount = conflicts.filter((c) => c.status === 'unresolved').length
  const reconciledCount = conflicts.length - unresolvedCount

  const filteredConflicts = conflicts.filter((c) => {
    if (filterMode === 'unresolved') return c.status === 'unresolved'
    if (filterMode === 'resolved') return c.status !== 'unresolved'
    return true
  })

  const handleResolveSubmit = async (conflictId) => {
    if (!rationale.trim()) {
      alert('Please enter an engineering rationale explaining this resolution decision.')
      return
    }

    setSubmittingId(conflictId)
    try {
      if (onResolveConflict) {
        await onResolveConflict(conflictId, {
          status: resolutionStatus,
          resolution_choice: resolutionChoice,
          rationale: rationale.trim(),
        })
      }
      setRationale('')
    } catch (err) {
      alert(`Resolution failed: ${err.message}`)
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header & Telemetry */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">
              // CROSS-DOCUMENT CONTRADICTION ENGINE
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Conflict Lab
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Identifies mutual contradictions across separate ingested documents. Outgoing contributors frequently leave
            conflicting dates or superseded decisions in retros and sprint boards. Handover package certification is
            blocked until reconciled by an authorized reviewer.
          </p>
        </div>

        {/* Telemetry Pills */}
        <div className="flex items-center gap-2.5 font-mono text-xs shrink-0">
          <div className="px-3.5 py-2 rounded-lg bg-[#111728] border border-[#1e293b]">
            <span className="text-slate-400 block text-[10px] uppercase">Total Inconsistencies</span>
            <span className="text-white font-bold text-base">{conflicts.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
            <span className="text-rose-400 block text-[10px] uppercase">Unresolved Blockers</span>
            <span className="text-rose-300 font-bold text-base">{unresolvedCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-emerald-400 block text-[10px] uppercase">Reconciled</span>
            <span className="text-emerald-300 font-bold text-base">{reconciledCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 font-mono text-xs">
        {[
          { id: 'all', label: `ALL CONTRADICTIONS (${conflicts.length})` },
          { id: 'unresolved', label: `UNRESOLVED BLOCKERS (${unresolvedCount})` },
          { id: 'resolved', label: `RECONCILED (${reconciledCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterMode(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition uppercase ${
              filterMode === tab.id
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-[#0c101c] border border-[#1e293b]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Main Reconciliation List */}
      <div className="space-y-6">
        {filteredConflicts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs rounded-xl bg-[#0c101c] border border-[#1e293b]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">No contradictions match the current filter.</p>
            <p className="mt-1">All cross-document claims are consistent or verified.</p>
          </div>
        ) : (
          filteredConflicts.map((conf, idx) => {
            const isUnresolved = conf.status === 'unresolved'
            const c1 = conf.claim_1 || {}
            const c2 = conf.claim_2 || {}

            return (
              <div
                key={conf.id}
                className={`p-6 rounded-xl border space-y-5 transition-all ${
                  isUnresolved
                    ? 'bg-[#0f0a12] border-rose-500/40 shadow-sm'
                    : 'bg-[#0a0f0d] border-emerald-500/30'
                }`}
              >
                {/* Conflict Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      CONTRADICTION #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {conf.conflict_type?.replace(/_/g, ' ') || 'Timeline Mismatch'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isUnresolved
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {conf.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    ID: <span className="text-slate-200">{conf.id}</span>
                  </div>
                </div>

                {/* Contradiction Analysis Banner */}
                <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-start gap-3 text-xs">
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${isUnresolved ? 'text-rose-400' : 'text-emerald-400'}`}
                  />
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                      CONTRADICTION ANALYSIS:
                    </span>
                    <p className="text-slate-200 font-body leading-relaxed">{conf.explanation}</p>
                  </div>
                </div>

                {/* Side-by-Side Competing Evidence Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SOURCE A */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          SOURCE A: {c1.source_filename || 'Document A'}
                        </span>
                        {c1.source_location && (
                          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {c1.source_location}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                        "{c1.statement || 'Statement A'}"
                      </h4>

                      {c1.exact_source_excerpt && (
                        <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-slate-300 italic">
                          &ldquo;{c1.exact_source_excerpt}&rdquo;
                        </div>
                      )}
                    </div>

                    {c1.evidence && onInspectEvidence && (
                      <button
                        type="button"
                        onClick={() => onInspectEvidence(c1.evidence)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 hover:text-cyan-200 pt-2 border-t border-white/[0.04]"
                      >
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>Anchor in Evidence Explorer &rarr;</span>
                      </button>
                    )}
                  </div>

                  {/* SOURCE B */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          SOURCE B: {c2.source_filename || 'Document B'}
                        </span>
                        {c2.source_location && (
                          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                            {c2.source_location}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                        "{c2.statement || 'Statement B'}"
                      </h4>

                      {c2.exact_source_excerpt && (
                        <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-slate-300 italic">
                          &ldquo;{c2.exact_source_excerpt}&rdquo;
                        </div>
                      )}
                    </div>

                    {c2.evidence && onInspectEvidence && (
                      <button
                        type="button"
                        onClick={() => onInspectEvidence(c2.evidence)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-purple-300 hover:text-purple-200 pt-2 border-t border-white/[0.04]"
                      >
                        <MapPin className="w-3 h-3 text-purple-400" />
                        <span>Anchor in Evidence Explorer &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Human Reconciliation Panel */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Lead Reviewer Reconciliation Decision</span>
                    </span>
                    {!isUnresolved && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Reconciled by {conf.resolved_by || 'Reviewer'}
                      </span>
                    )}
                  </div>

                  {/* Previous Resolution Note if already resolved */}
                  {!isUnresolved && conf.rationale && (
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-slate-200 space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                        Committed Rationale ({conf.resolution_choice || 'Custom'}):
                      </span>
                      <p className="italic">"{conf.rationale}"</p>
                    </div>
                  )}

                  {/* Resolution Controls for Reviewer */}
                  {isReviewer ? (
                    <div className="space-y-3 pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                            Resolution Action
                          </label>
                          <select
                            value={resolutionChoice}
                            onChange={(e) => setResolutionChoice(e.target.value)}
                            className="w-full p-2 rounded-lg bg-[#111728] border border-[#1e293b] text-white outline-none focus:border-cyan-500/50"
                          >
                            <option value="claim_1">Prefer Source A ({c1.source_filename || 'Source 1'})</option>
                            <option value="claim_2">Prefer Source B ({c2.source_filename || 'Source 2'})</option>
                            <option value="reconciled">Reconciled Synthesis (Corrected Truth)</option>
                            <option value="not_contradictory">Not Contradictory (False Positive)</option>
                            <option value="escalated">Escalate for External Verification</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                            Target State
                          </label>
                          <select
                            value={resolutionStatus}
                            onChange={(e) => setResolutionStatus(e.target.value)}
                            className="w-full p-2 rounded-lg bg-[#111728] border border-[#1e293b] text-white outline-none focus:border-cyan-500/50"
                          >
                            <option value="resolved">Resolved (Clears Release Blocker)</option>
                            <option value="dismissed">Dismissed (False Positive)</option>
                            <option value="unresolved">Keep Unresolved (Active Blocker)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                          Engineering Rationale & Justification (Required)
                        </label>
                        <textarea
                          rows={2}
                          value={rationale}
                          onChange={(e) => setRationale(e.target.value)}
                          placeholder="e.g., Confirmed with Alex Chen in Sprint Retro: Public beta was postponed to Nov 15; ADR-004 freeze remains Nov 10."
                          className="w-full p-2.5 rounded-lg bg-[#111728] border border-[#1e293b] text-white text-xs focus:border-cyan-500/50 focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleResolveSubmit(conf.id)}
                          disabled={submittingId === conf.id || !rationale.trim()}
                          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition shadow-sm active:scale-95 disabled:opacity-40"
                        >
                          {submittingId === conf.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Recording in SQLite Audit...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Commit Reconciliation Decision</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-400 font-mono text-xs">
                      Switch to Lead Reviewer account to reconcile active contradictions.
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
