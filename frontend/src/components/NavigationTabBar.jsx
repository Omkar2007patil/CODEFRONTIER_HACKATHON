import React from 'react'
import {
  LayoutDashboard,
  Search,
  AlertCircle,
  UploadCloud,
  ShieldCheck,
  CheckSquare,
  Sparkles,
} from 'lucide-react'

/**
 * NavigationTabBar
 * Developer-tool navigation bar allowing instant 1-click access across all 6 core screens.
 */
export default function NavigationTabBar({
  activeTab,
  setActiveTab,
  stats,
  unresolvedConflictCount = 0,
  onStartTour,
  currentUserRole = 'project_reviewer',
}) {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'evidence',
      label: 'Evidence Explorer',
      icon: Search,
      badge: stats?.total ? `${stats.total}` : null,
      badgeColor: 'text-neutral-400 bg-white/[0.06]',
    },
    {
      id: 'conflicts',
      label: 'Contradictions',
      icon: AlertCircle,
      badge: unresolvedConflictCount > 0 ? `${unresolvedConflictCount}` : (stats?.conflicts ? `${stats.conflicts}` : null),
      badgeColor: unresolvedConflictCount > 0
        ? 'text-rose-300 bg-rose-500/20 border border-rose-500/40 animate-pulse'
        : 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40',
    },
    {
      id: 'ingest',
      label: 'Ingest Documents',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Reviewer & Audit',
      icon: ShieldCheck,
      badge: stats?.pending ? `${stats.pending} pending` : null,
      badgeColor: 'text-amber-300 bg-amber-500/20 border border-amber-500/30',
    },
    {
      id: 'successor',
      label: 'Successor Pack',
      icon: CheckSquare,
      badge: stats?.approved ? `${stats.approved} ready` : null,
      badgeColor: 'text-cyan-300 bg-cyan-500/20 border border-cyan-500/30',
    },
  ]

  return (
    <div className="w-full border-b border-white/[0.08] bg-[#07080e]/90 backdrop-blur-md sticky top-[61px] z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Screen Switcher Tabs */}
        <nav className="flex items-center gap-1.5 shrink-0" aria-label="Main Navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs tracking-wider transition-all duration-150 select-none ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono leading-none ${tab.badgeColor || 'bg-white/10 text-neutral-300'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* 60-Second Quick Judge Tour Action */}
        <div className="shrink-0 flex items-center gap-2 pl-3">
          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 text-cyan-300 font-mono text-xs tracking-wider font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)] transition active:scale-95"
              title="Start 60-Second Guided Judge Demo Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">// 60s JUDGE TOUR</span>
              <span className="sm:hidden">TOUR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
