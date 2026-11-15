import React, { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Search,
  UploadCloud,
  Zap,
  Download,
  FileText,
  Code2,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Server,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react'

/**
 * Header Component
 * Top enterprise application header providing breadcrumbs, global search,
 * backend API health status, and quick primary actions.
 */
export default function Header({
  project,
  activeTab,
  healthStatus,
  currentUser,
  onOpenIngest,
  onStartTour,
  onExportMarkdown,
  onExportJson,
  onRetryBackend,
  isConnectingBackend,
  searchQuery,
  setSearchQuery,
  setMobileOpen,
}) {
  const [isExportOpen, setIsExportOpen] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'command_center':
        return 'Command Center'
      case 'documents':
        return 'Documents & Ingestion'
      case 'evidence':
        return 'Evidence Explorer'
      case 'conflicts':
        return 'Conflict Lab'
      case 'review':
        return 'Review & Approvals'
      case 'security':
        return 'Trust & Security'
      case 'successor':
        return 'Successor Workspace'
      case 'audit':
        return 'Audit History'
      default:
        return 'Workspace'
    }
  }

  const tabTitle = getTabTitle(activeTab)

  return (
    <header className="h-14 border-b border-[#1e293b] bg-[#090d16] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Open Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-slate-400 min-w-0 truncate">
          <span className="text-slate-300 font-semibold hidden sm:inline">CodeFrontier</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
          <span className="text-slate-300 truncate max-w-[140px] sm:max-w-[200px]" title={project?.project_name}>
            {project?.project_name || 'Project'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-cyan-400 font-bold truncate">
            {tabTitle}
          </span>
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Search claims, excerpts, files, or citations..."
            className="w-full pl-9 pr-3 py-1 rounded-lg bg-[#0c101c] border border-[#1e293b] focus:border-cyan-500/50 focus:outline-none text-xs text-white placeholder:text-slate-400 font-mono transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-white"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Right: Telemetry & Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Backend Status Pill */}
        <button
          type="button"
          onClick={onRetryBackend}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0c101c] border border-[#1e293b] hover:border-slate-700 text-xs font-mono transition text-slate-300"
          title={`Backend API: ${healthStatus} (Click to refresh status)`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              healthStatus === 'Online'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse'
                : healthStatus === 'Checking...'
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-400'
            }`}
          />
          <span className="hidden sm:inline text-[11px]">
            {healthStatus === 'Online' ? 'API: Online' : healthStatus === 'Checking...' ? 'Connecting...' : 'API: Standalone'}
          </span>
          {isConnectingBackend && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
        </button>

        {/* 60s Judge Tour Button */}
        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs tracking-wider uppercase transition shadow-sm active:scale-95"
            title="Launch 60-Second Guided Judge Tour"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">60s Tour</span>
          </button>
        )}

        {/* Quick Ingest Button */}
        {onOpenIngest && (
          <button
            type="button"
            onClick={onOpenIngest}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c101c] border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 font-mono text-xs font-semibold tracking-wider transition active:scale-95"
            title="Upload or paste documents"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ingest</span>
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            type="button"
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c101c] border border-[#1e293b] hover:border-slate-700 text-xs font-mono text-slate-300 transition"
            title="Export Handover Package"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-[#111728] border border-[#1e293b] rounded-xl shadow-2xl p-1.5 space-y-1 font-mono text-xs">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Export Verified Packages
              </div>
              <button
                type="button"
                onClick={() => {
                  onExportMarkdown()
                  setIsExportOpen(false)
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Handover Brief (.md)</div>
                  <div className="text-[10px] text-slate-400">Sanitized Markdown summary</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportJson()
                  setIsExportOpen(false)
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition flex items-center gap-2"
              >
                <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Audit Trail (.json)</div>
                  <div className="text-[10px] text-slate-400">Machine-readable with hashes</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
