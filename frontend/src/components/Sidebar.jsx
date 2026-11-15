import React, { useState } from 'react'
import {
  LayoutDashboard,
  Files,
  Search,
  AlertCircle,
  ShieldCheck,
  Lock,
  GraduationCap,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Database,
  Building2,
  Sparkles,
} from 'lucide-react'

/**
 * Sidebar Component
 * Enterprise dark collapsible left navigation sidebar for CodeFrontier.
 * Provides instant access across all 8 core workflows, project switcher,
 * and current user RBAC identity.
 */
export default function Sidebar({
  activeTab,
  setActiveTab,
  project,
  stats,
  unresolvedConflictCount = 0,
  currentUser,
  onSwitchUserRole,
  onSelectPreset,
  onStartTour,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false)
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false)

  const navItems = [
    {
      id: 'command_center',
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
      description: 'Handover readiness and executive telemetry',
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: Files,
      badge: project?.raw_sources?.length ? `${project.raw_sources.length}` : null,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      description: 'Multi-format ingestion & artifact manifest',
    },
    {
      id: 'evidence',
      label: 'Evidence Explorer',
      icon: Search,
      badge: stats?.total ? `${stats.total}` : null,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      description: 'Master-detail claims & line-level citations',
    },
    {
      id: 'conflicts',
      label: 'Conflict Lab',
      icon: AlertCircle,
      badge: unresolvedConflictCount > 0 ? `${unresolvedConflictCount}` : (stats?.conflicts ? `${stats.conflicts}` : null),
      badgeColor: unresolvedConflictCount > 0
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Cross-document contradiction reconciliation',
    },
    {
      id: 'review',
      label: 'Review & Approvals',
      icon: ShieldCheck,
      badge: stats?.pending ? `${stats.pending} pending` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Reviewer certification & handover locking',
    },
    {
      id: 'security',
      label: 'Trust & Security',
      icon: Lock,
      badge: stats?.sensitive ? `${stats.sensitive} redacted` : null,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'RBAC verification & secret masking',
    },
    {
      id: 'successor',
      label: 'Successor Workspace',
      icon: GraduationCap,
      badge: stats?.approved ? `${stats.approved} ready` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Sanitized briefing & persistent Day 1 checklist',
    },
    {
      id: 'audit',
      label: 'Audit History',
      icon: History,
      badge: null,
      description: 'Tamper-evident SQLite audit logs',
    },
  ]

  const userRole = currentUser?.role || 'project_reviewer'
  const isReviewer = userRole === 'project_reviewer'
  const isSuccessor = userRole === 'incoming_successor'

  const getRoleBadge = (role) => {
    switch (role) {
      case 'project_reviewer':
        return { label: 'REVIEWER', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
      case 'incoming_successor':
        return { label: 'SUCCESSOR', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
      case 'outgoing_member':
        return { label: 'OUTGOING', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
      default:
        return { label: 'EVALUATOR', color: 'bg-slate-800 text-slate-300 border-slate-700' }
    }
  }

  const roleBadge = getRoleBadge(userRole)

  const handleNavClick = (tabId) => {
    setActiveTab(tabId)
    if (setMobileOpen) setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#090d16] border-r border-[#1e293b] text-slate-200 select-none">
      {/* 1. Brand Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-heading font-black text-sm shrink-0 shadow-sm">
            CF
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-sm tracking-tight text-white uppercase">
                  CodeFrontier
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                  R3
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider truncate">
                Knowledge Handover Platform
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Active Project Context Switcher */}
      {!isCollapsed ? (
        <div className="p-3 border-b border-[#1e293b] bg-[#0c111e]">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#111728] border border-[#1e293b] hover:border-slate-700 text-left transition group"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>ACTIVE PROJECT</span>
                </div>
                <div className="text-xs font-semibold text-white truncate mt-0.5">
                  {project?.project_name || 'Apex Core Enterprise Gateway'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {project?.project_id || 'apex-core-2026'} &bull; SQLite WAL
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0 transition" />
            </button>

            {/* Project Switcher Dropdown */}
            {isProjectMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#111728] border border-[#1e293b] rounded-xl shadow-2xl p-1.5 space-y-1 font-mono text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Judge Demo Scenario
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset('apex-core-2026')
                    setIsProjectMenuOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition flex items-center justify-between ${
                    project?.project_id === 'apex-core-2026'
                      ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">Preset 1: Gateway (Conflict)</div>
                    <div className="text-[10px] text-rose-400">Timeline Contradiction Active</div>
                  </div>
                  {project?.project_id === 'apex-core-2026' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset('apex-auth-clean')
                    setIsProjectMenuOpen(false)
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition flex items-center justify-between ${
                    project?.project_id === 'apex-auth-clean'
                      ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">Preset 2: Auth (Clean)</div>
                    <div className="text-[10px] text-emerald-400">Zero Contradictions Verified</div>
                  </div>
                  {project?.project_id === 'apex-auth-clean' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-[#1e293b] flex justify-center">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="w-9 h-9 rounded-lg bg-[#111728] border border-[#1e293b] flex items-center justify-center text-cyan-400 hover:border-cyan-500/40 transition"
            title="Expand to switch project scenario"
          >
            <Building2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Navigation List (8 Sections) */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 no-scrollbar" aria-label="Main Navigation">
        {!isCollapsed && (
          <div className="px-2.5 pb-1 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
            Platform Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
              title={isCollapsed ? `${item.label} — ${item.description}` : item.description}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none border shrink-0 ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed Badge Dot */}
              {isCollapsed && item.badge && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#090d16]"
                  title={item.badge}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* 4. Quick 60s Judge Tour Banner */}
      {!isCollapsed && onStartTour && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onStartTour}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white transition group active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="text-left font-mono">
                <div className="text-xs font-bold uppercase tracking-wider">60s Judge Tour</div>
                <div className="text-[10px] text-slate-400">Automated evaluation flow</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
          </button>
        </div>
      )}

      {/* 5. Evaluator User & Verified RBAC Identity */}
      <div className="p-3 border-t border-[#1e293b] bg-[#0c111e]">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition group text-left"
            title="Switch Evaluator RBAC Role"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'J'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {currentUser?.full_name || 'Jordan Lee'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${roleBadge.color}`}
                    >
                      {roleBadge.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {currentUser?.email || 'reviewer@apex.dev'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
            )}
          </button>

          {/* Role Switcher Popover */}
          {isRoleMenuOpen && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 bg-[#111728] border border-[#1e293b] rounded-xl shadow-2xl p-1.5 space-y-1 font-mono text-xs">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Role (Backend Authenticated)
              </div>
              <button
                type="button"
                onClick={() => {
                  onSwitchUserRole('project_reviewer')
                  setIsRoleMenuOpen(false)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                  userRole === 'project_reviewer'
                    ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">Reviewer (Jordan Lee)</div>
                  <div className="text-[10px] text-slate-400">Full Triage, Approvals & Redactions</div>
                </div>
                {userRole === 'project_reviewer' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSwitchUserRole('incoming_successor')
                  setIsRoleMenuOpen(false)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                  userRole === 'incoming_successor'
                    ? 'bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">Successor (Taylor Morgan)</div>
                  <div className="text-[10px] text-slate-400">Sanitized Briefing & Day 1 Checklist</div>
                </div>
                {userRole === 'incoming_successor' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSwitchUserRole('outgoing_member')
                  setIsRoleMenuOpen(false)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                  userRole === 'outgoing_member'
                    ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">Outgoing (Alex Chen)</div>
                  <div className="text-[10px] text-slate-400">Document Upload & Draft Authoring</div>
                </div>
                {userRole === 'outgoing_member' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
