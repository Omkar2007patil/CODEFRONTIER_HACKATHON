import React, { useState } from 'react'
import {
  FileText,
  Upload,
  Zap,
  Sparkles,
  X,
  Terminal,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const SAMPLE_CUSTOM_SNIPPET = `# Architecture Notes & Sprint Review - Apex Core
Date: 2026-11-04
Author: Alex Chen (Departing Lead)

## ADR-005: Event Bus Selection
### Status: Accepted
We evaluated RabbitMQ vs Kafka for internal event dispatching. RabbitMQ is selected for audit event routing due to low operational overhead and reliable dead-letter exchange support.

## Critical Staging Blocker
- STAGING INCIDENT: Auth token verification times out under high load.
- Owner: UNASSIGNED. Ticket logged as APEX-502.

## Next Actions
- Step 1: Deploy RabbitMQ broker on staging cluster.
- Step 2: Audit JWT expiration settings.`

export default function CustomIngestModal({
  isOpen,
  onClose,
  onIngestCustomText,
  onLoadSampleDataset,
}) {
  const [projectName, setProjectName] = useState('Apex Enterprise Gateway')
  const [outgoingMember, setOutgoingMember] = useState('Alex Chen (Lead Architect)')
  const [intendedRole, setIntendedRole] = useState('Incoming Full-Stack Engineer')
  const [rawText, setRawText] = useState('')
  const [filename, setFilename] = useState('handover_notes.md')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleProcessCustom = async () => {
    if (!rawText.trim()) {
      alert('Please enter or paste raw document text.')
      return
    }

    setIsProcessing(true)
    try {
      await onIngestCustomText({
        project_name: projectName,
        outgoing_member: outgoingMember,
        intended_role: intendedRole,
        raw_text: rawText,
        filename: filename || 'handover_notes.md',
      })
      onClose()
    } catch (err) {
      alert(`Error extracting claims: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseSnippet = () => {
    setRawText(SAMPLE_CUSTOM_SNIPPET)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-[#050507] border border-white/10 hover:border-cyan-400/40 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden my-auto transition-all duration-300 corner-crosshair">
        {/* Subtle Top Accent Ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-[#ff007f] shadow-[0_0_10px_#ff007f]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 flex items-start justify-between border-b border-white/10 font-mono">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-bold block">
              // DATA_INGESTION_GATEWAY
            </span>
            <h3 className="text-xl font-heading font-bold text-white tracking-tight uppercase">
              Ingest & Reconstruct Project Knowledge
            </h3>
            <p className="font-body text-sm text-neutral-300 leading-relaxed">
              Paste raw documentation or load our prepared evaluation dataset with intentional conflict detection.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition font-mono text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 font-mono text-xs">
          {/* Quick Choice: Load Preset 1 or Preset 2 */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>// JUDGE DEMO PRESET EVALUATION</span>
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                ONE-CLICK SCENARIO LOADERS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onLoadSampleDataset('apex-core-2026')
                  onClose()
                }}
                className="p-3 rounded-lg bg-black/80 border border-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_15px_rgba(255,0,127,0.25)] text-left transition active:scale-95 group"
              >
                <div className="text-rose-300 font-bold text-xs uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span>PRESET 1: ENTERPRISE GATEWAY</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans mt-1">
                  Active Redis blocker + ADR release date conflict between Nov 10 freeze & Nov 15 launch.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSampleDataset('apex-auth-clean')
                  onClose()
                }}
                className="p-3 rounded-lg bg-black/80 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] text-left transition active:scale-95 group"
              >
                <div className="text-cyan-300 font-bold text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PRESET 2: CLEAN AUTH HANDOFF</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-sans mt-1">
                  All-green, Ed25519 verified, zero open blockers, ready for instant successor locking.
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-600 font-bold text-[10px] tracking-widest uppercase">
            <div className="flex-1 h-px bg-white/10" />
            <span>OR PASTE YOUR OWN DOCUMENTATION</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-neutral-200 outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Outgoing Lead
              </label>
              <input
                type="text"
                value={outgoingMember}
                onChange={(e) => setOutgoingMember(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-neutral-200 outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                Successor Target Role
              </label>
              <input
                type="text"
                value={intendedRole}
                onChange={(e) => setIntendedRole(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-neutral-200 outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Raw Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-neutral-400 uppercase tracking-wider block">
                Raw Artifact / Markdown Content
              </label>
              <button
                type="button"
                onClick={handleUseSnippet}
                className="text-cyan-400 hover:text-cyan-300 text-[10px] underline uppercase tracking-wider"
              >
                + Insert Sample ADR Snippet
              </button>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="# Paste project notes, meeting retro, architecture decisions, or sprint tasks here..."
              className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-xs text-neutral-200 font-mono outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition leading-relaxed"
            />
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
              // PARSES DECISIONS, BLOCKERS, AND NEXT ACTIONS AUTOMATICALLY
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-black hover:bg-white/[0.04] text-neutral-400 border border-white/10 text-xs uppercase tracking-wider transition"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleProcessCustom}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-black font-bold text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full" />
                    <span>EXTRACTING CLAIMS...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-black" />
                    <span>[ 🚀 EXTRACT & RECONSTRUCT ]</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

