import React from 'react'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  FileText,
  Zap,
  Terminal,
} from 'lucide-react'

const TOUR_STEPS = [
  {
    step: 1,
    title: 'EVIDENCE CITATION & TRACEABILITY',
    subtitle: 'Zero hallucinations: Every claim is linked to source text',
    tag: '// 01. DETERMINISTIC_ANCHORING',
    color: 'cyan',
    icon: FileText,
    description:
      'The platform ingests unstructured markdown, meeting transcripts, and sprint logs. Every extracted claim carries an immutable citation snippet pointing to the exact line, section, and file.',
    actionNote: 'Notice the left panel: Snippet highlighted and anchored from architecture_decision_record.md',
    mode: 'lead',
  },
  {
    step: 2,
    title: 'DETERMINISTIC CONFLICT ENGINE',
    subtitle: 'Automated milestone & timeline contradiction detection',
    tag: '// 02. TIMELINE_CONTRADICTIONS',
    color: 'rose',
    icon: AlertTriangle,
    description:
      'Our heuristic conflict engine parses date milestones and architectural decisions across files. It automatically flags contradictions—like ADR-004 mandating a Nov 10 freeze while Sprint 44 plans a Nov 15 launch without buffer.',
    actionNote: 'Contradiction badge highlighted in Neon Rose. Flagged claims are quarantined from successor view.',
    mode: 'lead',
  },
  {
    step: 3,
    title: 'HUMAN-IN-THE-LOOP TRIAGE',
    subtitle: 'Reviewer controls: Approve, Edit, or Redact credentials',
    tag: '// 03. LEAD_TRIAGE_WORKFLOW',
    color: 'cyan',
    icon: ShieldCheck,
    description:
      'Engineering leads maintain final authority. Triage claims inline, reconcile conflicts, edit statements, or toggle [REDACT] to conceal private credentials and API tokens from downstream views.',
    actionNote: 'Lead approves verified decisions with a single click. Unapproved or redacted items are strictly locked out.',
    mode: 'lead',
  },
  {
    step: 4,
    title: 'SUCCESSOR DAY-1 ONBOARDING',
    subtitle: 'Clean, distraction-free continuation checklist',
    tag: '// 04. SUCCESSOR_VIEW',
    color: 'emerald',
    icon: ListTodo,
    description:
      'Incoming engineers receive a clean, noise-free view. All unverified hypotheses, sensitive credentials, and unresolved contradictions are stripped out, leaving an actionable Day-1 continuation checklist with completion telemetry.',
    actionNote: 'Interactive checkboxes and live progress bar guide the successor from Day 1 to Day 30.',
    mode: 'successor',
  },
]

export default function JudgeTourModal({
  isOpen,
  currentStep,
  onNext,
  onPrev,
  onClose,
  onJumpToStep,
}) {
  if (!isOpen) return null

  const tour = TOUR_STEPS[currentStep] || TOUR_STEPS[0]
  const Icon = tour.icon
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl animate-fade-in font-mono pointer-events-auto">
      <div className="bg-[#050507]/95 backdrop-blur-2xl border border-cyan-400/50 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.25)] relative overflow-hidden transition-all duration-300 corner-crosshair">
        {/* Top Active Chroma Accent Bar */}
        <div
          className={`h-1 w-full absolute top-0 left-0 right-0 ${
            tour.color === 'rose'
              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-[#ff007f] shadow-[0_0_12px_#ff007f]'
              : tour.color === 'emerald'
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_#34d399]'
              : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_12px_#00f0ff]'
          }`}
        />

        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
            <span className="text-xs tracking-[0.18em] text-cyan-400 font-bold uppercase">
              {tour.tag}
            </span>
            <span className="text-neutral-600">&bull;</span>
            <span className="text-xs text-neutral-400 uppercase tracking-[0.18em] font-bold">
              STEP {currentStep + 1} OF {TOUR_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition text-xs font-mono uppercase tracking-[0.18em] flex items-center gap-1"
            title="Exit Tour"
          >
            <span className="hidden sm:inline">EXIT_TOUR</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 border ${
                tour.color === 'rose'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                  : tour.color === 'emerald'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                  : 'bg-cyan-950/40 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-heading font-bold text-white tracking-tight uppercase">
                {tour.title}
              </h4>
              <p className="font-body text-sm text-neutral-300 leading-relaxed">
                {tour.description}
              </p>
            </div>
          </div>

          {/* Action Callout */}
          <div className="p-3 rounded-xl bg-black/80 border border-white/10 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-neutral-300">{tour.actionNote}</span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          {/* Step Selector Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                type="button"
                onClick={() => onJumpToStep(idx)}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] w-8'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrev}
                className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-white/[0.05] text-neutral-300 border border-white/10 text-[11px] tracking-wider uppercase font-bold transition active:scale-95 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>PREV</span>
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={onNext}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_18px_rgba(0,240,255,0.4)] text-black font-extrabold text-[11px] tracking-wider uppercase transition active:scale-95 flex items-center gap-1.5"
              >
                <span>NEXT_STEP</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 hover:shadow-[0_0_18px_rgba(52,211,153,0.4)] text-black font-extrabold text-[11px] tracking-wider uppercase transition active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>COMPLETE_TOUR</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

