import React, { useState } from 'react'
import {
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Clock,
} from 'lucide-react'

export default function ConflictModal({
  isOpen,
  conflict,
  onClose,
  onResolveConflict,
  isReviewer = true,
}) {
  const [resolutionChoice, setResolutionChoice] = useState('accept_claim_1')
  const [resolutionStatus, setResolutionStatus] = useState('resolved')
  const [rationale, setRationale] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !conflict) return null

  const claim1 = conflict.claim_1 || {}
  const claim2 = conflict.claim_2 || {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rationale.trim()) {
      alert('Please provide an engineering rationale explaining this decision.')
      return
    }

    setIsSubmitting(true)
    try {
      await onResolveConflict(conflict.id, {
        status: resolutionStatus,
        resolution_choice: resolutionChoice,
        rationale: rationale.trim(),
      })
      onClose()
    } catch (err) {
      alert(`Failed to resolve conflict: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-[#050507] border border-rose-500/40 rounded-2xl shadow-[0_0_60px_rgba(255,0,127,0.25)] overflow-hidden my-auto font-mono transition-all">
        {/* Top Accent Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 shadow-[0_0_15px_#ff007f]" />

        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-ping" />
              <span className="text-xs uppercase tracking-[0.18em] text-rose-400 font-bold">
                // CROSS_DOCUMENT_CONTRADICTION_ANALYZER
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 border border-rose-500/50 text-rose-300 uppercase">
                {conflict.conflict_type?.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-xl font-heading font-bold text-white tracking-tight uppercase">
              Cross-Document Contradiction Detected
            </h3>
            <p className="font-body text-xs text-neutral-300 leading-relaxed">
              Two ingested documents make contradictory assertions regarding project milestones, task statuses, or architectural decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs font-body leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-mono text-rose-300 block mb-1">
                CONTRADICTION ANALYSIS & IMPACT:
              </strong>
              {conflict.explanation}
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Document A */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-cyan-400/30 space-y-3 relative group">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>CLAIM A (SOURCE 1)</span>
                </span>
                <span className="text-[10px] text-neutral-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                  {claim1.source_filename || 'Document 1'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-xs text-neutral-200 font-body">
                "{claim1.statement || 'Statement not available'}"
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="text-neutral-400 text-[10px]">
                  <strong>Exact Source Excerpt:</strong>
                </div>
                <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20 text-cyan-200 text-[11px] italic">
                  "{claim1.exact_source_excerpt || claim1.evidence?.snippet || 'Excerpt not available'}"
                </div>
                <div className="text-[10px] text-neutral-500">
                  Location: <span className="text-neutral-300">{claim1.source_location || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Document B */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-rose-400/30 space-y-3 relative group">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>CLAIM B (SOURCE 2)</span>
                </span>
                <span className="text-[10px] text-neutral-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                  {claim2.source_filename || 'Document 2'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-xs text-neutral-200 font-body">
                "{claim2.statement || 'Statement not available'}"
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="text-neutral-400 text-[10px]">
                  <strong>Exact Source Excerpt:</strong>
                </div>
                <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20 text-rose-200 text-[11px] italic">
                  "{claim2.exact_source_excerpt || claim2.evidence?.snippet || 'Excerpt not available'}"
                </div>
                <div className="text-[10px] text-neutral-500">
                  Location: <span className="text-neutral-300">{claim2.source_location || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Resolution State / Form */}
          {conflict.status === 'resolved' ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>STATUS: RESOLVED BY ENGINEERING LEAD</span>
                </span>
                <span className="text-[10px] text-neutral-400">{conflict.resolved_at}</span>
              </div>
              <div className="text-xs">
                <strong>Choice:</strong> {conflict.resolution_choice?.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs font-body text-neutral-300">
                <strong>Reviewer Rationale:</strong> {conflict.rationale}
              </div>
            </div>
          ) : isReviewer ? (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Reviewer Resolution Gate</span>
                </span>
                <span className="text-[10px] text-amber-400">Requires Lead Rationale</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center gap-2 ${
                    resolutionChoice === 'accept_claim_1'
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200'
                      : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    value="accept_claim_1"
                    checked={resolutionChoice === 'accept_claim_1'}
                    onChange={() => setResolutionChoice('accept_claim_1')}
                    className="hidden"
                  />
                  <span>Accept Source A (Freeze)</span>
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center gap-2 ${
                    resolutionChoice === 'accept_claim_2'
                      ? 'bg-rose-950/40 border-rose-400 text-rose-200'
                      : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    value="accept_claim_2"
                    checked={resolutionChoice === 'accept_claim_2'}
                    onChange={() => setResolutionChoice('accept_claim_2')}
                    className="hidden"
                  />
                  <span>Accept Source B (Launch)</span>
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center gap-2 ${
                    resolutionChoice === 'override'
                      ? 'bg-purple-950/40 border-purple-400 text-purple-200'
                      : 'bg-black/40 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="choice"
                    value="override"
                    checked={resolutionChoice === 'override'}
                    onChange={() => setResolutionChoice('override')}
                    className="hidden"
                  />
                  <span>Reconciled Override</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                  Resolution Decision Rationale (Mandatory for Compliance Audit)
                </label>
                <textarea
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why this decision is authoritative (e.g. 'Product owner confirmed API freeze on Nov 10 is mandatory. Target launch moved to Nov 22 to accommodate staging hardening.')..."
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResolutionStatus('not_a_conflict')
                    setRationale('Marked as non-conflict after reviewing time context and scope.')
                  }}
                  className="text-[10px] text-neutral-400 hover:text-cyan-300 underline"
                >
                  Mark as Non-Conflict
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rationale.trim()}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-cyan-400 text-black font-bold text-xs uppercase hover:shadow-[0_0_15px_rgba(255,0,127,0.4)] disabled:opacity-50 transition"
                  >
                    {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-200 text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>UNRESOLVED: AWAITING ENGINEERING LEAD REVIEW</span>
              </span>
              <p className="font-body text-neutral-400 text-[11px] mt-1">
                Only authenticated Project Reviewers can resolve contradictions. Successors cannot modify claims or approve disputed facts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
