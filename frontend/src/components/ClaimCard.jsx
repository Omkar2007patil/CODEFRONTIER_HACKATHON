import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  FileText,
  ExternalLink,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

/**
 * ClaimCard Component
 * Displays an individual extracted project claim with evidence citations,
 * triage status controls, and conflict analysis callouts.
 * Styled with Active Theory elevated dark glass and distinctive visual badges.
 */
export default function ClaimCard({
  claim,
  onToggleApprove,
  onToggleSensitive,
  onUpdateStatement,
  onUpdateStatus,
  onInspectEvidence,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedStatement, setEditedStatement] = useState(claim.statement)

  const handleSaveEdit = () => {
    if (editedStatement.trim()) {
      onUpdateStatement(claim.id, editedStatement.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedStatement(claim.statement)
    setIsEditing(false)
  }

  // 1. DISTINCT STATUS BADGES
  const getStatusBadge = () => {
    switch (claim.status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-emerald-300 border border-emerald-400/40 bg-emerald-950/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>VERIFIED</span>
          </span>
        )
      case 'uncertain':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-amber-300 border border-amber-400/40 bg-amber-950/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
            <span>UNCERTAIN_GAP</span>
          </span>
        )
      case 'conflicting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-rose-300 border border-rose-500/60 bg-rose-950/50 shadow-[0_0_15px_rgba(255,0,127,0.35)] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f]" />
            <span>CONTRADICTION</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-white/5 text-neutral-400 border border-white/10 font-mono tracking-[0.18em] uppercase">
            {claim.status}
          </span>
        )
    }
  }

  // 2. DISTINCT CATEGORY BADGES (Cyan for DECISION, Amber for BLOCKER)
  const getCategoryBadge = () => {
    switch (claim.category) {
      case 'decision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-cyan-300 border border-cyan-400/50 bg-cyan-950/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
            <span className="w-1 h-1 rounded-full bg-[#00f0ff]" />
            <span>// DECISION</span>
          </span>
        )
      case 'blocker':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-amber-300 border border-amber-400/50 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span>// BLOCKER</span>
          </span>
        )
      case 'next_action':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-teal-300 border border-teal-500/40 bg-teal-950/30">
            <span>// NEXT_ACTION</span>
          </span>
        )
      case 'wip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-sky-300 border border-sky-500/40 bg-sky-950/30">
            <span>// IN_PROGRESS</span>
          </span>
        )
      case 'dependency':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] uppercase text-purple-300 border border-purple-500/40 bg-purple-950/30">
            <span>// DEPENDENCY</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs uppercase font-mono font-bold tracking-[0.18em] text-neutral-400 border border-white/10 bg-white/5">
            // {claim.category?.toUpperCase() || 'ITEM'}
          </span>
        )
    }
  }

  // Dynamic card backdrop styling
  const isConflict = claim.status === 'conflicting'
  const isRedacted = claim.is_sensitive

  const cardBorderClass = isConflict
    ? 'border-rose-500/60 hover:border-[#ff007f] shadow-[0_0_25px_rgba(255,0,127,0.2)] bg-[#12050d]/80'
    : isRedacted
    ? 'border-purple-500/40 hover:border-purple-400 bg-[#0e0717]/80'
    : claim.is_approved
    ? 'border-slate-800/80 hover:border-[#00F0FF]/50 bg-[#0c0d14]/75 shadow-lg'
    : 'border-dashed border-amber-600/40 hover:border-amber-400 bg-[#0c0d14]/60'

  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden group ${cardBorderClass}`}
    >
      {/* Top Hairline Active Indicator */}
      <div
        className={`h-[1px] w-full transition-opacity duration-300 ${
          isConflict
            ? 'bg-gradient-to-r from-transparent via-[#ff007f] to-transparent opacity-80'
            : isRedacted
            ? 'bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70'
            : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 group-hover:opacity-100'
        }`}
      />

      {/* Top Meta Bar */}
      <div className="bg-white/[0.02] px-5 py-3.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-neutral-500 text-xs font-bold tracking-[0.18em]">
            [{claim.id}]
          </span>
          {getCategoryBadge()}
          {getStatusBadge()}

          {claim.is_sensitive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-[0.18em] bg-purple-950/60 text-purple-300 border border-purple-500/40 uppercase">
              <EyeOff className="w-2.5 h-2.5 text-purple-400" />
              <span>REDACTED</span>
            </span>
          )}
        </div>

        {/* Tactical Triage Dropdown */}
        <div className="flex items-center gap-2 font-mono text-xs tracking-[0.18em]">
          <span className="text-neutral-500 uppercase text-[10px]">// TRIAGE:</span>
          <select
            aria-label="Triage Status"
            value={claim.status}
            onChange={(e) => onUpdateStatus(claim.id, e.target.value)}
            className="bg-black/90 border border-white/10 text-neutral-200 text-xs font-mono tracking-[0.16em] rounded-lg px-2.5 py-1 outline-none focus:border-cyan-400 transition cursor-pointer"
          >
            <option value="verified">VERIFIED</option>
            <option value="uncertain">UNCERTAIN</option>
            <option value="conflicting">CONFLICTING</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Editable Statement */}
        {isEditing ? (
          <div className="space-y-2.5 font-mono">
            <textarea
              value={editedStatement}
              onChange={(e) => setEditedStatement(e.target.value)}
              rows={3}
              className="w-full bg-black/90 border border-cyan-400 rounded-xl p-3.5 text-sm text-neutral-100 font-mono outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
              placeholder="Update statement..."
            />
            <div className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase font-bold font-mono">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-black shadow-[0_0_12px_#00f0ff] transition active:scale-95"
              >
                <Check className="w-3 h-3" />
                <span>SAVE</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 transition"
              >
                <X className="w-3 h-3" />
                <span>CANCEL</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <p className="text-base font-heading font-bold tracking-tight text-neutral-100 leading-snug flex-1">
              {claim.statement}
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Edit statement"
              className="text-neutral-500 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-white/5 transition shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Anchored Evidence Citation Box */}
        {claim.evidence && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-black/70 border border-white/10 text-xs space-y-2 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-bold tracking-[0.18em]">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>{claim.evidence.source_name}</span>
                {claim.evidence.line_or_section && (
                  <span className="text-neutral-500 font-normal">
                    &bull; {claim.evidence.line_or_section}
                  </span>
                )}
              </div>

              {/* View in Source Button */}
              <button
                type="button"
                onClick={() => onInspectEvidence(claim.evidence)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/90 border border-cyan-400/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono tracking-[0.18em] uppercase font-bold transition group shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95"
              >
                <span>[ // INSPECT_CITATION ]</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <blockquote className="italic text-neutral-300 border-l-2 border-cyan-400/60 pl-3.5 py-1 font-body leading-relaxed text-sm bg-white/[0.01] rounded-r-lg">
              "{claim.evidence.snippet}"
            </blockquote>
          </div>
        )}

        {/* Contradiction / Conflict Notes Callout with Active Theory Rose Wireframe */}
        {claim.conflict_notes && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              isConflict
                ? 'bg-[#1c0612]/90 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(255,0,127,0.2)]'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-mono text-xs tracking-[0.18em] uppercase">
              {isConflict ? (
                <>
                  <AlertCircle className="w-4 h-4 text-[#ff007f] shrink-0 animate-pulse" />
                  <span className="text-rose-300">// CONTRADICTION_ANALYSIS:</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-300">// UNCERTAINTY_NOTE:</span>
                </>
              )}
            </div>
            <p className="font-body leading-relaxed text-sm pl-6 text-neutral-300">
              {claim.conflict_notes}
            </p>
          </div>
        )}

        {/* Sensitivity Redacted Callout */}
        {claim.is_sensitive && (
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between font-mono tracking-[0.18em] uppercase">
            <span className="flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px]">// SENSITIVE_CONTENT: EXCLUDED_FROM_SUCCESSOR_VIEW</span>
            </span>
            <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-900/40 border border-purple-500/40 text-xs">
              REDACTED
            </span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-white/[0.02] px-5 py-3.5 border-t border-white/5 flex items-center justify-between gap-3 text-xs font-mono">
        {/* Sensitivity Redaction Toggle */}
        <button
          type="button"
          onClick={() => onToggleSensitive(claim.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition active:scale-95 ${
            claim.is_sensitive
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/50 hover:bg-purple-800/50 shadow-sm'
              : 'bg-black/80 text-neutral-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
          title="Exclude sensitive content from successor briefing"
        >
          {claim.is_sensitive ? (
            <>
              <Eye className="w-3 h-3 text-purple-400" />
              <span>[ UNREDACT ]</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              <span>[ REDACT ]</span>
            </>
          )}
        </button>

        {/* Approval Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleApprove(claim.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition active:scale-95 ${
              claim.is_approved
                ? 'bg-black/90 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)] hover:border-emerald-400'
                : 'bg-black/90 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:border-amber-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{claim.is_approved ? '[ APPROVED ✓ ]' : '[ PENDING_REVIEW ]'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
