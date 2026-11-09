import React, { useEffect, useState, useMemo } from 'react'
import Header from './components/Header'
import SourceViewer from './components/SourceViewer'
import ClaimCard from './components/ClaimCard'
import SuccessorView from './components/SuccessorView'
import FinalizeModal from './components/FinalizeModal'
import TeamPortfolio from './components/TeamPortfolio'
import LandingHero from './components/LandingHero'
import CustomIngestModal from './components/CustomIngestModal'
import JudgeTourModal from './components/JudgeTourModal'
import {
  generateHandoverMarkdown,
  generateHandoverAuditJson,
  downloadMarkdownFile,
  downloadJsonFile,
} from './utils/exportMarkdown'
import {
  ShieldCheck,
  UserCheck,
  Filter,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  EyeOff,
  Sparkles,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react'

const BACKEND_CANDIDATES = [
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api',
  '/api',
]

export default function App() {
  const [project, setProject] = useState(null)
  const [healthStatus, setHealthStatus] = useState('Checking...')
  const [activeApiBase, setActiveApiBase] = useState('http://localhost:8000/api')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Top-level screen state: 'landing' (showcase) | 'studio' (workspace)
  const [viewMode, setViewMode] = useState('landing')

  // Dual-role view mode inside studio: 'lead' | 'successor'
  const [role, setRole] = useState('lead')

  // Left panel state
  const [activeSourceIndex, setActiveSourceIndex] = useState(0)
  const [highlightedSnippet, setHighlightedSnippet] = useState(null)
  const [highlightedSource, setHighlightedSource] = useState(null)

  // Filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  // Modals
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false)

  // 60-Second Judge Tour State
  const [isTourActive, setIsTourActive] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  // Toast feedback
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Tour Step Controller
  const applyTourStepActions = (stepIndex) => {
    if (stepIndex === 0) {
      setRole('lead')
      if (project?.claims?.[0]?.evidence) {
        handleInspectEvidence(project.claims[0].evidence)
      }
      showToast('// TOUR: STEP 1 - EVIDENCE CITATION ANCHORED')
    } else if (stepIndex === 1) {
      setRole('lead')
      const conflictClaim = project?.claims?.find((c) => c.status === 'conflicting')
      if (conflictClaim?.evidence) {
        handleInspectEvidence(conflictClaim.evidence)
      }
      showToast('// TOUR: STEP 2 - TIMELINE CONTRADICTION DETECTED')
    } else if (stepIndex === 2) {
      setRole('lead')
      setHighlightedSnippet(null)
      setHighlightedSource(null)
      showToast('// TOUR: STEP 3 - REVIEWER TRIAGE WORKFLOW')
    } else if (stepIndex === 3) {
      setRole('successor')
      showToast('// TOUR: STEP 4 - SUCCESSOR DAY-1 ONBOARDING')
    }
  }

  const handleStartTour = () => {
    setViewMode('studio')
    setIsTourActive(true)
    setTourStep(0)
    applyTourStepActions(0)
  }

  const handleNextTourStep = () => {
    const next = tourStep + 1
    if (next < 4) {
      setTourStep(next)
      applyTourStepActions(next)
    } else {
      setIsTourActive(false)
      showToast('// JUDGE_TOUR_COMPLETE: APEX PLATFORM AUDITED')
    }
  }

  const handlePrevTourStep = () => {
    const prev = Math.max(0, tourStep - 1)
    setTourStep(prev)
    applyTourStepActions(prev)
  }

  const handleJumpToTourStep = (idx) => {
    setTourStep(idx)
    applyTourStepActions(idx)
  }

  // Top-level screen handlers
  const handleLaunchDemo = async () => {
    setViewMode('studio')
    if (!project) {
      await fetchProjectData(activeApiBase)
    }
    showToast('// STUDIO_ENGAGED: DEMO DATASET READY')
  }

  const handleCustomInput = () => {
    setViewMode('studio')
    setIsIngestModalOpen(true)
  }

  const handleBackToLanding = () => {
    setViewMode('landing')
  }

  // Custom Multi-Source Ingestion via backend /api/ingest
  const handleIngestCustomText = async (payload) => {
    try {
      setLoading(true)
      const res = await fetch(`${activeApiBase}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProject(data)
      setIsIngestModalOpen(false)
      setActiveSourceIndex(0)
      setHighlightedSnippet(null)
      setHighlightedSource(null)
      showToast('// DYNAMIC_INGESTION_COMPLETE: CLAIMS_&_CITATIONS_RECONSTRUCTED')
    } catch (err) {
      showToast(`// INGESTION_ERROR: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Judge Demo Preset Switcher
  const handleSelectPreset = async (presetId) => {
    setIsResetting(true)
    try {
      const res = await fetch(`${activeApiBase}/presets/${presetId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProject(data)
      setActiveSourceIndex(0)
      setHighlightedSnippet(null)
      setHighlightedSource(null)
      showToast(
        presetId === 'apex-auth-clean'
          ? '// LOADED: PRESET 2 - CLEAN AUTH (VERIFIED)'
          : '// LOADED: PRESET 1 - GATEWAY (CONFLICT)'
      )
    } catch (err) {
      showToast(`// PRESET_LOAD_FAILED: ${err.message}`)
    } finally {
      setIsResetting(false)
    }
  }

  // Initialize backend connection
  useEffect(() => {
    initBackend()
  }, [])

  const initBackend = async () => {
    setLoading(true)
    setError(null)
    setHealthStatus('Checking...')

    let resolvedBase = null

    for (const candidate of BACKEND_CANDIDATES) {
      try {
        const res = await fetch(`${candidate}/health`, { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ok') {
            resolvedBase = candidate
            break
          }
        }
      } catch (err) {
        // Fallback to next candidate
      }
    }

    if (resolvedBase) {
      setActiveApiBase(resolvedBase)
      setHealthStatus('Online')
      await fetchProjectData(resolvedBase)
    } else {
      setHealthStatus('Offline')
      setError('Cannot connect to FastAPI backend on port 8000.')
      setLoading(false)
    }
  }

  const fetchProjectData = async (base) => {
    const api = base || activeApiBase
    try {
      setLoading(true)
      const res = await fetch(`${api}/sample`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProject(data)
      setError(null)
    } catch (err) {
      setError(`Failed to fetch project: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Reset Project
  const handleResetProject = async (presetId = 'apex-core-2026') => {
    setIsResetting(true)
    try {
      const res = await fetch(`${activeApiBase}/sample/reset?preset_id=${presetId}`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchProjectData(activeApiBase)
      setHighlightedSnippet(null)
      setHighlightedSource(null)
      showToast('// STATE_RESET: PRESET_INITIALIZED')
    } catch (err) {
      await fetchProjectData(activeApiBase)
      showToast('// STATE_RELOADED')
    } finally {
      setIsResetting(false)
    }
  }

  // Toggle Claim Approval
  const handleToggleApprove = async (claimId) => {
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) =>
          c.id === claimId ? { ...c, is_approved: !c.is_approved } : c
        ),
      }
    })

    try {
      const res = await fetch(`${activeApiBase}/claims/${claimId}/toggle-approve`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json()
      showToast(`// CLAIM_${claimId} -> ${result.is_approved ? 'APPROVED' : 'PENDING'}`)
    } catch (err) {
      showToast(`// LOCAL_SYNC_OK`)
    }
  }

  // Toggle Sensitive / Redaction
  const handleToggleSensitive = async (claimId) => {
    let nextVal = false
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) => {
          if (c.id === claimId) {
            nextVal = !c.is_sensitive
            return { ...c, is_sensitive: nextVal }
          }
          return c
        }),
      }
    })

    try {
      await fetch(`${activeApiBase}/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sensitive: nextVal }),
      })
      showToast(nextVal ? '// REDACTED_FROM_SUCCESSOR' : '// UNREDACTED')
    } catch (err) {
      showToast(nextVal ? '// REDACTED_LOCALLY' : '// UNREDACTED_LOCALLY')
    }
  }

  // Inline Edit
  const handleUpdateStatement = async (claimId, newStatement) => {
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) =>
          c.id === claimId ? { ...c, statement: newStatement } : c
        ),
      }
    })

    try {
      await fetch(`${activeApiBase}/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: newStatement }),
      })
      showToast(`// CLAIM_${claimId}_STATEMENT_UPDATED`)
    } catch (err) {
      showToast('// UPDATED_LOCALLY')
    }
  }

  // Update Status
  const handleUpdateStatus = async (claimId, newStatus) => {
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) =>
          c.id === claimId ? { ...c, status: newStatus } : c
        ),
      }
    })

    try {
      await fetch(`${activeApiBase}/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      showToast(`// STATUS -> ${newStatus.toUpperCase()}`)
    } catch (err) {
      showToast(`// STATUS_${newStatus.toUpperCase()}`)
    }
  }

  // Batch Approve All
  const handleApproveAll = async () => {
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) => ({ ...c, is_approved: true })),
      }
    })

    try {
      await fetch(`${activeApiBase}/claims/approve-all`, { method: 'POST' })
      showToast('// ALL_CLAIMS_APPROVED_FOR_HANDOVER')
    } catch (err) {
      showToast('// APPROVED_LOCALLY')
    }
  }

  // Inspect Evidence
  const handleInspectEvidence = (evidence) => {
    if (!evidence || !project || !project.raw_sources) return

    const sourceName = evidence.source_name
    const targetIdx = project.raw_sources.findIndex(
      (s) =>
        s.filename === sourceName ||
        s.filename.includes(sourceName) ||
        sourceName.includes(s.filename)
    )

    if (targetIdx !== -1) {
      setActiveSourceIndex(targetIdx)
    }

    setHighlightedSnippet(evidence.snippet)
    setHighlightedSource(evidence.source_name)
    showToast(`// CITATION_ANCHORED: ${evidence.source_name}`)
  }

  const handleClearHighlight = () => {
    setHighlightedSnippet(null)
    setHighlightedSource(null)
  }

  // Export Markdown
  const handleExportMarkdown = () => {
    if (!project) return
    const approvedOnly = project.claims.filter(
      (c) => c.is_approved && !c.is_sensitive
    )
    const content = generateHandoverMarkdown(project, approvedOnly)
    downloadMarkdownFile(
      `${project.project_id || 'apex'}-handover-brief.md`,
      content
    )
    showToast('// EXPORT_COMPLETE: BRIEF (.MD) DOWNLOADED')
  }

  // Export Machine-Readable JSON Audit Trail
  const handleExportJson = () => {
    if (!project) return
    const auditData = generateHandoverAuditJson(project, project.claims)
    downloadJsonFile(
      `${project.project_id || 'apex'}-handover-audit.json`,
      auditData
    )
    showToast('// EXPORT_COMPLETE: AUDIT (.JSON) DOWNLOADED')
  }

  // Audit Stats
  const stats = useMemo(() => {
    if (!project || !project.claims) {
      return { total: 0, approved: 0, pending: 0, conflicts: 0, sensitive: 0 }
    }
    const total = project.claims.length
    const approved = project.claims.filter((c) => c.is_approved).length
    const pending = total - approved
    const conflicts = project.claims.filter((c) => c.status === 'conflicting').length
    const sensitive = project.claims.filter((c) => c.is_sensitive).length
    return { total, approved, pending, conflicts, sensitive }
  }, [project])

  // Filtered claims
  const filteredClaims = useMemo(() => {
    if (!project || !project.claims) return []
    return project.claims.filter((c) => {
      if (selectedCategoryFilter === 'all') return true
      if (selectedCategoryFilter === 'conflicts') return c.status === 'conflicting'
      if (selectedCategoryFilter === 'pending') return !c.is_approved
      if (selectedCategoryFilter === 'sensitive') return c.is_sensitive
      return c.category === selectedCategoryFilter
    })
  }, [project, selectedCategoryFilter])

  // Successor claims
  const successorClaims = useMemo(() => {
    if (!project || !project.claims) return []
    return project.claims.filter((c) => c.is_approved && !c.is_sensitive)
  }, [project])

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-200 flex flex-col font-sans selection:bg-[#00f0ff]/30 selection:text-[#00f0ff] relative overflow-x-hidden at-grid-bg">
      {/* 1. ACTIVE THEORY ATMOSPHERIC CHROMA GLOW AURA */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-Right Neon Rose Ambient Glow Point */}
        <div
          className="absolute -top-[15%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[150px] animate-at-aura"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 127, 0.12) 0%, transparent 65%)',
          }}
        />

        {/* Left Electric Cerulean Cyan Glow Point */}
        <div
          className="absolute top-[18%] -left-[12%] w-[55vw] h-[55vw] rounded-full blur-[150px] animate-at-aura"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 60%)',
            animationDelay: '6s',
          }}
        />
      </div>

      {/* Minimalist Floating Telemetry Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/90 backdrop-blur-2xl border border-cyan-400/40 text-cyan-300 text-xs px-4 py-2.5 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-2.5 font-mono animate-fade-in tracking-wider">
          <span className="w-1.5 h-1.5 bg-[#00f0ff] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 1: High-Impact Cyberpunk Showcase Landing & Dossier */}
      {viewMode === 'landing' ? (
        <div className="relative z-10 flex flex-col min-h-screen">
          <LandingHero
            onLaunchDemo={handleLaunchDemo}
            onCustomInput={handleCustomInput}
            onOpenTeamDossier={() => setIsPortfolioOpen(true)}
          />
        </div>
      ) : (
        /* Screen 2: Interactive Handover Studio & Triage Dashboard */
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Top Bar */}
          <Header
            project={project}
            healthStatus={healthStatus}
            role={role}
            setRole={setRole}
            onResetProject={handleResetProject}
            onSelectPreset={handleSelectPreset}
            onLockHandover={() => setIsLockModalOpen(true)}
            onExportMarkdown={handleExportMarkdown}
            onExportJson={handleExportJson}
            onOpenPortfolio={() => setIsPortfolioOpen(true)}
            onBackToLanding={handleBackToLanding}
            onOpenIngest={() => setIsIngestModalOpen(true)}
            onStartTour={handleStartTour}
            stats={stats}
            isResetting={isResetting}
          />

          {/* Body Workspace */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Loading Indicator */}
            {loading && (
              <div className="py-28 text-center text-neutral-500 space-y-3 font-mono">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent shadow-[0_0_15px_#00f0ff]" />
                <p className="text-[11px] tracking-[0.25em] uppercase text-neutral-400">
                  // INGESTING PROJECT SOURCES & RECONSTRUCTING TIMELINE...
                </p>
              </div>
            )}

            {/* Error Banner */}
            {error && !loading && (
              <div className="p-6 rounded-2xl bg-black/80 backdrop-blur-2xl border border-rose-500/50 text-rose-200 space-y-3 shadow-[0_0_25px_rgba(255,0,127,0.2)] font-mono">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-[#ff007f]" />
                    <span>// API_CONNECTION_INTERRUPTED</span>
                  </h3>
                  <button
                    type="button"
                    onClick={initBackend}
                    className="px-3.5 py-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] uppercase tracking-wider font-bold transition"
                  >
                    [ RETRY_CONNECTION ]
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  FastAPI microservice unreachable on port 8000. Start the server using:
                </p>
                <pre className="p-3 bg-black/90 rounded text-amber-300 font-mono text-xs border border-white/10">
                  cd backend{'\n'}python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
                </pre>
              </div>
            )}

            {/* Active Handover View */}
            {project && !loading && (
              <>
                {/* REVIEWER / LEAD MODE */}
                {role === 'lead' && (
                  <div className="space-y-6">
                    {/* Executive Synthesis Tactical Glass Panel */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 relative corner-crosshair">
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex items-center gap-2 text-xs font-mono tracking-[0.18em] text-cyan-400 uppercase font-bold">
                          <span>// 01. RECONSTRUCTION_SYNTHESIS</span>
                          <span className="text-neutral-700">&bull;</span>
                          <span className="text-neutral-400">
                            {project.claims.length} CLAIMS &bull; {project.raw_sources.length} ARTIFACTS
                          </span>
                        </div>
                        <p className="font-body text-sm text-neutral-300 leading-relaxed">
                          {project.summary}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={handleApproveAll}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] text-xs font-mono tracking-[0.18em] uppercase font-bold transition active:scale-95"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>[ BATCH_APPROVE_ALL ]</span>
                        </button>
                      </div>
                    </div>

                    {/* Two-Column Wireframe Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* LEFT PANEL: Source Preview & Evidence Anchors (5 cols) */}
                      <div className="lg:col-span-5 h-[760px] sticky top-28">
                        <SourceViewer
                          rawSources={project.raw_sources}
                          activeSourceIndex={activeSourceIndex}
                          setActiveSourceIndex={setActiveSourceIndex}
                          highlightedSnippet={highlightedSnippet}
                          highlightedSource={highlightedSource}
                          onClearHighlight={handleClearHighlight}
                        />
                      </div>

                      {/* RIGHT PANEL: Claims & Human Review Stream (7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        {/* Active Theory Tactical Filter Bar */}
                        <div className="bg-black/70 backdrop-blur-xl p-2 rounded-xl border border-white/10 flex items-center justify-between gap-2 overflow-x-auto text-xs">
                          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 font-mono text-xs tracking-[0.18em]">
                            <span className="text-neutral-500 px-2 uppercase">
                              // FILTER:
                            </span>

                            {[
                              { id: 'all', label: `ALL (${project.claims.length})` },
                              { id: 'decision', label: 'DECISIONS' },
                              { id: 'blocker', label: 'BLOCKERS' },
                              { id: 'next_action', label: 'NEXT_ACTIONS' },
                              { id: 'conflicts', label: `CONFLICTS (${stats.conflicts})` },
                              { id: 'pending', label: `PENDING (${stats.pending})` },
                              { id: 'sensitive', label: `REDACTED (${stats.sensitive})` },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategoryFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition shrink-0 ${
                                  selectedCategoryFilter === tab.id
                                    ? 'bg-[#00f0ff]/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                    : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <span className="text-xs text-neutral-500 font-mono hidden sm:inline px-2 shrink-0 tracking-[0.18em]">
                            [{filteredClaims.length}_ITEMS]
                          </span>
                        </div>

                        {/* Claims Stream Cards */}
                        <div className="space-y-4">
                          {filteredClaims.length === 0 ? (
                            <div className="p-12 rounded-2xl bg-black/40 border border-white/5 text-center text-neutral-600 text-xs font-mono tracking-widest uppercase">
                              // NO_MATCHING_CLAIMS_FOR_CRITERIA
                            </div>
                          ) : (
                            filteredClaims.map((claim) => (
                              <ClaimCard
                                key={claim.id}
                                claim={claim}
                                onToggleApprove={handleToggleApprove}
                                onToggleSensitive={handleToggleSensitive}
                                onUpdateStatement={handleUpdateStatement}
                                onUpdateStatus={handleUpdateStatus}
                                onInspectEvidence={handleInspectEvidence}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUCCESSOR VIEW */}
                {role === 'successor' && (
                  <SuccessorView
                    project={project}
                    approvedClaims={successorClaims}
                    onExportMarkdown={handleExportMarkdown}
                    onExportJson={handleExportJson}
                    onInspectEvidence={handleInspectEvidence}
                  />
                )}
              </>
            )}
          </main>
        </div>
      )}

      {/* MODALS */}
      <FinalizeModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        stats={stats}
        project={project}
        onLockAndSwitch={() => {
          setIsLockModalOpen(false)
          setRole('successor')
          showToast('// HANDOVER_LOCKED -> SUCCESSOR_VIEW')
        }}
        onExportMarkdown={() => {
          setIsLockModalOpen(false)
          handleExportMarkdown()
        }}
        onExportJson={() => {
          setIsLockModalOpen(false)
          handleExportJson()
        }}
      />

      <TeamPortfolio
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
      />

      <CustomIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestCustomText={handleIngestCustomText}
        onLoadSampleDataset={handleResetProject}
      />

      <JudgeTourModal
        isOpen={isTourActive}
        currentStep={tourStep}
        onNext={handleNextTourStep}
        onPrev={handlePrevTourStep}
        onClose={() => setIsTourActive(false)}
        onJumpToStep={handleJumpToTourStep}
      />
    </div>
  )
}
