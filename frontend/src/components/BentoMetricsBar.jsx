import React from 'react'
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  EyeOff,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

/**
 * BentoMetricsBar
 * Modern 4-card Bento HUD metrics bar replacing the legacy horizontal text string.
 * Features:
 * - Total Claims, Verified & Approved, Pending Triage, Contradictions / Conflicts
 * - Soft neon glow pills, sleek dark glass cards with Active Theory borders
 * - Optional interactive filter trigger when clicked
 */
export default function BentoMetricsBar({
  stats,
  selectedCategoryFilter,
  onSelectFilter,
}) {
  if (!stats) return null

  const cards = [
    {
      id: 'all',
      title: 'TOTAL CLAIMS',
      value: stats.total,
      meta: 'RECONSTRUCTED ARTIFACTS',
      icon: Layers,
      color: 'cyan',
      borderClass: 'border-cyan-500/30 hover:border-cyan-400',
      glowClass: 'shadow-[0_0_20px_rgba(0,240,255,0.12)]',
      textClass: 'text-cyan-400',
      bgPill: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/30',
      indicatorClass: 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]',
    },
    {
      id: 'approved',
      title: 'VERIFIED & APPROVED',
      value: stats.approved,
      meta: 'HANDOVER READY',
      icon: ShieldCheck,
      color: 'emerald',
      borderClass: 'border-emerald-500/30 hover:border-emerald-400',
      glowClass: 'shadow-[0_0_20px_rgba(52,211,153,0.12)]',
      textClass: 'text-emerald-400',
      bgPill: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30',
      indicatorClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    },
    {
      id: 'pending',
      title: 'PENDING TRIAGE',
      value: stats.pending,
      meta: 'AWAITING SIGN-OFF',
      icon: AlertTriangle,
      color: 'amber',
      borderClass: 'border-amber-500/30 hover:border-amber-400',
      glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
      textClass: 'text-amber-400',
      bgPill: 'bg-amber-500/10 text-amber-300 border-amber-400/30',
      indicatorClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    },
    {
      id: 'conflicts',
      title: 'CONTRADICTIONS',
      value: stats.conflicts,
      meta: 'TIMELINE / ARCH MISMATCH',
      icon: AlertCircle,
      color: 'rose',
      borderClass: 'border-rose-500/40 hover:border-[#ff007f]',
      glowClass: 'shadow-[0_0_25px_rgba(255,0,127,0.2)] animate-rose-pulse',
      textClass: 'text-rose-400',
      bgPill: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
      indicatorClass: 'bg-[#ff007f] shadow-[0_0_10px_#ff007f] animate-pulse',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon
        const isSelected = selectedCategoryFilter === card.id

        return (
          <div
            key={card.id}
            onClick={() => onSelectFilter && onSelectFilter(card.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectFilter && onSelectFilter(card.id)
              }
            }}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-[#0c0d14]/75 backdrop-blur-xl border transition-all duration-300 cursor-pointer overflow-hidden text-left hover:scale-[1.01] ${
              card.borderClass
            } ${card.glowClass} ${
              isSelected ? 'ring-1 ring-cyan-400/60 bg-[#0e101c]/90' : ''
            }`}
          >
            {/* Ambient Corner Glow Accent */}
            <div
              className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-30 transition-opacity group-hover:opacity-60 ${
                card.color === 'rose'
                  ? 'bg-[#ff007f]'
                  : card.color === 'cyan'
                  ? 'bg-[#00f0ff]'
                  : card.color === 'emerald'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />

            {/* Top Bar: Icon & Pill Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${card.indicatorClass}`} />
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-neutral-400 group-hover:text-neutral-200 transition-colors">
                  {card.title}
                </span>
              </span>

              <div
                className={`p-1.5 rounded-lg border bg-black/40 ${card.bgPill} transition-transform group-hover:rotate-6`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Metric Value & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl sm:text-3xl font-heading font-black tracking-tight ${card.textClass} drop-shadow-sm`}
                >
                  {card.value}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                  CLAIMS
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-400 truncate">
                // {card.meta}
              </p>
            </div>

            {/* Subtle bottom active bar indicator */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300 ${
                isSelected
                  ? 'bg-cyan-400 opacity-100'
                  : 'bg-white/5 group-hover:bg-white/20'
              }`}
            />
          </div>
        )
      })}
    </div>
  )
}

