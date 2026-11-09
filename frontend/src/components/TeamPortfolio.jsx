import React, { useEffect } from 'react'
import {
  X,
  Award,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Zap,
  Code2,
  Database,
  Layout,
  GitBranch,
  CheckCircle2,
} from 'lucide-react'

export default function TeamPortfolio({ isOpen, onClose }) {
  // ESC key listener & body scroll lock
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Glass Dossier Modal Container */}
      <div className="relative z-10 w-full max-w-4xl bg-[#050507] border border-white/10 hover:border-cyan-400/40 rounded-2xl shadow-[0_0_80px_rgba(0,240,255,0.15)] overflow-hidden my-auto transition-all duration-300 corner-crosshair">
        {/* Ambient Top Glow Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00f0ff] via-sky-400 to-[#ff007f] shadow-[0_0_15px_#ff007f]" />

        {/* Ambient Radial Backlights */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.15),transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(255,0,127,0.15),transparent_70%)] blur-3xl pointer-events-none" />

        {/* 1. Header Section */}
        <div className="p-6 sm:p-8 pb-5 flex items-start justify-between border-b border-white/10 relative z-10">
          <div className="space-y-1.5 font-mono">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-[0.25em] uppercase text-rose-300 border border-rose-500/40 bg-rose-950/20 shadow-[0_0_12px_rgba(255,0,127,0.3)]">
                <Award className="w-3 h-3 text-[#ff007f]" />
                <span>ROUND 1 TOP 300 SELECTION</span>
              </span>
              <span className="text-[10px] text-neutral-500 tracking-[0.2em] uppercase">
                // HACKATHON R2 SPECIFICATION
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-white flex items-center gap-2 uppercase">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 drop-shadow-[0_0_18px_rgba(0,240,255,0.4)]">
                TEAM APEX CODERS
              </span>
              <span className="text-neutral-500 font-normal">&bull;</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 drop-shadow-[0_0_20px_rgba(255,0,127,0.4)]">
                CODEFRONTIER HACKATHON R2
              </span>
            </h2>

            <p className="text-xs font-mono text-neutral-400 tracking-[0.18em] uppercase">
              Vishwakarma Institute of Technology (VIT Pune) &bull; Computer Engineering
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition active:scale-95 font-mono text-xs"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-7 max-h-[75vh] overflow-y-auto scrollbar-thin relative z-10 font-mono">
          {/* 2. Project Spotlight */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-4 relative corner-crosshair">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-mono tracking-[0.18em] uppercase text-cyan-400 font-bold block mb-1">
                  // PROJECT_SPOTLIGHT
                </span>
                <h3 className="text-lg font-heading font-bold text-white uppercase tracking-tight">
                  Knowledge Handover Platform
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono tracking-[0.18em] font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-950/20 uppercase w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                AUDIT_VERIFIED
              </span>
            </div>

            {/* Mission */}
            <div className="space-y-1">
              <span className="text-xs font-mono tracking-[0.18em] uppercase text-neutral-500 font-bold block">
                MISSION_STATEMENT
              </span>
              <p className="font-body text-sm text-neutral-300 leading-relaxed">
                Deterministic, evidence-linked project transition engine preventing institutional knowledge loss.
                When engineers leave a project, critical context is fragmented across documents, code repositories,
                task boards, and meeting logs. Apex synthesizes raw sources into verifiable continuation plans.
              </p>
            </div>

            {/* Core Features Matrix */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-500 font-bold block">
                CORE_CAPABILITIES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-neutral-300">
                <div className="p-3 rounded-xl bg-black/80 border border-white/5 space-y-1">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Evidence Citation</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                    Every statement links to an exact quote snippet and file anchor.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/80 border border-white/5 space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
                    <Zap className="w-3.5 h-3.5 text-[#ff007f]" />
                    <span>Conflict Detection</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                    Automated flags for release timeline clashes and missing ticket owners.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/80 border border-white/5 space-y-1">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Human-in-Loop Triage</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                    Lead review controls for inline editing, redaction, and claim approvals.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/80 border border-white/5 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Successor View</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                    Clean continuation checklist with interactive Day 1 onboarding progress.
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Stack Chips */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase mr-1">
                STACK:
              </span>
              {[
                { name: 'React', color: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/20' },
                { name: 'Vite', color: 'text-purple-300 border-purple-500/30 bg-purple-950/20' },
                { name: 'Tailwind CSS', color: 'text-sky-300 border-sky-500/30 bg-sky-950/20' },
                { name: 'FastAPI', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20' },
                { name: 'PostgreSQL', color: 'text-blue-300 border-blue-500/30 bg-blue-950/20' },
                { name: 'Pydantic v2', color: 'text-rose-300 border-rose-500/30 bg-rose-950/20' },
              ].map((tech) => (
                <span
                  key={tech.name}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-bold border uppercase ${tech.color}`}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Team Profiles */}
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 font-bold block">
              // ENGINEERING_LEADERSHIP
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Member 1: Aayush Patil */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 space-y-3 relative corner-crosshair">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-black border border-cyan-400/60 flex items-center justify-center text-cyan-300 font-black text-base shadow-[0_0_15px_rgba(0,240,255,0.3)] font-mono">
                    AP
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-bold text-white uppercase tracking-tight">
                      Aayush Patil
                    </h4>
                    <p className="text-xs font-mono text-cyan-400 tracking-[0.18em] uppercase">
                      Team Lead &bull; Frontend Architect
                    </p>
                  </div>
                </div>

                <div className="font-body text-sm text-neutral-300 leading-relaxed">
                  Responsible for UI/UX systems design, Active Theory cyber design language, claim triage workflows, client state management, dual-role filtering, and submission coordination.
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 text-xs font-mono tracking-[0.18em]">
                  {['UI/UX Systems', 'Triage Workflows', 'Client State', 'React', 'Vite'].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-black text-cyan-300 border border-cyan-400/30 font-bold uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Member 2: Omkar Patil */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 hover:border-rose-500/50 transition-all duration-300 space-y-3 relative corner-crosshair">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-black border border-rose-500/60 flex items-center justify-center text-rose-300 font-black text-base shadow-[0_0_15px_rgba(255,0,127,0.3)] font-mono">
                    OP
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-bold text-white uppercase tracking-tight">
                      Omkar Patil
                    </h4>
                    <p className="text-xs font-mono text-rose-400 tracking-[0.18em] uppercase">
                      Backend &bull; Data Lead
                    </p>
                  </div>
                </div>

                <div className="font-body text-sm text-neutral-300 leading-relaxed">
                  Responsible for FastAPI services architecture, Pydantic data schemas, LLM extraction pipeline, citation anchoring heuristics, conflict detection algorithms, and test suites.
                </div>

                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 text-xs font-mono tracking-[0.18em]">
                  {['FastAPI Services', 'Pydantic Schemas', 'LLM Pipeline', 'Python', 'PostgreSQL'].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-black text-rose-300 border border-rose-500/30 font-bold uppercase"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-neutral-500 text-xs">
            <span className="text-[10px] tracking-[0.2em] uppercase">
              // APEX CODERS &bull; CODEFRONTIER ROUND 2
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-black border border-cyan-400/60 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-cyan-300 font-mono font-bold text-[11px] uppercase tracking-[0.2em] transition active:scale-95"
            >
              [ // CLOSE_DOSSIER ]
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

