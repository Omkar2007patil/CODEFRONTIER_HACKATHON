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
} from 'lucide-react'

export default function SuccessorView({
  project,
  approvedClaims = [],
  checklist = [],
  onUpdateChecklistTask,
  onExportMarkdown,
  onExportJson,
  onInspectEvidence,
  onOpenConflictModal,
}) {
  const [updatingTaskKey, setUpdatingTaskKey] = useState(null)

  // Use backend persistent checklist if provided, fallback to project.checklist or empty
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
      alert(`Failed to update checklist item: ${err.message}`)
    } finally {
      setUpdatingTaskKey(null)
    }
  }

  // Filter approved claims
  const decisions = approvedClaims.filter((c) => ['decision', 'decisions'].includes(c.category))
  const blockers = approvedClaims.filter((c) => ['blocker', 'risks_blockers'].includes(c.category))
  const milestones = approvedClaims.filter((c) => c.category === 'project_dates_milestones')
  const configs = approvedClaims.filter((c) => c.category === 'technical_configuration')
  const others = approvedClaims.filter(
    (c) => !['decision', 'decisions', 'blocker', 'risks_blockers', 'project_dates_milestones', 'technical_configuration'].includes(c.category)
  )

  // Check for unresolved conflicts
  const unresolvedConflicts = (project?.conflicts || []).filter((c) => c.status === 'unresolved')

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16 font-sans">
      {/* Successor Active Theory Hero Banner */}
      <div className="p-7 sm:p-9 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 shadow-2xl relative overflow-hidden transition-all duration-300 corner-crosshair">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-[#00f0ff]/10 via-transparent to-[#ff007f]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-mono font-bold tracking-[0.18em] text-emerald-400 border border-emerald-500/30 bg-emerald-950/20 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>// TRANSITION_PACKAGE_SANITIZED_AND_VERIFIED</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight uppercase">
              SUCCESSOR BRIEFING:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300 drop-shadow-[0_0_18px_rgba(0,240,255,0.4)]">
                {project.intended_role}
              </span>
            </h2>

            <p className="font-body text-sm text-neutral-300 leading-relaxed">
              Verified continuation plan prepared by{' '}
              <strong className="text-white font-mono">{project.outgoing_member}</strong>. All unverified
              assumptions and private credentials have been redacted server-side. Every claim is
              anchored to verifiable repository evidence.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onExportMarkdown}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-black border border-cyan-400/50 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(0,240,255,0.35)] text-cyan-300 font-mono font-bold text-xs tracking-[0.15em] uppercase transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>[ EXPORT (.MD) ]</span>
            </button>

            {onExportJson && (
              <button
                type="button"
                onClick={onExportJson}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-black border border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_18px_rgba(255,0,127,0.3)] text-rose-300 font-mono font-bold text-xs tracking-[0.15em] uppercase transition active:scale-95"
              >
                <FileCode className="w-3.5 h-3.5 text-rose-400" />
                <span>[ AUDIT (.JSON) ]</span>
              </button>
            )}
          </div>
        </div>

        {/* Persistent Checklist Telemetry Ribbon */}
        {totalTasks > 0 && (
          <div className="mt-7 pt-6 border-t border-white/5 space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#00f0ff] text-[11px] font-bold tracking-widest flex items-center gap-2 uppercase">
                <ListTodo className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Onboarding Progress: {completedTasks} / {totalTasks} Tasks Completed ({progressPercent}%)</span>
              </span>
              <span className="text-[#00f0ff] font-mono font-extrabold text-[11px] tracking-wider">
                [{completedTasks} / {totalTasks} &bull; {progressPercent}%]
              </span>
            </div>

            <div className="w-full h-2 bg-black rounded-full overflow-hidden p-0 border border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              <div
                className="h-full bg-gradient-to-r from-[#00f0ff] to-[#0284c7] transition-all duration-500 ease-out shadow-[0_0_15px_#00f0ff]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unresolved Conflict Notice for Successor */}
      {unresolvedConflicts.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-xs text-rose-300 uppercase">
              <AlertTriangle className="w-4 h-4 text-[#ff007f] animate-pulse" />
              <span>ATTENTION SUCCESSOR: {unresolvedConflicts.length} UNRESOLVED SCHEDULE/SCOPE CONTRADICTION(S)</span>
            </span>
            {onOpenConflictModal && (
              <button
                type="button"
                onClick={() => onOpenConflictModal(unresolvedConflicts[0])}
                className="text-xs text-cyan-300 hover:text-cyan-200 underline uppercase"
              >
                Inspect Contradiction &rarr;
              </button>
            )}
          </div>
          <p className="font-body text-xs text-neutral-300 leading-relaxed">
            The departing lead and operational logs contain contradictory statements. Do not assume the earlier release date without explicit Lead Reviewer verification.
          </p>
        </div>
      )}

      {/* SECTION 1: Persistent Day 1-30 Successor Checklist */}
      <section className="space-y-4 font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-bold text-xs font-mono">// 01.</span>
            <div>
              <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight uppercase">
                PERSISTENT_DAY_1_30_SUCCESSOR_CHECKLIST
              </h3>
              <p className="font-body text-xs text-neutral-400">
                Tracked in SQLite backend with responsible engineer identities and timestamps.
              </p>
            </div>
          </div>
          <span className="text-xs text-cyan-400 font-bold font-mono">
            {completedTasks}/{totalTasks} DONE
          </span>
        </div>

        <div className="grid gap-3 font-sans">
          {activeChecklist.length === 0 ? (
            <p className="text-xs text-neutral-500 italic p-4 font-mono">// NO_CHECKLIST_ITEMS_DEFINED</p>
          ) : (
            activeChecklist.map((task, idx) => {
              const isChecked = task.status === 'completed'
              const isUpdating = updatingTaskKey === task.task_key

              return (
                <div
                  key={task.id || task.task_key}
                  onClick={() => handleToggleTask(task.task_key, task.status)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex items-start gap-4 relative corner-crosshair ${
                    isChecked
                      ? 'bg-black/40 border-emerald-500/30 opacity-80'
                      : 'bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-400/40 shadow-xl'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isUpdating}
                    className="mt-0.5 text-neutral-500 hover:text-cyan-400 shrink-0 transition"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400 shadow-[0_0_8px_#34d399]" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-600" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500">#{idx + 1}</span>
                      <p
                        className={`text-sm sm:text-base font-heading font-bold tracking-tight transition ${
                          isChecked ? 'line-through text-neutral-500' : 'text-neutral-100'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>

                    <p className="font-body text-xs text-neutral-300 leading-relaxed">
                      {task.description}
                    </p>

                    {task.completed_by && (
                      <p className="text-[10px] text-emerald-400 font-mono pt-1">
                        Completed by: <strong className="text-white">{task.completed_by}</strong> on{' '}
                        {new Date(task.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider shrink-0 ${
                      isChecked
                        ? 'bg-black text-emerald-400 border border-emerald-500/50'
                        : 'bg-black text-neutral-500 border border-white/10'
                    }`}
                  >
                    {isChecked ? '[ COMPLETED ✓ ]' : '[ PENDING ]'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* SECTION 2: Key Architectural Decisions */}
      <section className="space-y-4 font-mono">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <span className="text-cyan-400 font-bold text-xs font-mono">// 02.</span>
          <div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight uppercase">
              ARCHITECTURAL_DECISIONS
            </h3>
            <p className="font-body text-xs text-neutral-400">
              Verified decision records, database architecture, and compliance standards.
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 font-sans">
          {decisions.length === 0 ? (
            <p className="text-xs text-neutral-500 italic p-4 font-mono">// NO_DECISION_RECORDS_LISTED</p>
          ) : (
            decisions.map((item, idx) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 space-y-3 relative corner-crosshair"
              >
                <div className="flex items-center gap-2 font-mono text-xs tracking-wider">
                  <span className="text-cyan-400 font-bold">ADR_#{idx + 1}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-cyan-300 border border-cyan-400/40 bg-cyan-950/20 font-bold uppercase text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    VERIFIED
                  </span>
                </div>

                <p className="text-sm font-heading font-bold text-neutral-100 tracking-tight leading-snug">
                  {item.statement}
                </p>

                {item.evidence && (
                  <div className="p-3 rounded-lg bg-black/80 border border-white/5 text-xs flex items-center justify-between gap-3 font-mono">
                    <div className="flex items-center gap-2 text-neutral-400 truncate">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-cyan-300 font-bold truncate">
                        {item.evidence.source_name}
                      </span>
                      {item.evidence.line_or_section && (
                        <span className="text-neutral-500 shrink-0">
                          &bull; {item.evidence.line_or_section}
                        </span>
                      )}
                    </div>
                    {onInspectEvidence && (
                      <button
                        type="button"
                        onClick={() => onInspectEvidence(item.evidence)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold uppercase shrink-0 flex items-center gap-1 transition"
                      >
                        <span>[ VIEW_CITATION ]</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 3: Active Blockers & Known Risks */}
      <section className="space-y-4 font-mono">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <span className="text-rose-400 font-bold text-xs font-mono">// 03.</span>
          <div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight uppercase">
              ACTIVE_BLOCKERS_AND_RISKS
            </h3>
            <p className="font-body text-xs text-neutral-400">
              Operational incidents, unassigned tickets, and system risks requiring Day-1 triage.
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 font-sans">
          {blockers.length === 0 ? (
            <div className="p-5 rounded-xl bg-black border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider">
              // NO_BLOCKING_INCIDENTS_RECORDED
            </div>
          ) : (
            blockers.map((item, idx) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#12040b]/80 backdrop-blur-xl border border-rose-500/40 hover:border-rose-400 transition-all duration-300 space-y-3 shadow-[0_0_20px_rgba(255,0,127,0.15)] relative corner-crosshair"
              >
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="text-rose-400 font-bold tracking-wider">
                    BLOCKER_#{idx + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-rose-300 border border-rose-500/50 bg-rose-950/40 font-bold uppercase">
                    <AlertTriangle className="w-3 h-3 text-[#ff007f]" />
                    ACTION_REQUIRED
                  </span>
                </div>

                <p className="text-sm font-bold text-white leading-relaxed font-sans">
                  {item.statement}
                </p>

                {item.conflict_notes && (
                  <div className="p-3 rounded-lg bg-black/80 border border-rose-500/30 text-rose-200 text-xs space-y-1 font-mono">
                    <span className="font-bold text-[10px] text-rose-400 tracking-wider uppercase block">
                      // ROOT_CAUSE_HYPOTHESIS:
                    </span>
                    <p className="text-neutral-300 font-sans text-xs">{item.conflict_notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
