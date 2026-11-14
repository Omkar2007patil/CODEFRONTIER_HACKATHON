import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  RefreshCw,
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Database,
  ArrowRight,
} from 'lucide-react'

/**
 * ReviewerAuditWorkspace
 * Reviewer Command Center for claim triage, sensitive redaction toggles,
 * handover locking, and real-time inspection of tamper-evident SQLite audit logs.
 */
export default function ReviewerAuditWorkspace({
  project,
  claims = [],
  onToggleApprove,
  onToggleSensitive,
  onUpdateStatement,
  onApproveAll,
  onLockHandover,
  currentUser,
  activeApiBase,
  authToken,
}) {
  const [auditLogs, setAuditLogs] = useState([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logFilter, setLogFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)

  const isReviewer = currentUser?.role === 'project_reviewer'
  const unresolvedConflicts = (project?.conflicts || []).filter((c) => c.status === 'unresolved')

  // Fetch live audit logs from backend SQLite database
  const fetchAuditLogs = async () => {
    if (!activeApiBase || !project?.project_id) return
    setIsLoadingLogs(true)
    try {
      const res = await fetch(`${activeApiBase}/projects/${project.project_id}/audit-logs`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data)
      }
    } catch (err) {
      // Handled
    } finally {
      setIsLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [project?.project_id, activeApiBase, authToken])

  const filteredLogs = auditLogs.filter(
    (l) =>
      !logFilter ||
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(logFilter.toLowerCase())
  )

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* 1. Header Banner & Reviewer Authorization Status */}
      <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
              // REVIEWER TRIAGE & AUDIT LOG STREAM
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Reviewer Controls & Tamper-Evident Audit
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Review and certify project artifacts before handover. Authorized reviewers toggle approval, redact confidential credentials from successor packages, and review immutable audit trails.
          </p>
        </div>

        {/* Global Reviewer Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap font-mono text-xs">
          <button
            type="button"
            onClick={onApproveAll}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-bold uppercase tracking-wider transition active:scale-95"
          >
            [ Batch Approve All ]
          </button>

          <button
            type="button"
            onClick={onLockHandover}
            className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition flex items-center gap-2 active:scale-95 ${
              unresolvedConflicts.length > 0
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_15px_rgba(0,240,255,0.3)]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Handover</span>
          </button>
        </div>
      </div>

      {/* 2. Split Workspace: Triage Ledger (Left 3/5) & Live SQLite Audit Log (Right 2/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Triage Claims Ledger (3 cols) */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                CLAIM TRIAGE & REDACTION LEDGER ({claims.length})
              </h3>
              <span className="text-[10px] text-neutral-400">Toggle approval and server-side secret masking per claim</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300">
              {claims.filter((c) => c.is_approved).length}/{claims.length} Approved
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {claims.map((claim) => {
              const isSensitive = claim.is_sensitive
              const isApproved = claim.is_approved

              return (
                <div
                  key={claim.id}
                  className={`p-4 rounded-xl border transition-all text-xs font-mono space-y-2.5 ${
                    isApproved
                      ? 'bg-white/[0.02] border-white/[0.08]'
                      : 'bg-amber-950/20 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">
                          {claim.id}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[10px] uppercase bg-white/[0.04] text-neutral-300 border border-white/[0.06]">
                          {claim.category?.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {claim.source_filename}
                        </span>
                      </div>

                      <p className="text-white font-sans text-xs font-semibold leading-relaxed">
                        {claim.statement}
                      </p>
                    </div>

                    {/* Action Toggles */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Redaction Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleSensitive(claim.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          isSensitive
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white'
                        }`}
                        title={isSensitive ? 'Masked from Successor' : 'Visible (Click to Redact)'}
                      >
                        {isSensitive ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Approval Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleApprove(claim.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase transition flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>APPROVED</span>
                          </>
                        ) : (
                          <span>PENDING</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {claim.exact_source_excerpt && (
                    <div className="text-[10px] text-neutral-400 italic bg-black/40 p-2 rounded border border-white/[0.04]">
                      &ldquo;{claim.exact_source_excerpt}&rdquo;
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Live Tamper-Evident SQLite Audit Stream (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  SQLITE AUDIT STREAM ({auditLogs.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={isLoadingLogs}
                className="p-1 rounded-lg text-neutral-400 hover:text-cyan-300 bg-white/[0.04] border border-white/10"
                title="Refresh live audit logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Filter by action or actor..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Audit Log Stream Entries */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 uppercase text-xs">
                  No audit events matching query
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] hover:border-white/15 cursor-pointer space-y-1 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-400/30">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'now'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-300 text-[10px] pt-1">
                      <span className="truncate max-w-[150px]">{log.user_email || 'System'}</span>
                      <span className="text-neutral-500 uppercase">{log.user_role || 'reviewer'}</span>
                    </div>

                    {selectedLog?.id === log.id && (
                      <div className="mt-2 p-2 rounded bg-black/80 border border-white/10 text-[9px] text-neutral-400 overflow-x-auto">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] text-[10px] font-mono text-neutral-500 flex items-center justify-between">
            <span>Storage: SQLite WAL</span>
            <span className="text-emerald-400">Zero Secret Plaintext Leaks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
