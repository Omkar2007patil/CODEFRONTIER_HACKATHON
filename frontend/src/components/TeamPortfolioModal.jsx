import React, { useEffect } from 'react'
import {
  X,
  Award,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  FileCheck,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'

export default function TeamPortfolioModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Glass Dossier Card */}
      <div className="relative z-10 w-full max-w-3xl bg-black/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.15)] overflow-hidden my-auto transition-all duration-300 corner-crosshair">
        {/* Subtle Top Accent Ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00f0ff] via-sky-400 to-[#ff007f] shadow-[0_0_12px_#ff007f]" />

        {/* Modal Top Header */}
        <div className="p-6 sm:p-8 pb-4 flex items-start justify-between border-b border-white/5 relative">
          <div className="space-y-1.5 font-mono">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-[0.25em] uppercase text-rose-300 border border-rose-500/40 bg-rose-950/20 shadow-[0_0_10px_rgba(255,0,127,0.3)]">
                <Award className="w-3 h-3 text-[#ff007f]" />
                <span>ROUND 1 TOP 300 SELECTION</span>
              </span>
              <span className="text-[10px] text-neutral-500 tracking-[0.2em] uppercase">
                // CODEFRONTIER R2 BUILD
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 uppercase">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 drop-shadow-[0_0_16px_rgba(0,240,255,0.4)]">
                // APEX CODERS
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-black border border-white/10 text-neutral-400 font-bold">
                [VIT PUNE]
              </span>
            </h2>

            <p className="text-[11px] text-neutral-400 tracking-wider">
              Vishwakarma Institute of Technology &bull; Department of Computer Engineering
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition active:scale-95 font-mono text-xs"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* Active Theory Mission Manifesto */}
          <div className="p-5 rounded-xl bg-black/80 border border-white/5 space-y-2 relative overflow-hidden font-mono text-xs">
            <div className="flex items-center gap-2 font-black text-cyan-400 tracking-[0.2em] uppercase text-[10px]">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>// THESIS: EVIDENCE-LINKED CONTINUATION ENGINE</span>
            </div>
            <p className="text-neutral-300 leading-relaxed font-sans text-xs">
              "Prevent critical project knowledge from leaving with departing engineers. When engineers transition off,
              crucial context remains fragmented across documents, code repositories, task boards, and chat. Apex
              turns authorized project sources into a verifiable, evidence-linked successor continuation plan."
            </p>
          </div>

          {/* Core Members Showcase */}
          <div className="space-y-3 font-mono">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold flex items-center gap-1.5">
              <span>// CORE_ENGINEERING_DUO</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Member 1: Aayush Patil */}
              <div className="p-5 rounded-xl bg-black/70 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 space-y-3 relative corner-crosshair">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black border border-cyan-400/60 flex items-center justify-center text-cyan-300 font-black text-sm shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                    AP
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Aayush Patil
                    </h4>
                    <p className="text-[11px] text-cyan-400 tracking-wider">
                      Team Lead &bull; Frontend Architect
                    </p>
                  </div>
                </div>

                <div className="text-xs text-neutral-300 font-sans leading-relaxed">
                  Frontend architecture, Active Theory design system, dual-role triage workflows, handover lock modal, and hackathon submission lead.
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 font-mono">
                  {['React', 'Vite', 'Tailwind', 'UX Patterns', 'Product Strategy'].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.2 rounded text-[9px] bg-black text-cyan-300 border border-cyan-400/30 font-bold uppercase tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Member 2: Omkar Patil */}
              <div className="p-5 rounded-xl bg-black/70 border border-white/10 hover:border-rose-500/40 transition-all duration-300 space-y-3 relative corner-crosshair">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black border border-rose-500/60 flex items-center justify-center text-rose-300 font-black text-sm shadow-[0_0_12px_rgba(255,0,127,0.3)]">
                    OP
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Omkar Patil
                    </h4>
                    <p className="text-[11px] text-rose-400 tracking-wider">
                      Backend &bull; Data Lead
                    </p>
                  </div>
                </div>

                <div className="text-xs text-neutral-300 font-sans leading-relaxed">
                  FastAPI microservices, Pydantic contracts, deterministic evidence citation linking, automated contradiction detection, and test automation.
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 font-mono">
                  {['Python', 'FastAPI', 'Pydantic v2', 'PostgreSQL', 'Agentic Pipelines'].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.2 rounded text-[9px] bg-black text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Pipeline Summary */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3 font-mono">
            <h4 className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>// TECHNICAL_SPECIFICATION_MATRIX</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-300 font-mono">
              <div className="p-3 rounded-lg bg-black border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
                  1. ANCHORED CITATIONS
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                  Every factual claim is anchored to exact quotes and line numbers in ingested files.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 bg-[#ff007f] shadow-[0_0_6px_#ff007f]" />
                  2. CONFLICT DETECTION
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                  Deterministic detection of release deadline conflicts and missing ticket owners.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-[10px] tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  3. SERVER REDACTION
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                  Server-side security filter preventing private discussion leakage to successors.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-neutral-500 font-mono">
            <span className="text-[10px] tracking-wider uppercase">
              // STACK: FASTAPI + REACT VITE + TAILWIND CSS
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-black border border-cyan-400/50 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] text-cyan-300 font-mono font-bold text-[10px] uppercase tracking-[0.2em] transition active:scale-95"
            >
              [ // CLOSE_DOSSIER ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
