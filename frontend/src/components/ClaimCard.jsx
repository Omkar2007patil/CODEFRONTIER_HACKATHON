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
  Lock,
  Unlock,
  MapPin,
  HelpCircle,
} from 'lucide-react'

export default function ClaimCard({
  claim,
  onToggleApprove,
  onToggleSensitive,
  onUpdateStatement,
  onUpdateStatus,
  onInspectEvidence,
  onOpenConflictModal,
  isReviewer = true,
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

  // 1. Validation Status Badge
  const getValidationBadge = () => {
    const vStatus = claim.validation_status || 'supported'
    const confPct = Math.round((claim.confidence ?? 1.0) * 100)

    switch (vStatus) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-emerald-300 border border-emerald-400/40 bg-emerald-950/40 shadow-[0_0_8px_rgba(52,211,153,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SUPPORTED ({confPct}%)</span>
          </span>
        )
      case 'needs_human_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-amber-300 border border-amber-400/40 bg-amber-950/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>NEEDS_REVIEW ({confPct}%)</span>
          </span>
        )
      case 'missing_evidence':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-orange-300 border border-orange-500/40 bg-orange-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>MISSING_CITATION</span>
          </span>
        )
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-rose-300 border border-rose-500/50 bg-rose-950/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f]" />
            <span>UNSUPPORTED</span>
          </span>
        )
      default:
        return null
    }
  }

  // 2. Category Badge
  const getCategoryBadge = () => {
    const cat = claim.category || 'other_facts'
    switch (cat) {
      case 'project_dates_milestones':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-purple-300 border border-purple-500/40 bg-purple-950/30">
            // MILESTONE
          </span>
        )
      case 'decisions':
      case 'decision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300 border border-cyan-400/50 bg-cyan-950/40 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            // DECISION
          </span>
        )
      case 'risks_blockers':
      case 'blocker':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300 border border-amber-400/50 bg-amber-950/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            // BLOCKER
          </span>
        )
      case 'task_status':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-sky-300 border border-sky-500/40 bg-sky-950/30">
            // TASK_STATUS
          </span>
        )
      case 'task_ownership':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-300 border border-indigo-500/40 bg-indigo-950/30">
            // TASK_OWNER
          </span>
        )
      case 'technical_configuration':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-300 border border-emerald-500/40 bg-emerald-950/30">
            // CONFIG
          </span>
        )
      case 'next_action':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-teal-300 border border-teal-500/40 bg-teal-950/30">
            // NEXT_ACTION
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold text-neutral-400 border border-white/10 bg-white/5">
            // {cat.replace('_', ' ').toUpperCase()}
          </span>
        )
    }
  }

  const isConflicting = claim.status === 'conflicting'
  const sourceName = claim.source_filename || claim.evidence?.source_name
  const sourceLocation = claim.source_location || claim.evidence?.line_or_section
  const excerpt = claim.exact_source_excerpt || claim.evidence?.snippet

  return (
    <div
      className={`group relative p-5 rounded-xl border transition-all duration-300 font-mono ${
        isConflicting
          ? 'bg-rose-950/15 border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(255,0,127,0.2)]'
          : claim.is_sensitive
          ? 'bg-purple-950/15 border-purple-500/40 hover:border-purple-400'
          : 'bg-[#08080c] border-white/10 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {getCategoryBadge()}
          {getValidationBadge()}
          {claim.is_sensitive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-300 bg-rose-950/50 border border-rose-500/50 uppercase">
              <Lock className="w-3 h-3 text-rose-400" />
              <span>REDACTED</span>
            </span>
          )}
          {isConflicting && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#ff007f] bg-rose-950/60 border border-rose-500/60 uppercase animate-pulse">
              <AlertTriangle className="w-3 h-3 text-[#ff007f]" />
              <span>CONTRADICTION</span>
            </span>
          )}
        </div>

        {/* Claim ID & Version */}
        <span className="text-[10px] text-neutral-500">
          [{claim.id} &bull; v{claim.version || 1}]
        </span>
      </div>

      {/* Claim Statement */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              rows={2}
              value={editedStatement}
              onChange={(e) => setEditedStatement(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-black/80 border border-cyan-400/60 text-white font-mono text-xs focus:outline-none leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2.5 py-1 rounded bg-cyan-400 text-black font-bold text-xs flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>SAVE</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 rounded bg-white/10 text-neutral-300 text-xs"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <p className="font-body text-sm text-neutral-100 leading-relaxed font-normal">
            {claim.statement}
          </p>
        )}
      </div>

      {/* Provenance Anchor Box */}
      {sourceName && (
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 mb-3 text-xs">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-300 truncate font-semibold">
              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{sourceName}</span>
            </span>
            {sourceLocation && (
              <span className="flex items-center gap-1 text-neutral-400 shrink-0 text-[10px]">
                <MapPin className="w-3 h-3 text-neutral-500" />
                <span>{sourceLocation}</span>
              </span>
            )}
          </div>

          {excerpt && (
            <p className="font-mono text-[11px] text-neutral-300 italic border-l-2 border-cyan-400/40 pl-2.5 py-0.5 leading-relaxed bg-cyan-950/10">
              "{excerpt}"
            </p>
          )}

          {claim.explanation && (
            <p className="text-[10px] text-neutral-400 font-body">
              <span className="text-neutral-500 font-mono">// EXPLANATION: </span>
              {claim.explanation}
            </p>
          )}
        </div>
      )}

      {/* Conflict Notes & Inspector Trigger */}
      {isConflicting && (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>CROSS-DOCUMENT CONTRADICTION</span>
            </span>
            {onOpenConflictModal && (
              <button
                type="button"
                onClick={onOpenConflictModal}
                className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/40 font-bold transition uppercase"
              >
                [ VIEW SIDE-BY-SIDE ]
              </button>
            )}
          </div>
          {claim.conflict_notes && (
            <p className="text-[11px] font-body text-rose-200 leading-relaxed">
              {claim.conflict_notes}
            </p>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
        {/* Left: View Citation Anchor button */}
        {onInspectEvidence && claim.evidence && (
          <button
            type="button"
            onClick={() => onInspectEvidence(claim.evidence)}
            className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition"
          >
            <ExternalLink className="w-3 h-3" />
            <span>[ VIEW CITATION ]</span>
          </button>
        )}

        {/* Right: Reviewer Controls */}
        {isReviewer && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSensitive(claim.id)}
              className={`p-1.5 rounded transition ${
                claim.is_sensitive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
              title={claim.is_sensitive ? 'Unmask sensitive secret' : 'Redact sensitive credential'}
            >
              {claim.is_sensitive ? <Lock className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded bg-white/5 text-neutral-400 hover:text-white transition"
              title="Edit claim text"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onToggleApprove(claim.id)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold tracking-wider transition ${
                claim.is_approved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30'
              }`}
            >
              {claim.is_approved ? 'APPROVED' : 'PENDING'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
