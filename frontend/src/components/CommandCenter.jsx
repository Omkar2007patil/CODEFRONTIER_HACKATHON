import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileText,
  Files,
  ArrowRight,
  ListTodo,
  ExternalLink,
  History,
  Lock,
  UserCheck,
  Search,
  Zap,
  Activity,
  Layers,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react'

/**
 * CommandCenter Component
 * Central executive overview providing instant 30-second comprehension:
 * - Handover readiness score (explicit, defensible calculation based on real backend data)
 * - Live derived telemetry (processed documents, claims, evidence support, conflicts, checklist)
 * - Critical blocker alerts with 1-click jump to resolve
 * - Contextual next actions
 * - Outstanding review queue preview
 * - Recent audit activity stream loaded live from SQLite database
 */
export default function CommandCenter({
  project,
  stats,
  onNavigateTab,
  onOpenConflictModal,
  onLockHandover,
  currentUser,
  activeApiBase,
  authToken,
}) {
  const [recentLogs, setRecentLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  const claims = project?.claims || []
  const conflicts = project?.conflicts || []
  const checklist = project?.checklist || []
  const sources = project?.raw_sources || []

  // 1. Defensible Handover Readiness Formula:
  // - 40% Weight: Proportion of claims reviewed and approved
  // - 35% Weight: Conflict freedom (0 unresolved conflicts gives full 35%; any unresolved drops proportionally)
  // - 25% Weight: Day 1-30 Successor checklist tasks completed
  const totalClaims = claims.length
  const approvedClaims = claims.filter((c) => c.is_approved).length
  const unresolvedConflicts = conflicts.filter((c) => c.status === 'unresolved')
  const completedTasks = checklist.filter((t) => t.status === 'completed').length
  const totalTasks = checklist.length || 1

  const supportedClaims = claims.filter((c) => c.validation_status === 'supported').length
  const unverifiedClaims = claims.filter(
    (c) => c.validation_status === 'needs_human_review' || c.validation_status === 'missing_evidence' || c.validation_status === 'unsupported'
  ).length
  const pendingApprovals = claims.filter((c) => !c.is_approved).length

  const claimRatio = totalClaims > 0 ? approvedClaims / totalClaims : 0
  const conflictRatio = conflicts.length > 0 ? (conflicts.length - unresolvedConflicts.length) / conflicts.length : 1.0
  const checklistRatio = completedTasks / totalTasks
  const readinessScore = Math.round(claimRatio * 40 + conflictRatio * 35 + checklistRatio * 25)

  const isApproved = project?.status === 'approved'

  // Fetch recent audit activity from SQLite
  useEffect(() => {
    let isMounted = true
    const fetchRecentAudit = async () => {
      if (!activeApiBase || !project?.project_id) return
      setLoadingLogs(true)
      try {
        const res = await fetch(`${activeApiBase}/projects/${project.project_id}/audit-logs`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setRecentLogs(data.slice(0, 6))
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingLogs(false)
      }
    }
    fetchRecentAudit()
    return () => {
      isMounted = false
    }
  }, [project?.project_id, activeApiBase, authToken])

  // Contextual Next Actions Generator based on actual project state
  const nextActions = []
  if (unresolvedConflicts.length > 0) {
    nextActions.push({
      id: 'resolve_conflicts',
      title: `Reconcile ${unresolvedConflicts.length} Cross-Document Contradiction(s)`,
      description: 'Ingested documents assert conflicting dates or milestone targets. Reconcile in Conflict Lab before locking handover.',
      targetTab: 'conflicts',
      urgency: 'critical',
      badge: 'BLOCKER',
    })
  }
  if (pendingApprovals > 0) {
    nextActions.push({
      id: 'review_approvals',
      title: `Certify ${pendingApprovals} Pending Operational Claim(s)`,
      description: 'Review claims extracted from architecture decision records and sprint boards for accuracy.',
      targetTab: 'review',
      urgency: 'high',
      badge: `${pendingApprovals} PENDING`,
    })
  }
  if (unverifiedClaims > 0) {
    nextActions.push({
      id: 'inspect_evidence',
      title: `Inspect ${unverifiedClaims} Claim(s) with Low Evidence Confidence`,
      description: 'Verify source citations or request clarification from the outgoing engineering lead.',
      targetTab: 'evidence',
      urgency: 'medium',
      badge: 'REVIEW CITATIONS',
    })
  }
  if (completedTasks < totalTasks) {
    nextActions.push({
      id: 'complete_checklist',
      title: `Advance Day 1–30 Successor Checklist (${completedTasks}/${totalTasks} Tasks)`,
      description: 'Onboarding tasks remain uncompleted. Update checklist progress in the Successor Workspace.',
      targetTab: 'successor',
      urgency: 'normal',
      badge: `${Math.round(checklistRatio * 100)}% COMPLETE`,
    })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Critical Blocker Alert (Conditional on Unresolved Conflicts) */}
      {unresolvedConflicts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-rose-950/30 border border-rose-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-300">
                  Critical Blocker: {unresolvedConflicts.length} Unresolved Contradiction(s) Detected
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold uppercase">
                  Approval Blocked
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Ingested project sources assert mutual contradictions (e.g. Release Freeze date vs Public Beta Launch date).
                Handover package certification is blocked until reconciled by a Lead Reviewer in the Conflict Lab.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('conflicts')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shrink-0 active:scale-95 shadow-sm"
          >
            <span>Resolve in Conflict Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top Executive Section: Dossier & Readiness Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Context Dossier (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {project?.project_id || 'APEX-CORE'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase border ${
                    isApproved
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {project?.status ? project.status.toUpperCase() : 'IN REVIEW'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Engine: <span className="text-slate-200">Apex Deterministic v3.0</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight uppercase">
              {project?.project_name || 'Apex Core Enterprise Gateway'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-body max-w-3xl">
              {project?.summary ||
                'Enterprise platform transition workspace. Ingests architectural decision records, sprint backlogs, and infrastructure specs to produce evidence-linked handover packages.'}
            </p>
          </div>

          {/* Dossier Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-4 border-t border-[#1e293b] text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] tracking-wider uppercase">Outgoing Contributor</span>
              <span className="text-slate-200 font-bold truncate block">{project?.outgoing_member || 'Alex Chen'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] tracking-wider uppercase">Successor Role</span>
              <span className="text-slate-200 font-bold truncate block">{project?.intended_role || 'Senior Backend Engineer'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] tracking-wider uppercase">Ingested Sources</span>
              <span className="text-cyan-400 font-bold block">{sources.length} Documents</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] tracking-wider uppercase">Database Storage</span>
              <span className="text-emerald-400 font-bold block">SQLite Relational (WAL)</span>
            </div>
          </div>
        </div>

        {/* Handover Readiness Score Card (1 Col) */}
        <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-semibold">
                HANDOVER READINESS
              </span>
              <span className="text-[10px] font-mono text-cyan-400">WEIGHTED INDEX</span>
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <span
                className={`text-5xl font-mono font-bold tracking-tight ${
                  readinessScore >= 80 ? 'text-emerald-400' : readinessScore >= 50 ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                {readinessScore}%
              </span>
              <span className="text-xs font-mono text-slate-400">
                {readinessScore >= 80 ? 'Ready for Handover' : readinessScore >= 50 ? 'In Triage' : 'Action Required'}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-500 ${
                  readinessScore >= 80 ? 'bg-emerald-400' : readinessScore >= 50 ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, readinessScore))}%` }}
              />
            </div>
          </div>

          {/* Breakdown Explanation */}
          <div className="pt-4 border-t border-[#1e293b] space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Claims Approved (40% wt):</span>
              <span className="text-slate-200">
                {approvedClaims}/{totalClaims} ({Math.round(claimRatio * 100)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conflict Freedom (35% wt):</span>
              <span className={unresolvedConflicts.length === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {unresolvedConflicts.length === 0 ? '100% (0 Blockers)' : `${unresolvedConflicts.length} Unresolved`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Checklist Progress (25% wt):</span>
              <span className="text-slate-200">
                {completedTasks}/{totalTasks} ({Math.round(checklistRatio * 100)}%)
              </span>
            </div>
          </div>

          {/* Reviewer Lock Button */}
          <div className="pt-4">
            <button
              type="button"
              onClick={onLockHandover}
              disabled={unresolvedConflicts.length > 0}
              className={`w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                unresolvedConflicts.length > 0
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm active:scale-95'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isApproved ? 'Handover Certified & Locked' : 'Certify & Lock Handover'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Metrics Bento Grid (Real Backend Counts) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Metric 1: Ingested Documents */}
        <div
          onClick={() => onNavigateTab('documents')}
          className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-cyan-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Documents</span>
            <Files className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-1 group-hover:text-cyan-300 transition">
            {sources.length}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ingested sources</div>
        </div>

        {/* Metric 2: Extracted Claims */}
        <div
          onClick={() => onNavigateTab('evidence')}
          className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-cyan-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Total Claims</span>
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-1 group-hover:text-cyan-300 transition">
            {totalClaims}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Reconstructed items</div>
        </div>

        {/* Metric 3: Supported Claims */}
        <div
          onClick={() => onNavigateTab('evidence')}
          className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-emerald-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Supported</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {supportedClaims}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Anchored citations</div>
        </div>

        {/* Metric 4: Needs Review / Unverified */}
        <div
          onClick={() => onNavigateTab('evidence')}
          className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Needs Review</span>
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {unverifiedClaims}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Low confidence</div>
        </div>

        {/* Metric 5: Unresolved Conflicts */}
        <div
          onClick={() => onNavigateTab('conflicts')}
          className={`p-3.5 rounded-xl border transition cursor-pointer group ${
            unresolvedConflicts.length > 0
              ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
              : 'bg-[#0c101c] border-[#1e293b] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Conflicts</span>
            <AlertCircle className={`w-3.5 h-3.5 ${unresolvedConflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div
            className={`text-2xl font-mono font-bold mt-1 ${
              unresolvedConflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {unresolvedConflicts.length}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {unresolvedConflicts.length > 0 ? 'Release blockers' : 'Zero blockers'}
          </div>
        </div>

        {/* Metric 6: Pending Approvals */}
        <div
          onClick={() => onNavigateTab('review')}
          className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Pending</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {pendingApprovals}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Awaiting sign-off</div>
        </div>

        {/* Metric 7: Successor Checklist */}
        <div
          onClick={() => onNavigateTab('successor')}
          className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] hover:border-cyan-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span>Checklist</span>
            <ListTodo className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Day 1-30 onboarded</div>
        </div>
      </div>

      {/* 4. Split Region: Contextual Next Actions & Outstanding Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Next Action Items (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                Contextual Next Actions
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {nextActions.length} prioritized tasks
            </span>
          </div>

          <div className="space-y-2.5">
            {nextActions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p>All review items and conflict blockers reconciled! Ready for final handover lock.</p>
              </div>
            ) : (
              nextActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => onNavigateTab(action.targetTab)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 group ${
                    action.urgency === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                      : action.urgency === 'high'
                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                      : 'bg-[#111728] border-[#1e293b] hover:border-cyan-500/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase border ${
                          action.urgency === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : action.urgency === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {action.badge}
                      </span>
                      <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition truncate">
                        {action.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{action.description}</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Project Audit Activity Stream (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                  Recent Audit Activity
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('audit')}
                className="text-[10px] font-mono text-cyan-400 hover:underline"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {loadingLogs ? (
                <div className="py-8 text-center text-slate-400 font-mono text-xs">
                  Loading SQLite audit records...
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-mono text-xs">
                  No audit activity recorded yet.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-[#111728] border border-[#1e293b] flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="font-semibold text-white truncate capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        by {log.user_email || 'system'} &bull; {log.entity_type} #{log.entity_id}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Deep Workflow Links */}
          <div className="pt-3 border-t border-[#1e293b] grid grid-cols-2 gap-2 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => onNavigateTab('evidence')}
              className="p-2 rounded bg-[#111728] border border-[#1e293b] hover:border-slate-700 text-slate-300 text-left transition truncate"
            >
              &rarr; Evidence Explorer
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('conflicts')}
              className="p-2 rounded bg-[#111728] border border-[#1e293b] hover:border-slate-700 text-slate-300 text-left transition truncate"
            >
              &rarr; Conflict Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
