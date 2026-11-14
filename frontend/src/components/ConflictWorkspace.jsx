import React, { useState } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ExternalLink,
  HelpCircle,
  Layers,
  MapPin,
} from 'lucide-react'

/**
 * ConflictWorkspace
 * Dedicated full-screen workspace for cross-document conflict triage and human resolution.
 * Displays competing evidence side-by-side with exact file provenance.
 */
export default function ConflictWorkspace({
  conflicts = [],
  onResolveConflict,
  onInspectEvidence,
  isReviewer = true,
  currentUser,
}) {
  const [selectedConflictId, setSelectedConflictId] = useState(
    conflicts.length > 0 ? conflicts[0].id : null
  )

  // Resolution Form State
  const [choice, setChoice] = useState('claim_1')
  const [status, setStatus] = useState('resolved')
  const [rationale, setRationale] = useState('')
  const [submittingId, setSubmittingId] = useState(null)

  const activeConflict = conflicts.find((c) => c.id === selectedConflictId) || conflicts[0]
  const unresolvedCount = conflicts.filter((c) => c.status === 'unresolved').length

  const handleResolveSubmit = async (conflictId) => {
    if (!rationale.trim()) {
      alert('Please enter an engineering rationale explaining this resolution.')
      return
    }

    setSubmittingId(conflictId)
    try {
      await onResolveConflict(conflictId, {
        status: status,
        resolution_choice: choice,
        rationale: rationale.trim(),
      })
      setRationale('')
    } catch (err) {
      alert(`Resolution failed: ${err.message}`)
    } finally {
      setSubmittingId(null)
    }
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0c0e17]/80 border border-white/[0.08] max-w-3xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-heading font-bold text-white uppercase tracking-tight">
          Zero Contradictions Flagged
        </h3>
        <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto leading-relaxed">
          All ingested project documents and decision records are concordant across release dates, task statuses, and architectural stack selections.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* 1. Header Banner & Metrics */}
      <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">
              // CROSS-DOCUMENT CONTRADICTION ENGINE
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Conflict Reconciliation Workspace
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Identifies mutual contradictions across separate ingested documents. Outgoing members frequently leave conflicting dates or superseded decisions in retros and sprint boards.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <span className="text-neutral-500 block text-[10px] uppercase">Total Conflicts</span>
            <span className="text-white font-bold">{conflicts.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-rose-400 block text-[10px] uppercase">Unresolved</span>
            <span className="text-rose-300 font-bold">{unresolvedCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-emerald-400 block text-[10px] uppercase">Reconciled</span>
            <span className="text-emerald-300 font-bold">{conflicts.length - unresolvedCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Reconciliation List */}
      <div className="space-y-6">
        {conflicts.map((conf, idx) => {
          const isUnresolved = conf.status === 'unresolved'
          const c1 = conf.claim_1 || {}
          const c2 = conf.claim_2 || {}

          return (
            <div
              key={conf.id}
              className={`p-6 rounded-2xl border transition-all ${
                isUnresolved
                  ? 'bg-[#0f0a12]/90 border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.12)]'
                  : 'bg-[#0a0f0d]/90 border-emerald-500/30'
              }`}
            >
              {/* Conflict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-neutral-400">
                    CONTRADICTION #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/[0.06] text-neutral-300 border border-white/10">
                    {conf.conflict_type?.replace('_', ' ') || 'Timeline Mismatch'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isUnresolved
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {conf.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-neutral-400">
                  ID: <span className="text-neutral-200">{conf.id}</span>
                </div>
              </div>

              {/* Analysis Note */}
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3 text-xs">
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isUnresolved ? 'text-rose-400' : 'text-emerald-400'}`} />
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-neutral-400 block">
                    CONTRADICTION ANALYSIS:
                  </span>
                  <p className="text-neutral-200 font-body leading-relaxed">{conf.explanation}</p>
                </div>
              </div>

              {/* Side-by-Side Competing Claims Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* Source Claim 1 */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        SOURCE A: {c1.source_filename || 'Document A'}
                      </span>
                      {c1.source_location && (
                        <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          {c1.source_location}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-heading font-bold text-white">
                      "{c1.statement || 'Statement A'}"
                    </h4>

                    {c1.exact_source_excerpt && (
                      <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-neutral-300 italic">
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
                      <span>Anchor in Source Reader &rarr;</span>
                    </button>
                  )}
                </div>

                {/* Source Claim 2 */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        SOURCE B: {c2.source_filename || 'Document B'}
                      </span>
                      {c2.source_location && (
                        <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                          {c2.source_location}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-heading font-bold text-white">
                      "{c2.statement || 'Statement B'}"
                    </h4>

                    {c2.exact_source_excerpt && (
                      <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-neutral-300 italic">
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
                      <span>Anchor in Source Reader &rarr;</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Resolution Area: Form if Unresolved, or Log if Resolved */}
              {isUnresolved ? (
                <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-rose-500/20 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">
                      // HUMAN REVIEWER RESOLUTION PANEL
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Authorized: Lead Reviewer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.08] cursor-pointer hover:border-cyan-400/40">
                      <input
                        type="radio"
                        name={`choice-${conf.id}`}
                        value="claim_1"
                        checked={choice === 'claim_1'}
                        onChange={(e) => setChoice(e.target.value)}
                        className="text-cyan-400 focus:ring-0"
                      />
                      <span className="text-neutral-200">Accept Source A ({c1.source_filename || 'Doc A'})</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.08] cursor-pointer hover:border-purple-400/40">
                      <input
                        type="radio"
                        name={`choice-${conf.id}`}
                        value="claim_2"
                        checked={choice === 'claim_2'}
                        onChange={(e) => setChoice(e.target.value)}
                        className="text-purple-400 focus:ring-0"
                      />
                      <span className="text-neutral-200">Accept Source B ({c2.source_filename || 'Doc B'})</span>
                    </label>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-neutral-400 uppercase">Engineering Rationale & Context (Persisted to Audit Log):</span>
                    <textarea
                      rows={2}
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="e.g. Confirmed with Lead Architect: November 10 API Freeze is authoritative; public launch postponed to maintain testing buffer."
                      className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={submittingId === conf.id}
                      onClick={() => handleResolveSubmit(conf.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] text-black font-bold uppercase tracking-wider text-xs transition active:scale-95 disabled:opacity-50"
                    >
                      {submittingId === conf.id ? 'Saving...' : 'Resolve Conflict & Unlock Handover'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs font-mono flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                        RECONCILED BY {conf.resolved_by || 'LEAD REVIEWER'}
                      </span>
                      {conf.resolved_at && (
                        <span className="text-[10px] text-neutral-400">
                          ({new Date(conf.resolved_at).toLocaleString()})
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-200 font-sans text-xs">
                      <strong>Rationale:</strong> {conf.rationale || 'Accepted authoritative position during lead triage.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
