import React, { useState, useRef, useEffect } from 'react'
import {
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Download,
  Lock,
  Layers,
  Sparkles,
  ArrowLeft,
  PlusCircle,
  ChevronDown,
  FileCode,
  Zap,
  MoreVertical,
  Users,
  CheckCircle2,
  Server,
  Radio,
  User,
  LogOut,
} from 'lucide-react'

export default function Header({
  project,
  healthStatus,
  role,
  setRole,
  currentUser,
  onSwitchUserRole,
  onResetProject,
  onLockHandover,
  onExportMarkdown,
  onExportJson,
  onSelectPreset,
  onOpenPortfolio,
  onBackToLanding,
  onOpenIngest,
  onStartTour,
  onRetryBackend,
  isConnectingBackend,
  stats,
  isResetting,
}) {
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const menuRef = useRef(null)
  const authRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsActionsOpen(false)
      }
      if (authRef.current && !authRef.current.contains(e.target)) {
        setIsAuthOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsActionsOpen(false)
        setIsAuthOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const currentRoleLabel = currentUser
    ? currentUser.role === 'project_reviewer'
      ? 'Reviewer (Jordan)'
      : currentUser.role === 'incoming_successor'
      ? 'Successor (Taylor)'
      : 'Outgoing (Alex)'
    : role === 'lead'
    ? 'Reviewer (Lead)'
    : 'Successor'

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050507]/80 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* ================= ZONE 1: LEFT ================= */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {onBackToLanding && (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-cyan-300 hover:text-cyan-200 border border-white/10 transition active:scale-95 text-xs font-mono tracking-[0.16em] uppercase"
                title="Return to Landing & Team Dossier"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">OVERVIEW</span>
              </button>
            )}

            {/* Title & Status */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full transition-all ${
                    healthStatus === 'Online'
                      ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-pulse'
                      : healthStatus === 'Standalone' || healthStatus === 'Demo'
                      ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                      : healthStatus === 'Checking...'
                      ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-ping'
                      : 'bg-[#ff007f] shadow-[0_0_8px_#ff007f]'
                  }`}
                  title={
                    healthStatus === 'Online'
                      ? 'Connected to FastAPI SQLite Backend'
                      : healthStatus === 'Standalone' || healthStatus === 'Demo'
                      ? 'Standalone Client Engine'
                      : healthStatus
                  }
                />
                <span className="font-heading font-black text-base sm:text-lg tracking-tight uppercase text-white flex items-center gap-1.5">
                  <span className="text-white">APEX</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">
                    HANDOVER
                  </span>
                </span>
              </div>

              {/* Status & Project Pill */}
              <div className="hidden md:flex items-center gap-2 text-[10px] font-mono tracking-[0.18em]">
                <span
                  className={`font-semibold ${
                    healthStatus === 'Online'
                      ? 'text-cyan-400/90'
                      : healthStatus === 'Standalone' || healthStatus === 'Demo'
                      ? 'text-emerald-400/90'
                      : 'text-amber-400/90'
                  }`}
                >
                  {healthStatus === 'Online' ? '// SYS_LIVE_API' : '// SYS_STANDALONE'}
                </span>
                {project?.project_name && (
                  <>
                    <span className="text-neutral-700">&bull;</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400 uppercase truncate max-w-[150px]">
                      {project.project_name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ================= ZONE 2: CENTER (ROLE SWITCHER) ================= */}
          <div className="flex items-center justify-center">
            <div className="bg-black/90 p-1 rounded-xl border border-white/10 flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setRole('lead')
                  if (onSwitchUserRole) onSwitchUserRole('project_reviewer')
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-mono tracking-[0.16em] uppercase font-bold transition-all duration-300 ${
                  role === 'lead'
                    ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-cyan-500/10 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
                }`}
                title="Reviewer & Lead Triage Interface"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">REVIEWER</span>
                <span className="sm:hidden">LEAD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('successor')
                  if (onSwitchUserRole) onSwitchUserRole('incoming_successor')
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-mono tracking-[0.16em] uppercase font-bold transition-all duration-300 ${
                  role === 'successor'
                    ? 'bg-gradient-to-r from-rose-500/25 via-purple-500/20 to-rose-500/10 text-rose-300 border border-rose-400/50 shadow-[0_0_15px_rgba(255,0,127,0.25)]'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]'
                }`}
                title="Sanitized Successor Day-1 View"
              >
                <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>SUCCESSOR</span>
              </button>
            </div>
          </div>

          {/* ================= ZONE 3: RIGHT CLUSTER ================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* 60s Judge Demo Tour CTA */}
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-black tracking-[0.16em] uppercase text-black bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] border border-cyan-200 transition-all duration-300 active:scale-95"
                title="Run interactive 60-second guided judge demo tour"
              >
                <Zap className="w-3.5 h-3.5 text-black fill-black animate-bounce" />
                <span className="hidden md:inline">[ ⚡ 60s_TOUR ]</span>
                <span className="md:hidden">TOUR</span>
              </button>
            )}

            {/* Judge Demo Presets */}
            {onSelectPreset && (
              <div className="relative hidden sm:block">
                <select
                  aria-label="Demo Scenario Presets"
                  onChange={(e) => onSelectPreset(e.target.value)}
                  value={project?.project_id?.includes('auth') ? 'apex-auth-clean' : 'apex-core-2026'}
                  className="bg-black/90 text-cyan-300 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs font-mono tracking-wider outline-none hover:border-cyan-400 transition cursor-pointer appearance-none pr-7 shadow-sm"
                  title="Switch between Judge Demo Presets"
                >
                  <option value="apex-core-2026" className="bg-black text-neutral-200">
                    ⚡ PRESET 1: Gateway (Conflict)
                  </option>
                  <option value="apex-auth-clean" className="bg-black text-neutral-200">
                    ⚡ PRESET 2: Auth (Clean)
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Quick Ingest Button */}
            {onOpenIngest && (
              <button
                type="button"
                onClick={onOpenIngest}
                title="Upload or paste custom project documentation"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-[0.15em] uppercase font-bold rounded-lg bg-black/80 hover:bg-cyan-950/40 text-cyan-400 border border-cyan-500/40 hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>[ + INGEST ]</span>
              </button>
            )}

            {/* Role / Auth Popover */}
            <div className="relative" ref={authRef}>
              <button
                type="button"
                onClick={() => setIsAuthOpen(!isAuthOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase font-bold border border-white/10 bg-black/80 hover:border-cyan-400 text-neutral-300 hover:text-white transition"
                title="Switch server-side authenticated identity"
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">{currentRoleLabel}</span>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {isAuthOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0c0d14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] py-2 z-50 text-xs font-mono divide-y divide-white/5">
                  <div className="px-3 py-1.5 text-[10px] text-neutral-400 uppercase font-bold">
                    // BACKEND_ENFORCED_IDENTITY
                  </div>
                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAuthOpen(false)
                        setRole('lead')
                        if (onSwitchUserRole) onSwitchUserRole('project_reviewer')
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-neutral-200 hover:bg-white/10"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Lead Reviewer (Jordan)</span>
                      </span>
                      {currentUser?.role === 'project_reviewer' && (
                        <span className="text-[10px] text-cyan-400 font-bold">ACTIVE</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAuthOpen(false)
                        setRole('successor')
                        if (onSwitchUserRole) onSwitchUserRole('incoming_successor')
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-neutral-200 hover:bg-white/10"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                        <span>Successor (Taylor)</span>
                      </span>
                      {currentUser?.role === 'incoming_successor' && (
                        <span className="text-[10px] text-rose-400 font-bold">ACTIVE</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAuthOpen(false)
                        setRole('lead')
                        if (onSwitchUserRole) onSwitchUserRole('outgoing_member')
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-neutral-200 hover:bg-white/10"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Outgoing Member (Alex)</span>
                      </span>
                      {currentUser?.role === 'outgoing_member' && (
                        <span className="text-[10px] text-amber-400 font-bold">ACTIVE</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase font-bold border transition ${
                  isActionsOpen
                    ? 'bg-white/10 text-white border-cyan-400/60'
                    : 'bg-black/80 text-neutral-300 border-white/10 hover:text-white'
                }`}
              >
                <MoreVertical className="w-4 h-4 text-cyan-400" />
                <span className="hidden xl:inline">ACTIONS</span>
              </button>

              {isActionsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0c0d14]/95 backdrop-blur-2xl border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] py-2 z-50 text-xs font-mono divide-y divide-white/5">
                  <div className="px-2 py-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] uppercase text-neutral-500 font-bold flex items-center justify-between">
                      <span>// RUNTIME CONNECTION</span>
                      <span className={healthStatus === 'Online' ? 'text-cyan-400' : 'text-emerald-400'}>
                        {healthStatus === 'Online' ? 'LIVE API' : 'STANDALONE'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false)
                        if (onRetryBackend) onRetryBackend()
                      }}
                      disabled={isConnectingBackend}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs uppercase bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-neutral-300 hover:text-white disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        <span>RE-PROBE BACKEND</span>
                      </span>
                      {isConnectingBackend && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
                    </button>
                  </div>

                  {/* Deliverables */}
                  <div className="px-2 py-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] uppercase text-neutral-500 font-bold">
                      // DELIVERABLES
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsOpen(false)
                        onExportMarkdown()
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] text-left uppercase"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>EXPORT BRIEF (.MD)</span>
                    </button>

                    {onExportJson && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsOpen(false)
                          onExportJson()
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 text-left uppercase"
                      >
                        <FileCode className="w-3.5 h-3.5 text-rose-400" />
                        <span>DOWNLOAD AUDIT (.JSON)</span>
                      </button>
                    )}
                  </div>

                  {/* Team Dossier */}
                  {onOpenPortfolio && (
                    <div className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsOpen(false)
                          onOpenPortfolio()
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] text-left uppercase"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-rose-400" />
                          <span>TEAM DOSSIER</span>
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-ping" />
                      </button>
                    </div>
                  )}

                  {/* Handover Approval Lock */}
                  {role === 'lead' && onLockHandover && (
                    <div className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsOpen(false)
                          onLockHandover()
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 text-left font-bold uppercase"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#ff007f]" />
                        <span>LOCK & APPROVE HANDOVER</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
