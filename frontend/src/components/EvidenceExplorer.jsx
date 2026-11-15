import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  MapPin,
  Check,
  X,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  CheckCheck,
} from 'lucide-react'
import SourceViewer from './SourceViewer'

/**
 * EvidenceExplorer Component
 * Master-Detail Claims & Provenance Studio:
 * - Left column: Filterable and searchable claims list
 * - Right column: Selected claim deep-dive, epistemic truth notice, exact provenance,
 *   embedded IDE source viewer with line-level anchor highlights, and reviewer actions.
 */
export default function EvidenceExplorer({
  project,
  claims = [],
  rawSources = [],
  onToggleApprove,
  onToggleSensitive,
  onUpdateStatement,
  onApproveAll,
  onInspectEvidence,
  onNavigateTab,
  isReviewer = true,
  searchQuery = '',
  setSearchQuery,
}) {
  const [selectedClaimId, setSelectedClaimId] = useState(claims.length > 0 ? claims[0].id : null)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'supported' | 'needs_human_review' | 'missing_evidence' | 'unsupported' | 'conflicts'
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all') // 'all' | 'approved' | 'pending' | 'sensitive'

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState('')

  // Resolve active selected claim
  const activeClaim = claims.find((c) => c.id === selectedClaimId) || claims[0] || null

  // Filter claims
  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesStatement = c.statement?.toLowerCase().includes(q)
        const matchesExcerpt = c.exact_source_excerpt?.toLowerCase().includes(q)
        const matchesSnippet = c.evidence?.snippet?.toLowerCase().includes(q)
        const matchesFilename = (c.source_filename || c.evidence?.source_name)?.toLowerCase().includes(q)
        if (!matchesStatement && !matchesExcerpt && !matchesSnippet && !matchesFilename) return false
      }

      // 2. Evidence Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'conflicts') {
          if (c.status !== 'conflicting') return false
        } else if (c.validation_status !== statusFilter) {
          return false
        }
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false
      }

      // 4. Approval Filter
      if (approvalFilter === 'approved' && !c.is_approved) return false
      if (approvalFilter === 'pending' && c.is_approved) return false
      if (approvalFilter === 'sensitive' && !c.is_sensitive) return false

      return true
    })
  }, [claims, searchQuery, statusFilter, categoryFilter, approvalFilter])

  // Find source index for SourceViewer based on active claim
  const activeSourceInfo = useMemo(() => {
    if (!activeClaim) return { index: 0, snippet: null, sourceName: null }
    const sourceName = activeClaim.source_filename || activeClaim.evidence?.source_name || ''
    const snippet = activeClaim.exact_source_excerpt || activeClaim.evidence?.snippet || ''

    const idx = rawSources.findIndex(
      (s) =>
        s.filename === sourceName ||
        s.filename.includes(sourceName) ||
        (sourceName && sourceName.includes(s.filename))
    )

    return {
      index: idx !== -1 ? idx : 0,
      snippet,
      sourceName,
    }
  }, [activeClaim, rawSources])

  const [activeSourceIndex, setActiveSourceIndex] = useState(0)

  const handleSelectClaim = (claim) => {
    setSelectedClaimId(claim.id)
    setIsEditing(false)
    setEditDraft(claim.statement)

    const sourceName = claim.source_filename || claim.evidence?.source_name || ''
    const idx = rawSources.findIndex(
      (s) =>
        s.filename === sourceName ||
        s.filename.includes(sourceName) ||
        (sourceName && sourceName.includes(s.filename))
    )
    if (idx !== -1) {
      setActiveSourceIndex(idx)
    }
  }

  const handleSaveEdit = () => {
    if (activeClaim && editDraft.trim() && onUpdateStatement) {
      onUpdateStatement(activeClaim.id, editDraft.trim())
      setIsEditing(false)
    }
  }

  const getValidationBadge = (claim) => {
    const vStatus = claim.validation_status || 'supported'
    const confPct = Math.round((claim.confidence ?? 1.0) * 100)

    switch (vStatus) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-300 border border-emerald-500/30 bg-emerald-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>SUPPORTED ({confPct}%)</span>
          </span>
        )
      case 'needs_human_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300 border border-amber-500/30 bg-amber-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>NEEDS REVIEW ({confPct}%)</span>
          </span>
        )
      case 'missing_evidence':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase text-rose-300 border border-rose-500/30 bg-rose-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>MISSING CITATION</span>
          </span>
        )
      case 'unsupported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase text-rose-400 border border-rose-500/40 bg-rose-950/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>UNSUPPORTED</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase text-slate-400 border border-slate-700 bg-slate-900">
            <span>{vStatus}</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header Banner & Batch Actions */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              // RECONSTRUCTED CLAIM PROVENANCE & LINE CITATION LEDGER
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Evidence Explorer
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Inspect individual factual assertions extracted from project documentation. Every claim anchors to an
            exact source excerpt and line number range for human reviewer verification.
          </p>
        </div>

        {/* Batch Approve Control */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onApproveAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider transition active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Batch Approve Verified</span>
          </button>
        </div>
      </div>

      {/* 2. Master-Detail Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: CLAIMS MASTER LIST (5 Cols) ================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Multi-Filter Bar */}
          <div className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                placeholder="Search claims, excerpts, or files..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111728] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery && setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-xs">
              {[
                { id: 'all', label: `ALL (${claims.length})` },
                { id: 'supported', label: 'SUPPORTED' },
                { id: 'needs_human_review', label: 'NEEDS REVIEW' },
                { id: 'conflicts', label: 'CONFLICTS' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 uppercase ${
                    statusFilter === tab.id
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Secondary Filters: Category & Approval */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1e293b] font-mono text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#111728] border border-[#1e293b] rounded-lg px-2 py-1 text-slate-300 text-[11px] outline-none"
              >
                <option value="all">All Categories</option>
                <option value="decision">Decisions</option>
                <option value="blocker">Blockers & Risks</option>
                <option value="project_dates_milestones">Milestones</option>
                <option value="technical_configuration">Configurations</option>
              </select>

              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="bg-[#111728] border border-[#1e293b] rounded-lg px-2 py-1 text-slate-300 text-[11px] outline-none"
              >
                <option value="all">All Review States</option>
                <option value="approved">Approved Only</option>
                <option value="pending">Pending Only</option>
                <option value="sensitive">Redacted Only</option>
              </select>
            </div>
          </div>

          {/* Claims Stream List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredClaims.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-mono text-xs rounded-xl bg-[#0c101c] border border-[#1e293b]">
                No claims match current filter criteria.
              </div>
            ) : (
              filteredClaims.map((claim) => {
                const isSelected = activeClaim?.id === claim.id
                const isConflicting = claim.status === 'conflicting'

                return (
                  <div
                    key={claim.id}
                    onClick={() => handleSelectClaim(claim)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 group ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                        : isConflicting
                        ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                        : 'bg-[#0c101c] border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getValidationBadge(claim)}
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {claim.category?.replace(/_/g, ' ')}
                        </span>
                        {isConflicting && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase animate-pulse">
                            CONFLICT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {claim.is_approved ? (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Approved</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-400">Pending</span>
                        )}
                        {claim.is_sensitive && (
                          <span className="text-[10px] font-mono text-purple-400 flex items-center gap-0.5">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Claim Statement */}
                    <p className="text-xs font-medium text-white leading-relaxed line-clamp-2">
                      {claim.statement}
                    </p>

                    {/* Citation Provenance Footer */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                      <span className="truncate max-w-[200px]">
                        {claim.source_filename || claim.evidence?.source_name || 'Document'}
                      </span>
                      <span>{claim.source_location || claim.evidence?.line_or_section || 'Provenance'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: CLAIM DETAIL & SOURCE VIEWER (7 Cols) ================= */}
        <div className="lg:col-span-7 space-y-4">
          {activeClaim ? (
            <>
              {/* Claim Deep-Dive Card */}
              <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
                {/* Top Badge Cluster & Review Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                      CLAIM #{activeClaim.id}
                    </span>
                    <span className="text-slate-600">&bull;</span>
                    {getValidationBadge(activeClaim)}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {activeClaim.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      v{activeClaim.version || 1}
                    </span>
                  </div>

                  {/* Reviewer Action Buttons */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => onToggleApprove && onToggleApprove(activeClaim.id)}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 uppercase ${
                        activeClaim.is_approved
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{activeClaim.is_approved ? 'Approved' : 'Approve'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleSensitive && onToggleSensitive(activeClaim.id)}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 uppercase ${
                        activeClaim.is_sensitive
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                      title={activeClaim.is_sensitive ? 'Secret masked from successor' : 'Mark as sensitive credential'}
                    >
                      {activeClaim.is_sensitive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{activeClaim.is_sensitive ? 'Redacted' : 'Redact'}</span>
                    </button>

                    {activeClaim.status === 'conflicting' && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('conflicts')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1.5 uppercase"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Conflict Lab</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Epistemic Truth Disclaimer */}
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-300">Epistemic Notice:</strong> A statement appearing in an ingested
                    document is evidence that the source asserts that statement, not necessarily proof that the statement is
                    objectively true. Lead reviewers must certify operational validity.
                  </p>
                </div>

                {/* Factual Statement Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      Extracted Claim Statement
                    </span>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(true)
                          setEditDraft(activeClaim.statement)
                        }}
                        className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Statement</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="text-[10px] font-mono text-emerald-400 hover:underline font-bold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="text-[10px] font-mono text-slate-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="text-sm font-semibold text-white leading-relaxed p-3 rounded-lg bg-[#111728] border border-[#1e293b]">
                      "{activeClaim.statement}"
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#111728] border border-cyan-500/50 text-white font-mono text-xs focus:outline-none"
                    />
                  )}
                </div>

                {/* Exact Supporting Excerpt & Provenance Box */}
                <div className="p-4 rounded-lg bg-[#111728] border border-[#1e293b] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Exact Provenance Citation</span>
                    </span>
                    <span>
                      {activeClaim.source_filename || activeClaim.evidence?.source_name || 'Document'} &bull;{' '}
                      {activeClaim.source_location || activeClaim.evidence?.line_or_section || 'Section'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-black/40 border border-white/5 text-slate-200 italic font-body text-xs leading-relaxed">
                    &ldquo;{activeClaim.exact_source_excerpt || activeClaim.evidence?.snippet || 'No excerpt available'}&rdquo;
                  </div>

                  {activeClaim.explanation && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      <span className="text-slate-300 font-semibold">Validator Explanation: </span>
                      {activeClaim.explanation}
                    </div>
                  )}
                </div>
              </div>

              {/* Embedded IDE Source Viewer Anchor */}
              <div className="h-[460px] rounded-xl overflow-hidden border border-[#1e293b]">
                <SourceViewer
                  rawSources={rawSources}
                  activeSourceIndex={activeSourceIndex}
                  setActiveSourceIndex={setActiveSourceIndex}
                  highlightedSnippet={activeSourceInfo.snippet}
                  highlightedSource={activeSourceInfo.sourceName}
                  onClearHighlight={() => {}}
                />
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 font-mono text-xs rounded-xl bg-[#0c101c] border border-[#1e293b]">
              Select a claim on the left to inspect evidence provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
