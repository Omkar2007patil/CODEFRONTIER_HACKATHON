import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Database,
  ShieldCheck,
  User,
  Clock,
  Code2,
  X,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react'

/**
 * AuditHistory Component
 * Full-width tamper-evident SQLite audit explorer:
 * - Live stream from GET /api/projects/{id}/audit-logs
 * - Multi-criteria filters by action type and actor
 * - JSON payload inspection drawer/modal
 */
export default function AuditHistory({
  project,
  activeApiBase,
  authToken,
  currentUser,
}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchAuditLogs = async () => {
    if (!activeApiBase || !project?.project_id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${activeApiBase}/projects/${project.project_id}/audit-logs`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || `HTTP ${res.status}: Failed to load audit history.`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [project?.project_id, activeApiBase, authToken])

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      const matchAction = log.action?.toLowerCase().includes(q)
      const matchActor = log.user_email?.toLowerCase().includes(q)
      const matchEntity = log.entity_type?.toLowerCase().includes(q) || log.entity_id?.toLowerCase().includes(q)
      if (!matchAction && !matchActor && !matchEntity) return false
    }
    return true
  })

  const getActionBadge = (action) => {
    switch (action) {
      case 'toggle_approval':
        return { label: 'TOGGLE APPROVAL', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
      case 'approve_all_claims':
        return { label: 'BATCH APPROVE', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' }
      case 'toggle_sensitive':
        return { label: 'TOGGLE SENSITIVE', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
      case 'resolve_conflict':
        return { label: 'RESOLVE CONFLICT', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
      case 'update_task':
        return { label: 'CHECKLIST UPDATE', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
      case 'upload_documents':
        return { label: 'DOCUMENT INGESTION', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' }
      case 'approve_handover':
        return { label: 'LOCK HANDOVER', color: 'bg-rose-500/15 text-rose-300 border-rose-500/40' }
      default:
        return { label: action?.replace(/_/g, ' ').toUpperCase(), color: 'bg-slate-800 text-slate-300 border-slate-700' }
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              // IMMUTABLE RELATIONAL AUDIT LOG & COMPLIANCE STREAM
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Audit History
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Tamper-evident operational audit trail persisted in SQLite with Write-Ahead Logging (WAL). Every claim approval,
            secret redaction, conflict reconciliation decision, and checklist update records actor identity and UTC timestamp.
          </p>
        </div>

        {/* Telemetry & Refresh */}
        <div className="flex items-center gap-2.5 font-mono text-xs shrink-0">
          <div className="px-3.5 py-2 rounded-lg bg-[#111728] border border-[#1e293b]">
            <span className="text-slate-400 block text-[10px] uppercase">Recorded Events</span>
            <span className="text-cyan-400 font-bold text-base">{logs.length}</span>
          </div>

          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="p-2.5 rounded-lg bg-[#111728] border border-[#1e293b] hover:border-slate-700 text-slate-300 transition"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by actor, action, or entity ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111728] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-xs">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'resolve_conflict', label: 'Conflicts' },
            { id: 'toggle_approval', label: 'Approvals' },
            { id: 'toggle_sensitive', label: 'Redactions' },
            { id: 'update_task', label: 'Checklist' },
            { id: 'upload_documents', label: 'Uploads' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActionFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 uppercase ${
                actionFilter === tab.id
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#111728] border border-[#1e293b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Audit Log Stream Table */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
            <p>Querying SQLite audit database...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1e293b] text-slate-400 text-[10px] uppercase">
                  <th className="py-2.5 pr-4">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Actor Identity</th>
                  <th className="py-2.5 px-3">Action Performed</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 pl-4 text-right">Details & Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action)
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/20 transition">
                      <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-cyan-400" />
                          <span className="text-white font-medium">{log.user_email || 'system'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">{log.user_role || 'evaluator'}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        <span className="text-slate-400">{log.entity_type}:</span> {log.entity_id}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2 py-1 rounded bg-[#111728] border border-[#1e293b] hover:border-cyan-500/40 text-cyan-300 text-[10px] font-semibold transition"
                        >
                          Inspect JSON &rarr;
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. JSON Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="w-full max-w-2xl bg-[#0c101c] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#111728]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase">
                  Audit Record #{selectedLog.id} Payload
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Action:</span>
                  <span className="font-bold text-white">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Actor:</span>
                  <span className="font-bold text-cyan-400">{selectedLog.user_email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Timestamp:</span>
                  <span>{selectedLog.created_at}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Target Entity:</span>
                  <span>{selectedLog.entity_type} ({selectedLog.entity_id})</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase mb-1">Details JSON Payload:</span>
                <pre className="p-3.5 rounded-xl bg-black/80 border border-white/5 text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-[#1e293b] bg-[#111728] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
