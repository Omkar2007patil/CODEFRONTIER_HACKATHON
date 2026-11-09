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
} from 'lucide-react'

export default function SuccessorView({
  project,
  approvedClaims,
  onExportMarkdown,
  onExportJson,
  onInspectEvidence,
}) {
  const [completedSteps, setCompletedSteps] = useState({})

  const toggleStep = (id) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const decisions = approvedClaims.filter((c) => c.category === 'decision')
  const blockers = approvedClaims.filter((c) => c.category === 'blocker')
  const nextActions = approvedClaims.filter((c) => c.category === 'next_action')
  const others = approvedClaims.filter(
    (c) => !['decision', 'blocker', 'next_action'].includes(c.category)
  )

  const totalActions = nextActions.length
  const completedCount = nextActions.filter((a) => completedSteps[a.id]).length
  const progressPercent =
    totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 100

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16 font-sans">
      {/* Successor Active Theory Hero Banner */}
      <div className="p-7 sm:p-9 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 shadow-2xl relative overflow-hidden transition-all duration-300 corner-crosshair">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-[#00f0ff]/10 via-transparent to-[#ff007f]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-mono font-bold tracking-[0.18em] text-emerald-400 border border-emerald-500/30 bg-emerald-950/20 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>// TRANSITION_PACKAGE_VERIFIED</span>
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
              assumptions and private credentials have been redacted. Every factual claim is
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

        {/* Onboarding Checklist Telemetry Ribbon */}
        {totalActions > 0 && (
          <div className="mt-7 pt-6 border-t border-white/5 space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#00f0ff] text-[11px] font-bold tracking-widest flex items-center gap-2 uppercase">
                <ListTodo className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Onboarding Progress: {completedCount} / {totalActions} Tasks Completed ({progressPercent}%)</span>
              </span>
              <span className="text-[#00f0ff] font-mono font-extrabold text-[11px] tracking-wider">
                [{completedCount} / {totalActions} &bull; {progressPercent}%]
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

      {/* SECTION 1: Key Architectural Decisions */}
      <section className="space-y-4 font-mono">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <span className="text-cyan-400 font-bold text-xs font-mono">// 01.</span>
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
                <div className="flex items-center gap-2 font-mono text-xs tracking-[0.18em]">
                  <span className="text-cyan-400 font-bold">
                    ADR_#{idx + 1}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-cyan-300 border border-cyan-400/40 bg-cyan-950/20 font-bold uppercase tracking-[0.18em]">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    VERIFIED
                  </span>
                </div>

                <p className="text-sm font-heading font-bold text-neutral-100 tracking-tight leading-snug">
                  {item.statement}
                </p>

                {item.evidence && (
                  <div className="p-3 rounded-lg bg-black/80 border border-white/5 text-xs flex items-center justify-between gap-3 font-mono">
                    <div className="flex items-center gap-2 text-neutral-400 truncate tracking-[0.18em]">
                      <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-cyan-300 font-bold truncate">
                        {item.evidence.source_name}
                      </span>
                      {item.evidence.line_or_section && (
                        <span className="text-neutral-600 shrink-0">
                          &bull; {item.evidence.line_or_section}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onInspectEvidence(item.evidence)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold tracking-[0.18em] uppercase shrink-0 flex items-center gap-1 transition"
                    >
                      <span>[ VIEW_CITATION ]</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {item.conflict_notes && (
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs">
                    <strong className="text-amber-400 font-mono tracking-[0.18em]">// LEAD_NOTE:</strong>{' '}
                    <span className="font-body text-sm leading-relaxed text-neutral-300">{item.conflict_notes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 2: Active Blockers & Known Risks */}
      <section className="space-y-4 font-mono">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <span className="text-rose-400 font-bold text-xs font-mono">// 02.</span>
          <div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight uppercase">
              ACTIVE_BLOCKERS_AND_RISKS
            </h3>
            <p className="font-body text-xs text-neutral-400">
              Unresolved operational incidents, unassigned tickets, and system risks.
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-rose-300 border border-rose-500/50 bg-rose-950/40 font-bold tracking-widest uppercase">
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

                {item.evidence && (
                  <div className="p-3 rounded-lg bg-black/80 border border-white/5 text-xs flex items-center justify-between gap-3 font-mono text-[11px]">
                    <span className="text-neutral-500 truncate">
                      REF: {item.evidence.source_name} ({item.evidence.line_or_section || 'Logs'})
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectEvidence(item.evidence)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold tracking-wider uppercase shrink-0 flex items-center gap-1 transition"
                    >
                      <span>[ INSPECT ]</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 3: Day 1–30 Continuation Checklist */}
      <section className="space-y-4 font-mono">
        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
          <span className="text-teal-400 font-bold text-xs font-mono">// 03.</span>
          <div>
            <h3 className="text-sm sm:text-base font-heading font-bold text-white tracking-tight uppercase">
              DAY_1_30_CHECKLIST
            </h3>
            <p className="font-body text-xs text-neutral-400">
              Successor checklist items. Click to acknowledge and verify each continuation task.
            </p>
          </div>
        </div>

        <div className="grid gap-3 font-sans">
          {nextActions.length === 0 ? (
            <p className="text-xs text-neutral-500 italic p-4 font-mono">// NO_CHECKLIST_ITEMS_DEFINED</p>
          ) : (
            nextActions.map((item) => {
              const isChecked = !!completedSteps[item.id]

              return (
                <div
                  key={item.id}
                  onClick={() => toggleStep(item.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex items-start gap-4 relative corner-crosshair ${
                    isChecked
                      ? 'bg-black/40 border-emerald-500/30 opacity-70'
                      : 'bg-black/60 backdrop-blur-xl border-white/10 hover:border-cyan-400/40 shadow-xl'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 text-neutral-500 hover:text-cyan-400 shrink-0 transition"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400 shadow-[0_0_8px_#34d399]" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-600" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1">
                    <p
                      className={`text-sm sm:text-base font-heading font-bold tracking-tight transition ${
                        isChecked ? 'line-through text-neutral-500' : 'text-neutral-100'
                      }`}
                    >
                      {item.statement}
                    </p>

                    {item.evidence && (
                      <p className="text-xs text-neutral-400 flex items-center gap-2 flex-wrap font-mono tracking-[0.18em]">
                        <span className="text-neutral-600 uppercase text-xs font-bold">// REF:</span>
                        <code className="text-cyan-300 bg-black px-2 py-0.5 rounded border border-white/10 text-xs">
                          {item.evidence.source_name}
                        </code>
                        <span className="font-body italic text-neutral-300 text-sm">"{item.evidence.snippet}"</span>
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-[0.18em] shrink-0 ${
                      isChecked
                        ? 'bg-black text-emerald-400 border border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
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

      {/* SECTION 4: Work in Progress */}
      {others.length > 0 && (
        <section className="space-y-4 font-mono">
          <div className="flex items-center gap-3 pb-2 border-b border-white/5">
            <span className="text-purple-400 font-bold text-xs">// 04.</span>
            <div>
              <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase">
                IN_PROGRESS_AND_CONTEXT
              </h3>
              <p className="text-[11px] text-neutral-500 tracking-wider font-sans">Additional operational context.</p>
            </div>
          </div>

          <div className="grid gap-3 font-sans">
            {others.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-black/60 border border-white/10 text-sm text-neutral-200"
              >
                <div className="text-[10px] font-mono text-purple-400 uppercase font-black tracking-widest mb-1">
                  // {item.category.toUpperCase()}
                </div>
                <p className="font-sans font-medium">{item.statement}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
