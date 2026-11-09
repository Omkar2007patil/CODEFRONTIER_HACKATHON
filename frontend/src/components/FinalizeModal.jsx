import React, { useEffect } from 'react'
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Download,
  ArrowRight,
  X,
  ShieldCheck,
  FileCode,
} from 'lucide-react'

export default function FinalizeModal({
  isOpen,
  onClose,
  stats,
  project,
  onLockAndSwitch,
  onExportMarkdown,
  onExportJson,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const hasUnresolvedConflicts = stats.conflicts > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fade-in font-sans">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 bg-black/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(0,240,255,0.18)] overflow-hidden transition-all duration-300 corner-crosshair">
        {/* Subtle Top Accent Ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00f0ff] via-sky-400 to-[#ff007f] absolute top-0 left-0 right-0 shadow-[0_0_10px_#ff007f]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition font-mono text-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 font-mono">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-bold">
            // AUDIT_VERIFICATION_GATE
          </div>
          <h3 className="text-xl font-heading font-bold text-white tracking-tight uppercase">
            LOCK HANDOVER SPECIFICATION
          </h3>
          <p className="font-body text-sm text-neutral-300 leading-relaxed">
            Review transition metrics before committing and locking this package for{' '}
            <strong className="text-cyan-300 font-mono text-xs tracking-wider">{project?.intended_role}</strong>.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>APPROVED_CLAIMS</span>
            </div>
            <div className="text-xl font-black text-emerald-400">
              {stats.approved} <span className="text-[11px] text-neutral-600 font-normal">/ {stats.total}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>PENDING_TRIAGE</span>
            </div>
            <div className="text-xl font-black text-amber-400">
              {stats.pending}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <EyeOff className="w-3.5 h-3.5 text-purple-400" />
              <span>REDACTED_COUNT</span>
            </div>
            <div className="text-xl font-black text-purple-400">
              {stats.sensitive}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black border border-white/5 space-y-1">
            <div className="text-neutral-500 text-[10px] flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff007f]" />
              <span>CONTRADICTIONS</span>
            </div>
            <div className="text-xl font-black text-[#ff007f]">
              {stats.conflicts}
            </div>
          </div>
        </div>

        {/* Warning or Success Message */}
        {hasUnresolvedConflicts ? (
          <div className="p-4 rounded-xl bg-[#14040a] border border-rose-500/40 text-rose-200 text-xs space-y-1 shadow-[0_0_15px_rgba(255,0,127,0.15)] font-mono">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff007f]" />
              // WARNING: {stats.conflicts} UNRESOLVED CONFLICTS DETECTED
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Contradictory and unapproved items are strictly excluded from the successor view until reconciled.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-black border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>// ALL_CLAIMS_VERIFIED: READY_FOR_SUCCESSOR_VIEW</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 font-mono text-xs">
          <button
            type="button"
            onClick={onLockAndSwitch}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-black border border-cyan-400/60 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-cyan-300 font-bold uppercase tracking-[0.15em] transition active:scale-95"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>[ LOCK_AND_SWITCH ]</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onExportMarkdown}
            title="Download Handover Brief as Markdown"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-black hover:bg-white/[0.04] text-neutral-300 font-semibold tracking-wider uppercase border border-white/10 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT (.MD)</span>
          </button>

          {onExportJson && (
            <button
              type="button"
              onClick={onExportJson}
              title="Download Machine-Readable Audit Trail as JSON"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-black hover:bg-white/[0.04] text-rose-300 font-semibold tracking-wider uppercase border border-rose-500/30 hover:border-rose-400 transition active:scale-95"
            >
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              <span>AUDIT (.JSON)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
