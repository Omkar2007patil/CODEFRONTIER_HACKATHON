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

  // Active Theory Minimalist Badges
  const getStatusBadge = () => {
    switch (claim.status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-[0.18em] uppercase text-cyan-300 border border-cyan-400/40 bg-cyan-950/20 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
            <span>VERIFIED</span>
          </span>
        )
      case 'uncertain':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-[0.18em] uppercase text-amber-300 border border-amber-400/40 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>UNCERTAIN_GAP</span>
          </span>
        )
      case 'conflicting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-[0.18em] uppercase text-rose-300 border border-rose-500/50 bg-rose-950/40 shadow-[0_0_15px_rgba(255,0,127,0.3)] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] shadow-[0_0_6px_#ff007f]" />
            <span>CONTRADICTION</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/5 text-neutral-400 border border-white/10 font-mono tracking-[0.18em] uppercase">
            {claim.status}
          </span>
        )
    }
  }

  const getCategoryBadge = () => {
    const map = {
      decision: { label: '// DECISION', color: 'text-indigo-300 border-indigo-500/30 bg-indigo-950/20' },
      blocker: { label: '// BLOCKER', color: 'text-rose-300 border-rose-500/40 bg-rose-950/20' },
      next_action: { label: '// NEXT_ACTION', color: 'text-teal-300 border-teal-500/30 bg-teal-950/20' },
      wip: { label: '// IN_PROGRESS', color: 'text-blue-300 border-blue-500/30 bg-blue-950/20' },
      dependency: { label: '// DEPENDENCY', color: 'text-purple-300 border-purple-500/30 bg-purple-950/20' },
    }
    const item = map[claim.category] || { label: `// ${claim.category.toUpperCase()}`, color: 'text-neutral-400 border-white/10 bg-white/5' }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs uppercase font-mono font-bold tracking-[0.18em] border ${item.color}`}>
        {item.label}
      </span>
    )
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 relative corner-crosshair ${
        claim.status === 'conflicting'
          ? 'bg-[#0e040a]/80 backdrop-blur-xl border-rose-500/50 hover:border-rose-400 shadow-[0_0_24px_rgba(255,0,127,0.18)]'
          : claim.is_approved
            ? claim.is_sensitive
              ? 'bg-[#0d0714]/80 backdrop-blur-xl border-purple-500/30'
              : 'bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-400/40'
            : 'bg-black/40 border-dashed border-amber-600/40'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="bg-white/[0.02] px-5 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-neutral-500 text-xs font-bold tracking-[0.18em]">
            [{claim.id}]
          </span>
          {getCategoryBadge()}
          {getStatusBadge()}

          {claim.is_sensitive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-[0.18em] bg-purple-950/60 text-purple-300 border border-purple-500/40 uppercase">
              <EyeOff className="w-2.5 h-2.5 text-purple-400" />
              <span>REDACTED</span>
            </span>
          )}
        </div>

        {/* Tactical Triage Dropdown */}
        <div className="flex items-center gap-2 font-mono text-xs tracking-[0.18em]">
          <span className="text-neutral-500 uppercase">// TRIAGE:</span>
          <select
            aria-label="Triage Status"
            value={claim.status}
            onChange={(e) => onUpdateStatus(claim.id, e.target.value)}
            className="bg-black border border-white/10 text-neutral-200 text-xs font-mono tracking-[0.18em] rounded px-2.5 py-0.5 outline-none focus:border-cyan-400 transition"
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
              className="w-full bg-black border border-cyan-400 rounded-xl p-3 text-sm text-neutral-100 font-mono outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
              placeholder="Update statement..."
            />
            <div className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase font-bold font-mono">
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-500 text-black shadow-[0_0_12px_#00f0ff] transition active:scale-95"
              >
                <Check className="w-3 h-3" />
                <span>SAVE</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-400 transition"
              >
                <X className="w-3 h-3" />
                <span>CANCEL</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm sm:text-base font-heading font-bold tracking-tight text-neutral-100 leading-snug flex-1">
              {claim.statement}
            </p>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Edit statement"
              className="text-neutral-500 hover:text-cyan-300 p-1 rounded hover:bg-white/5 transition shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Anchored Evidence Citation Box */}
        {claim.evidence && (
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 text-xs space-y-2">
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black border border-cyan-400/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono tracking-[0.18em] uppercase font-bold transition group shadow-[0_0_10px_rgba(0,240,255,0.2)] active:scale-95"
              >
                <span>[ // INSPECT_CITATION ]</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <blockquote className="italic text-neutral-300 border-l-2 border-cyan-400/60 pl-3 py-0.5 font-body leading-relaxed text-sm">
              "{claim.evidence.snippet}"
            </blockquote>
          </div>
        )}

        {/* Conflict / Contradiction Notes Callout with Active Theory Rose Wireframe */}
        {claim.conflict_notes && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              claim.status === 'conflicting'
                ? 'bg-[#18050e]/90 border-rose-500/50 text-rose-200 shadow-[0_0_18px_rgba(255,0,127,0.2)]'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-mono text-xs tracking-[0.18em] uppercase">
              {claim.status === 'conflicting' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#ff007f] shrink-0 animate-pulse" />
                  <span className="text-rose-300">// CONTRADICTION_ANALYSIS:</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-300">// UNCERTAINTY_NOTE:</span>
                </>
              )}
            </div>
            <p className="font-body leading-relaxed text-sm pl-5 text-neutral-300">
              {claim.conflict_notes}
            </p>
          </div>
        )}

        {/* Sensitivity Banner */}
        {claim.is_sensitive && (
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between font-mono tracking-[0.18em] uppercase">
            <span className="flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-purple-400" />
              <span>// SENSITIVE_CONTENT: EXCLUDED_FROM_SUCCESSOR_VIEW</span>
            </span>
            <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-900/40 border border-purple-500/40 text-xs">
              REDACTED
            </span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-white/[0.02] px-5 py-3 border-t border-white/5 flex items-center justify-between gap-3 text-xs font-mono">
        {/* Sensitivity Redaction Toggle */}
        <button
          type="button"
          onClick={() => onToggleSensitive(claim.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition active:scale-95 ${
            claim.is_sensitive
              ? 'bg-purple-900/40 text-purple-200 border border-purple-500/50 hover:bg-purple-800/50 shadow-sm'
              : 'bg-black text-neutral-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
          title="Exclude sensitive content"
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition active:scale-95 ${
              claim.is_approved
                ? 'bg-black text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)] hover:border-emerald-400'
                : 'bg-black text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:border-amber-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{claim.is_approved ? '[ APPROVED ✓ ]' : '[ PENDING_REVIEW ]'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
