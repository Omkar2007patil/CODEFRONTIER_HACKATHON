import React from 'react'
import {
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Download,
  Lock,
  Layers,
  Sparkles,
  Award,
  Terminal,
  ArrowLeft,
  PlusCircle,
  ChevronDown,
  FileCode,
  Zap,
} from 'lucide-react'

export default function Header({
  project,
  healthStatus,
  role,
  setRole,
  onResetProject,
  onLockHandover,
  onExportMarkdown,
  onExportJson,
  onSelectPreset,
  onOpenPortfolio,
  onBackToLanding,
  onOpenIngest,
  onStartTour,
  stats,
  isResetting,
}) {
  return (
    <header className="bg-black/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Active Theory High-Impact Duo-Tone Typography */}
          <div className="space-y-1">
            {/* Super-Header */}
            <div className="flex items-center gap-2.5 text-xs font-mono tracking-[0.18em] uppercase text-neutral-500">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-cyan-300 hover:text-cyan-200 border border-white/10 transition active:scale-95 mr-1 font-mono text-xs uppercase tracking-[0.18em]"
                  title="Return to Landing & Team Overview"
                >
                  <ArrowLeft className="w-3 h-3 text-cyan-400" />
                  <span>OVERVIEW</span>
                </button>
              )}
              <span className="text-cyan-400 font-bold">// APEX CODERS LABS</span>
              <span className="text-neutral-700">&bull;</span>
              <span>CODEFRONTIER R2</span>
              <span className="text-neutral-700">&bull;</span>
              <span className="text-rose-400 font-semibold">[SYS_READY]</span>
            </div>

            {/* Large Display Title with Active Theory Duo-Tone Glow */}
            <div className="flex items-center gap-2.5 text-2xl sm:text-3xl font-heading font-bold tracking-tight uppercase select-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 drop-shadow-[0_0_24px_rgba(0,240,255,0.4)]">
                KNOWLEDGE
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 drop-shadow-[0_0_28px_rgba(255,0,127,0.45)]">
                HANDOVER
              </span>
            </div>

            {/* Sub-meta */}
            {project && (
              <div className="text-xs font-mono text-neutral-400 flex items-center gap-2 flex-wrap tracking-[0.18em] uppercase">
                <span className="text-neutral-500">// TARGET:</span>
                <span className="text-white font-semibold">{project.project_name}</span>
                <span className="text-neutral-700">&bull;</span>
                <span className="text-neutral-500">OUTGOING:</span>
                <span className="text-cyan-300">{project.outgoing_member}</span>
                <span className="text-neutral-700">&bull;</span>
                <span className="text-neutral-500">SUCCESSOR:</span>
                <span className="text-rose-300">{project.intended_role}</span>
              </div>
            )}
          </div>

          {/* Right: Tactical Buttons & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live System Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-xs font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  healthStatus === 'Online'
                    ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse'
                    : 'bg-[#ff007f] shadow-[0_0_8px_#ff007f]'
                }`}
              />
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-neutral-400 font-bold">
                {healthStatus === 'Online' ? '// SYS_ONLINE' : '// SYS_OFFLINE'}
              </span>
            </div>

            {/* Active Theory Style Team Dossier Button */}
            <button
              type="button"
              onClick={onOpenPortfolio}
              className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-[0.2em] uppercase text-white transition-all duration-300 bg-black/60 border border-rose-500/40 hover:border-[#ff007f] hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] active:scale-95"
            >
              <span className="text-rose-400 font-bold">[ //</span>
              <span className="text-slate-200 group-hover:text-white transition-colors">TEAM_DOSSIER</span>
              <span className="text-rose-400 font-bold">]</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] shadow-[0_0_6px_#ff007f] animate-ping" />
            </button>

            {/* 60s Judge Demo Tour CTA */}
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-black tracking-[0.16em] uppercase text-black bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] border border-cyan-200 transition-all duration-300 active:scale-95"
                title="Run interactive 60-second guided judge demo tour"
              >
                <Zap className="w-3.5 h-3.5 text-black fill-black animate-bounce" />
                <span>[ ⚡ 60s_JUDGE_TOUR ]</span>
              </button>
            )}

            {/* Tactical Dual-Role Switcher */}
            <div className="bg-black/90 p-1 rounded-xl border border-white/10 flex items-center">
              <button
                type="button"
                onClick={() => setRole('lead')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-[0.15em] uppercase font-bold transition-all duration-300 ${
                  role === 'lead'
                    ? 'bg-gradient-to-r from-cyan-600/50 to-blue-600/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-cyan-400/50'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>REVIEWER_MODE</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('successor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-[0.15em] uppercase font-bold transition-all duration-300 ${
                  role === 'successor'
                    ? 'bg-gradient-to-r from-rose-600/50 via-pink-600/40 to-purple-600/40 text-rose-300 shadow-[0_0_15px_rgba(255,0,127,0.35)] border border-rose-400/50'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>SUCCESSOR_VIEW</span>
              </button>
            </div>

            {/* Judge Demo Scenario Presets Dropdown */}
            {onSelectPreset && (
              <div className="relative">
                <select
                  aria-label="Demo Scenario Presets"
                  onChange={(e) => onSelectPreset(e.target.value)}
                  value={project?.project_id?.includes('auth') ? 'apex-auth-clean' : 'apex-core-2026'}
                  className="bg-black/90 text-cyan-300 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-mono tracking-wider outline-none hover:border-cyan-400 transition cursor-pointer appearance-none pr-8 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                  title="Switch between Judge Demo Presets"
                >
                  <option value="apex-core-2026" className="bg-black text-neutral-200">
                    ⚡ PRESET 1: Enterprise Gateway (Conflicts)
                  </option>
                  <option value="apex-auth-clean" className="bg-black text-neutral-200">
                    ⚡ PRESET 2: Clean Auth (Verified)
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Custom Ingest Modal Trigger */}
            {onOpenIngest && (
              <button
                type="button"
                onClick={onOpenIngest}
                title="Paste custom project documentation or logs"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase font-bold rounded-lg bg-black/80 hover:bg-cyan-950/40 text-cyan-400 border border-cyan-500/50 hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(0,240,255,0.3)] transition active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>[ + INGEST NEW SOURCES ]</span>
              </button>
            )}

            {/* Reset Button */}
            <button
              type="button"
              onClick={onResetProject}
              disabled={isResetting}
              title="Reset project data to scenario default"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase rounded-lg bg-black/60 hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-200 border border-white/10 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden xl:inline">RESET</span>
            </button>

            {/* Export Markdown Button */}
            <button
              type="button"
              onClick={onExportMarkdown}
              title="Download verified handover plan as Markdown"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase rounded-lg bg-black/60 hover:bg-white/[0.06] text-neutral-300 border border-white/10 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT (.MD)</span>
            </button>

            {/* Export JSON Audit Button */}
            {onExportJson && (
              <button
                type="button"
                onClick={onExportJson}
                title="Download complete audit trail as JSON"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase rounded-lg bg-black/60 hover:bg-white/[0.06] text-rose-300 border border-rose-500/30 hover:border-rose-400 transition active:scale-95"
              >
                <FileCode className="w-3.5 h-3.5 text-rose-400" />
                <span>AUDIT (.JSON)</span>
              </button>
            )}

            {/* Approve & Lock (Reviewer Mode Only) */}
            {role === 'lead' && (
              <button
                type="button"
                onClick={onLockHandover}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono tracking-[0.15em] uppercase font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] text-black border border-cyan-300 transition-all duration-300 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>LOCK_HANDOVER</span>
              </button>
            )}
          </div>
        </div>

        {/* Tactical Telemetry Ribbon */}
        {role === 'lead' && stats && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-400 gap-3 tracking-[0.18em] uppercase">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
                TOTAL_CLAIMS: <strong className="text-white font-mono">{stats.total}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                VERIFIED_APPROVED: <strong className="text-emerald-400 font-mono">{stats.approved}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                PENDING_TRIAGE: <strong className="text-amber-400 font-mono">{stats.pending}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#ff007f] shadow-[0_0_8px_#ff007f]" />
                CONTRADICTIONS: <strong className="text-rose-400 font-mono">{stats.conflicts}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                REDACTED_SENSITIVE: <strong className="text-purple-300 font-mono">{stats.sensitive}</strong>
              </span>
            </div>

            <div className="text-[10px] tracking-[0.18em] uppercase text-neutral-500">
              // POLICY: UNAPPROVED_OR_REDACTED_CLAIMS_OMITTED_IN_SUCCESSOR_VIEW
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
