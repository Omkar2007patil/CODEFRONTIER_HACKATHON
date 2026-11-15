import React, { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  ListTodo,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Zap,
  FileCode,
  Lock,
  Layers,
  MapPin,
  RefreshCw,
  UserCheck,
  Building2,
} from 'lucide-react'

/**
 * SuccessorWorkspace Component
 * Focused, practical Day 1-30 transition workspace for incoming successors:
 * - Approved, sanitized handover brief (secrets and unapproved claims excluded)
 * - Key architectural decisions, blockers, milestones, and technical configurations
 * - Persistent onboarding checklist (connected to SQLite backend PUT /api/projects/{id}/checklist/{task_key})
 * - Handover brief and JSON audit export downloads
 */
export default function SuccessorWorkspace({
  project,
  approvedClaims = [],
  checklist = [],
  onUpdateChecklistTask,
  onExportMarkdown,
  onExportJson,
  onInspectEvidence,
  onNavigateTab,
}) {
  const [updatingTaskKey, setUpdatingTaskKey] = useState(null)
  const [activeCategoryTab, setActiveCategoryTab] = useState('decisions') // 'decisions' | 'blockers' | 'milestones' | 'configs'

  const activeChecklist = checklist.length > 0 ? checklist : (project?.checklist || [])
  const totalTasks = activeChecklist.length
  const completedTasks = activeChecklist.filter((t) => t.status === 'completed').length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const handleToggleTask = async (taskKey, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setUpdatingTaskKey(taskKey)
    try {
      if (onUpdateChecklistTask) {
        await onUpdateChecklistTask(taskKey, nextStatus)
      }
    } catch (err) {
      alert(`Checklist update failed: ${err.message}`)
    } finally {
      setUpdatingTaskKey(null)
    }
  }

  // Filter approved claims by category
  const decisions = approvedClaims.filter((c) => ['decision', 'decisions'].includes(c.category))
  const blockers = approvedClaims.filter((c) => ['blocker', 'risks_blockers'].includes(c.category))
  const milestones = approvedClaims.filter((c) => c.category === 'project_dates_milestones')
  const configs = approvedClaims.filter((c) => c.category === 'technical_configuration')

  const unresolvedConflicts = (project?.conflicts || []).filter((c) => c.status === 'unresolved')

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Successor Briefing Header Banner */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              // SANITIZED HANDOVER PACKAGE CERTIFIED FOR SUCCESSOR
            </span>
          </div>

          <h1 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Successor Briefing: {project?.intended_role || 'Senior Backend Engineer'}
          </h1>

          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed font-body">
            Welcome to the project. This workspace contains lead-reviewed operational claims, verified architecture decisions,
            known operational risks, and an interactive Day 1–30 onboarding checklist persisted in SQLite.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
            <span>Outgoing Contributor: <strong className="text-white">{project?.outgoing_member || 'Alex Chen'}</strong></span>
            <span>&bull;</span>
            <span>Approved Claims: <strong className="text-cyan-400">{approvedClaims.length}</strong></span>
            <span>&bull;</span>
            <span>Status: <strong className="text-emerald-400 uppercase">{project?.status || 'Active'}</strong></span>
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Brief (.md)</span>
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111728] hover:bg-slate-800 border border-[#1e293b] text-slate-300 font-bold uppercase tracking-wider transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Persistent Onboarding Checklist */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-cyan-400" />
              <span>Persistent Day 1–30 Onboarding Checklist</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Task completions persist directly to backend SQLite. Refreshing the browser preserves your progress.
            </p>
          </div>

          {/* Progress Gauge */}
          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <span className="text-slate-400">
              {completedTasks}/{totalTasks} Completed
            </span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold text-cyan-400">{progressPercent}%</span>
          </div>
        </div>

        {/* Checklist Task Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeChecklist.map((task) => {
            const isCompleted = task.status === 'completed'
            const isUpdating = updatingTaskKey === task.task_key

            return (
              <div
                key={task.task_key}
                onClick={() => handleToggleTask(task.task_key, task.status)}
                className={`p-3.5 rounded-lg border transition cursor-pointer flex items-start gap-3 select-none ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                    : 'bg-[#111728] border-[#1e293b] hover:border-slate-700 text-slate-200'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 shrink-0 focus:outline-none"
                  aria-label={isCompleted ? 'Mark task pending' : 'Mark task completed'}
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                  )}
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isCompleted ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 rounded bg-black/40 text-slate-400 uppercase border border-white/5">
                      {task.priority || 'NORMAL'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-body">
                    {task.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Categorized Operational Knowledge Dossiers */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
          <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
            Verified Operational Claims & Architecture Dossiers
          </h3>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-xs">
            {[
              { id: 'decisions', label: `Decisions (${decisions.length})` },
              { id: 'blockers', label: `Risks & Blockers (${blockers.length})` },
              { id: 'milestones', label: `Milestones (${milestones.length})` },
              { id: 'configs', label: `Configurations (${configs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategoryTab(tab.id)}
                className={`px-3 py-1.5 rounded-md font-semibold transition uppercase shrink-0 ${
                  activeCategoryTab === tab.id
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-[#111728] border border-[#1e293b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Items */}
        <div className="space-y-3">
          {(() => {
            let activeItems = decisions
            if (activeCategoryTab === 'blockers') activeItems = blockers
            if (activeCategoryTab === 'milestones') activeItems = milestones
            if (activeCategoryTab === 'configs') activeItems = configs

            if (activeItems.length === 0) {
              return (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  No verified claims in this category.
                </div>
              )
            }

            return activeItems.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-xl bg-[#111728] border border-[#1e293b] space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-bold text-cyan-400 uppercase">CLAIM #{claim.id}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>
                      {claim.source_filename || claim.evidence?.source_name || 'Document'} &bull;{' '}
                      {claim.source_location || claim.evidence?.line_or_section || 'Provenance'}
                    </span>
                  </span>
                </div>

                <p className="text-sm font-semibold text-white font-sans leading-relaxed">
                  "{claim.statement}"
                </p>

                {claim.exact_source_excerpt && (
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] text-slate-300 italic">
                    &ldquo;{claim.exact_source_excerpt}&rdquo;
                  </div>
                )}
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
