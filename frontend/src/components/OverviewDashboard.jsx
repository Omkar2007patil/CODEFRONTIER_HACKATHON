import React from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileText,
  ArrowRight,
  UploadCloud,
  ListTodo,
  ExternalLink,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  Lock,
  UserCheck,
} from 'lucide-react'
import BentoMetricsBar from './BentoMetricsBar'

/**
 * OverviewDashboard
 * Primary screen for Hackathon Judges providing instant 30-second comprehension:
 * - Transition readiness index
 * - Unresolved contradiction alert with 1-click jump
 * - Project dossier & executive transition scope
 * - Bento metrics
 * - Direct navigation to all inspection workflows
 */
export default function OverviewDashboard({
  project,
  stats,
  onNavigateTab,
  onOpenConflictModal,
  onLockHandover,
  currentUser,
}) {
  if (!project) return null

  const claims = project.claims || []
  const conflicts = project.conflicts || []
  const checklist = project.checklist || []

  // Dynamic Transition Readiness Score (0-100%)
  const totalClaims = claims.length
  const approvedClaims = claims.filter((c) => c.is_approved).length
  const unresolvedConflicts = conflicts.filter((c) => c.status === 'unresolved')
  const completedTasks = checklist.filter((t) => t.status === 'completed').length
  const totalTasks = checklist.length || 1

  // Weighted health: 50% claims approved, 30% zero unresolved conflicts, 20% checklist
  const claimRatio = totalClaims > 0 ? (approvedClaims / totalClaims) : 0
  const conflictRatio = conflicts.length > 0 ? (conflicts.length - unresolvedConflicts.length) / conflicts.length : 1.0
  const checklistRatio = completedTasks / totalTasks
  const readinessScore = Math.round((claimRatio * 50) + (conflictRatio * 30) + (checklistRatio * 20))

  const isApproved = project.status === 'approved'

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans">
      {/* 1. Unresolved Contradictions Critical Alert (if present) */}
      {unresolvedConflicts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-rose-950/40 border border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                  // CRITICAL WORK ITEM: {unresolvedConflicts.length} UNRESOLVED CONTRADICTION(S) DETECTED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 uppercase">
                  Blocks Release Lock
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-3xl leading-relaxed">
                Ingested project sources assert conflicting dates or task statuses (e.g., Release Freeze vs Public Launch).
                Handover package approval is strictly blocked until reconciled by a Lead Reviewer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('conflicts')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shrink-0 active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          >
            <span>RECONCILE CONFLICT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top Executive Project Dossier & Transition Health Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Context & Meta (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase bg-cyan-950/60 text-cyan-300 border border-cyan-400/40">
                  {project.project_id || 'APEX-CORE'}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase border ${
                  isApproved
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-950/40 text-amber-300 border-amber-400/40'
                }`}>
                  {project.status ? project.status.toUpperCase() : 'IN REVIEW'}
                </span>
              </div>

              <div className="text-[11px] font-mono text-neutral-400">
                ENGINE: <span className="text-neutral-200">Apex Deterministic v3.0</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight uppercase">
              {project.project_name}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-body">
              {project.summary || 'Enterprise platform transition workspace. Ingests architectural decision records, sprint backlogs, and infrastructure specs to produce evidence-linked handover packages.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-4 border-t border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-neutral-500 block text-[10px] tracking-wider uppercase">Outgoing Contributor</span>
              <span className="text-neutral-200 font-bold truncate block">{project.outgoing_member || 'Alex Chen'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] tracking-wider uppercase">Successor Role</span>
              <span className="text-neutral-200 font-bold truncate block">{project.intended_role || 'Lead Architect'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] tracking-wider uppercase">Ingested Sources</span>
              <span className="text-cyan-400 font-bold block">{project.raw_sources?.length || 0} Files</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] tracking-wider uppercase">Audit Log Status</span>
              <span className="text-emerald-400 font-bold block">SQLite Relational (WAL)</span>
            </div>
          </div>
        </div>

        {/* Transition Readiness Score Gauge Card */}
        <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
              // TRANSITION_READINESS_SCORE
            </span>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl font-mono font-bold tracking-tight ${
                readinessScore >= 80 ? 'text-emerald-400' : readinessScore >= 50 ? 'text-cyan-400' : 'text-amber-400'
              }`}>
                {readinessScore}%
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {readinessScore >= 80 ? 'HIGH READINESS' : 'TRIAGE REQUIRED'}
              </span>
            </div>
          </div>

          {/* Score breakdown metrics */}
          <div className="space-y-2.5 py-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-400">Claim Approval</span>
                <span className="text-neutral-200">{approvedClaims}/{totalClaims} ({totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0}%)</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-400">Contradictions Resolved</span>
                <span className={unresolvedConflicts.length > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {conflicts.length - unresolvedConflicts.length}/{conflicts.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${unresolvedConflicts.length > 0 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                  style={{ width: `${conflicts.length > 0 ? ((conflicts.length - unresolvedConflicts.length) / conflicts.length) * 100 : 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-400">Onboarding Checklist</span>
                <span className="text-neutral-200">{completedTasks}/{totalTasks} ({Math.round(checklistRatio * 100)}%)</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${checklistRatio * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Approval Gate</span>
            {unresolvedConflicts.length > 0 ? (
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1">
                <Lock className="w-3 h-3" /> Blocked (Conflicts)
              </span>
            ) : isApproved ? (
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Locked & Approved
              </span>
            ) : (
              <button
                type="button"
                onClick={onLockHandover}
                className="text-[10px] font-mono text-cyan-300 hover:text-cyan-200 font-bold uppercase underline"
              >
                Ready to Lock &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bento Operational Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 font-mono text-xs text-neutral-400 uppercase tracking-widest">
          <span>// REAL-TIME TRANSITION TELEMETRY</span>
          <span className="text-neutral-500 text-[10px]">CLICK METRIC TO FILTER EVIDENCE</span>
        </div>
        <BentoMetricsBar
          stats={stats}
          onSelectFilter={() => onNavigateTab('evidence')}
        />
      </div>

      {/* 4. Judge Workflow Quick Actions (Fast 30-Second Evaluation Path) */}
      <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>JUDGE EVALUATION WORKFLOWS (FAST PATH)</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Directly jump into any core functional subsystem to test evidence verification, conflict detection, and role policies.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: Evidence Explorer */}
          <button
            type="button"
            onClick={() => onNavigateTab('evidence')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-400/40 transition text-left group flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  01 // PROVENANCE
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">Evidence Explorer</h4>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Inspect claims with exact verbatim excerpts anchored to source files with line numbers.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-300/80 mt-3 block">
              &rarr; View {claims.length} claims
            </span>
          </button>

          {/* Action 2: Conflict Reconciliation */}
          <button
            type="button"
            onClick={() => onNavigateTab('conflicts')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-rose-400/40 transition text-left group flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                  02 // CONTRADICTIONS
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">Contradiction Engine</h4>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Compare contradictory timeline dates side-by-side and record human resolution rationales.
              </p>
            </div>
            <span className="text-[10px] font-mono text-rose-300/80 mt-3 block">
              &rarr; {unresolvedConflicts.length} active conflict(s)
            </span>
          </button>

          {/* Action 3: Reviewer & Audit Trail */}
          <button
            type="button"
            onClick={() => onNavigateTab('audit')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-amber-400/40 transition text-left group flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  03 // REVIEW & AUDIT
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">Reviewer Triage</h4>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Triage claims, manage server-side redactions, and view tamper-evident SQLite audit history.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-300/80 mt-3 block">
              &rarr; Reviewer gate active
            </span>
          </button>

          {/* Action 4: Successor Onboarding Pack */}
          <button
            type="button"
            onClick={() => onNavigateTab('successor')}
            className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-emerald-400/40 transition text-left group flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  04 // SUCCESSOR PACK
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-heading font-bold text-white text-sm">Successor Dashboard</h4>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                Inspect sanitized briefing, redacted credentials, and interactive persistent Day 1–30 checklist.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-300/80 mt-3 block">
              &rarr; Checklist {completedTasks}/{totalTasks}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
