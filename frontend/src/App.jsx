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
import BentoMetricsBar from './components/BentoMetricsBar'
import ConflictModal from './components/ConflictModal'
import {
  generateHandoverMarkdown,
  generateHandoverAuditJson,
  downloadMarkdownFile,
  downloadJsonFile,
} from './utils/exportMarkdown'
import {
  getPresetData,
  extractClientSideHandover,
} from './data/mockDatasets'
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
  Search,
} from 'lucide-react'

const BACKEND_CANDIDATES = [
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api',
  '/api',
]

const fetchWithTimeout = async (url, options = {}, timeoutMs = 2500) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return res
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

export default function App() {
  const [project, setProject] = useState(null)
  const [healthStatus, setHealthStatus] = useState('Checking...')
  const [activeApiBase, setActiveApiBase] = useState('http://localhost:8000/api')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isConnectingBackend, setIsConnectingBackend] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Top-level screen state: 'landing' (showcase) | 'studio' (workspace)
  const [viewMode, setViewMode] = useState('landing')

  // Dual-role view mode inside studio: 'lead' | 'successor'
  const [role, setRole] = useState('lead')

  // Authentication & RBAC state
  const [currentUser, setCurrentUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)

  // Left panel state
  const [activeSourceIndex, setActiveSourceIndex] = useState(0)
  const [highlightedSnippet, setHighlightedSnippet] = useState(null)
  const [highlightedSource, setHighlightedSource] = useState(null)

  // Filter & Search state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false)
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false)
  const [activeConflict, setActiveConflict] = useState(null)

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
      if (healthStatus === 'Online' && activeApiBase) {
        await fetchProjectData(activeApiBase)
      } else {
        setProject(getPresetData('apex-core-2026'))
        setLoading(false)
      }
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

  // Authenticate Demo Account via Server API
  const handleSwitchUserRole = async (targetRole) => {
    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/auth/demo-login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: targetRole }),
          },
          2000
        )
        if (res.ok) {
          const data = await res.json()
          setCurrentUser(data.user)
          setAuthToken(data.access_token)
          showToast(`// AUTH_OK: LOGGED_IN_AS [${data.user.role.toUpperCase()}]`)
          await fetchProjectData(activeApiBase, data.access_token)
          return
        }
      } catch (err) {
        // Fallback
      }
    }

    // Client-side fallback
    setCurrentUser({
      id: `usr-${targetRole}`,
      email: `${targetRole}@apex.dev`,
      full_name: targetRole === 'project_reviewer' ? 'Jordan Lee (Lead Reviewer)' : 'Taylor Morgan (Successor)',
      role: targetRole,
    })
    showToast(`// ROLE_SWITCH: [${targetRole.toUpperCase()}]`)
  }

  // Ingest Multi-File Documents (Outcome A)
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return
    setLoading(true)

    if (healthStatus === 'Online' && activeApiBase && project) {
      try {
        const formData = new FormData()
        files.forEach((f) => formData.append('files', f))

        const res = await fetchWithTimeout(
          `${activeApiBase}/projects/${project.project_id}/documents/upload`,
          {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            body: formData,
          },
          15000
        )

        if (res.ok) {
          const data = await res.json()
          setProject(data.project)
          setActiveSourceIndex(0)
          setLoading(false)
          showToast(`// INGESTION_COMPLETE: ${files.length} FILE(S) PARSED`)
          return
        } else {
          const errData = await res.json()
          throw new Error(errData.detail || 'Upload failed')
        }
      } catch (err) {
        showToast(`// UPLOAD_ERROR: ${err.message}`)
      }
    }

    // Client fallback
    setLoading(false)
    showToast(`// PROCESSED: ${files.length} DOCUMENTS`)
  }

  // Custom Text Ingestion
  const handleIngestCustomText = async (payload) => {
    setLoading(true)
    let ingestedProject = null

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/ingest`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify(payload),
          },
          4000
        )
        if (res.ok) {
          ingestedProject = await res.json()
        }
      } catch (err) {
        // Fallback
      }
    }

    if (!ingestedProject) {
      ingestedProject = extractClientSideHandover(payload)
    }

    setProject(ingestedProject)
    setIsIngestModalOpen(false)
    setActiveSourceIndex(0)
    setHighlightedSnippet(null)
    setHighlightedSource(null)
    setLoading(false)
    showToast('// DYNAMIC_INGESTION_COMPLETE: CLAIMS_&_CITATIONS_RECONSTRUCTED')
  }

  // Preset Switcher
  const handleSelectPreset = async (presetId) => {
    setIsResetting(true)
    let loadedData = null

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(`${activeApiBase}/presets/${presetId}`, {}, 2000)
        if (res.ok) {
          loadedData = await res.json()
        }
      } catch (err) {
        // Fallback
      }
    }

    if (!loadedData) {
      loadedData = getPresetData(presetId)
    }

    setProject(loadedData)
    setActiveSourceIndex(0)
    setHighlightedSnippet(null)
    setHighlightedSource(null)
    setIsResetting(false)
    showToast(
      presetId === 'apex-auth-clean'
        ? '// LOADED: PRESET 2 - CLEAN AUTH (VERIFIED)'
        : '// LOADED: PRESET 1 - GATEWAY (CONFLICT)'
    )
  }

  // Initialize Backend Connection & Demo Login
  useEffect(() => {
    initBackend(true)
  }, [])

  const initBackend = async (quiet = true) => {
    setIsConnectingBackend(true)
    setHealthStatus('Checking...')
    let resolvedBase = null

    for (const candidate of BACKEND_CANDIDATES) {
      try {
        const res = await fetchWithTimeout(`${candidate}/health`, { method: 'GET' }, 1200)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ok') {
            resolvedBase = candidate
            break
          }
        }
      } catch (err) {
        // Next
      }
    }

    if (resolvedBase) {
      setActiveApiBase(resolvedBase)
      setHealthStatus('Online')
      setError(null)

      // Automatic demo login as reviewer
      try {
        const loginRes = await fetchWithTimeout(
          `${resolvedBase}/auth/demo-login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'project_reviewer' }),
          },
          1500
        )
        if (loginRes.ok) {
          const authData = await loginRes.json()
          setCurrentUser(authData.user)
          setAuthToken(authData.access_token)
          await fetchProjectData(resolvedBase, authData.access_token)
        } else {
          await fetchProjectData(resolvedBase)
        }
      } catch (e) {
        await fetchProjectData(resolvedBase)
      }

      if (!quiet) showToast('// LIVE_BACKEND_CONNECTED: SQLITE_PERSISTENCE')
    } else {
      setHealthStatus('Standalone')
      setActiveApiBase(null)
      setError(null)
      setProject((prev) => prev || getPresetData('apex-core-2026'))
      setLoading(false)
      if (!quiet) showToast('// SYS_DEMO_LIVE: STANDALONE ENGINE ENGAGED')
    }
    setIsConnectingBackend(false)
  }

  const fetchProjectData = async (base, token) => {
    const api = base || activeApiBase
    if (!api) {
      setProject((prev) => prev || getPresetData('apex-core-2026'))
      setLoading(false)
      return
    }

    const t = token || authToken
    try {
      setLoading(true)
      const res = await fetchWithTimeout(
        `${api}/sample`,
        {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        },
        2000
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setProject(data)
      setError(null)
    } catch (err) {
      setHealthStatus('Standalone')
      setProject((prev) => prev || getPresetData('apex-core-2026'))
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  // Reset Project
  const handleResetProject = async (presetId = 'apex-core-2026') => {
    setIsResetting(true)
    let resetDone = false

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/sample/reset?preset_id=${presetId}`,
          {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          },
          2000
        )
        if (res.ok) {
          await fetchProjectData(activeApiBase)
          resetDone = true
        }
      } catch (err) {
        // Fallback
      }
    }

    if (!resetDone) {
      setProject(getPresetData(presetId))
    }

    setHighlightedSnippet(null)
    setHighlightedSource(null)
    setIsResetting(false)
    showToast('// STATE_RESET: PRESET_INITIALIZED')
  }

  // Toggle Claim Approval
  const handleToggleApprove = async (claimId) => {
    let nextApproved = false
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) => {
          if (c.id === claimId) {
            nextApproved = !c.is_approved
            return { ...c, is_approved: nextApproved }
          }
          return c
        }),
      }
    })

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/claims/${claimId}/toggle-approve`,
          {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          },
          1500
        )
        if (res.ok) {
          const result = await res.json()
          showToast(`// CLAIM_${claimId} -> ${result.is_approved ? 'APPROVED' : 'PENDING'}`)
          return
        } else if (res.status === 403) {
          showToast('// 403_FORBIDDEN: ONLY_REVIEWERS_CAN_APPROVE')
          return
        }
      } catch (err) {
        // Handled
      }
    }

    showToast(`// CLAIM_${claimId} -> ${nextApproved ? 'APPROVED' : 'PENDING'}`)
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

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/claims/${claimId}/toggle-sensitive`,
          {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          },
          1500
        )
        if (res.ok) {
          showToast(nextVal ? '// REDACTED_FROM_SUCCESSOR' : '// UNREDACTED')
          return
        }
      } catch (err) {
        // Handled
      }
    }

    showToast(nextVal ? '// REDACTED_FROM_SUCCESSOR' : '// UNREDACTED')
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

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        await fetchWithTimeout(
          `${activeApiBase}/claims/${claimId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ statement: newStatement }),
          },
          1500
        )
      } catch (err) {
        // Handled
      }
    }

    showToast(`// CLAIM_${claimId}_STATEMENT_UPDATED`)
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

    if (healthStatus === 'Online' && activeApiBase) {
      try {
        await fetchWithTimeout(
          `${activeApiBase}/claims/approve-all`,
          {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          },
          1500
        )
      } catch (err) {
        // Handled
      }
    }

    showToast('// ALL_CLAIMS_APPROVED_FOR_HANDOVER')
  }

  // Resolve Conflict Handler (Outcome C)
  const handleResolveConflict = async (conflictId, payload) => {
    if (healthStatus === 'Online' && activeApiBase && project) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/projects/${project.project_id}/conflicts/${conflictId}/resolve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify(payload),
          },
          2500
        )
        if (res.ok) {
          showToast('// CONFLICT_RESOLVED: AUDIT_LOG_RECORDED')
          await fetchProjectData(activeApiBase)
          return
        }
      } catch (err) {
        showToast(`// RESOLUTION_ERROR: ${err.message}`)
      }
    }

    // Client update
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        conflicts: (prev.conflicts || []).map((c) =>
          c.id === conflictId
            ? { ...c, status: payload.status, resolution_choice: payload.resolution_choice, rationale: payload.rationale }
            : c
        ),
      }
    })
    showToast('// CONFLICT_RESOLVED_CLIENT')
  }

  // Update Successor Checklist Task (Outcome F)
  const handleUpdateChecklistTask = async (taskKey, nextStatus) => {
    if (healthStatus === 'Online' && activeApiBase && project) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/projects/${project.project_id}/checklist/${taskKey}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify({ status: nextStatus }),
          },
          2000
        )
        if (res.ok) {
          const updatedItem = await res.json()
          setProject((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              checklist: (prev.checklist || []).map((item) =>
                item.task_key === taskKey ? updatedItem : item
              ),
            }
          })
          showToast(`// CHECKLIST: ${taskKey} -> ${nextStatus.toUpperCase()}`)
          return
        }
      } catch (err) {
        // Fallback
      }
    }

    // Client update
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        checklist: (prev.checklist || []).map((item) =>
          item.task_key === taskKey ? { ...item, status: nextStatus } : item
        ),
      }
    })
    showToast(`// CHECKLIST: ${taskKey} -> ${nextStatus.toUpperCase()}`)
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

  // Filtered claims with search
  const filteredClaims = useMemo(() => {
    if (!project || !project.claims) return []
    return project.claims.filter((c) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesStatement = c.statement?.toLowerCase().includes(query)
        const matchesExcerpt = c.exact_source_excerpt?.toLowerCase().includes(query)
        const matchesSource = c.source_filename?.toLowerCase().includes(query)
        if (!matchesStatement && !matchesExcerpt && !matchesSource) return false
      }

      if (selectedCategoryFilter === 'all') return true
      if (selectedCategoryFilter === 'approved') return c.is_approved
      if (selectedCategoryFilter === 'conflicts') return c.status === 'conflicting'
      if (selectedCategoryFilter === 'pending') return !c.is_approved
      if (selectedCategoryFilter === 'sensitive') return c.is_sensitive
      if (selectedCategoryFilter === 'supported') return c.validation_status === 'supported'
      if (selectedCategoryFilter === 'needs_review') return c.validation_status === 'needs_human_review'
      return c.category === selectedCategoryFilter
    })
  }, [project, selectedCategoryFilter, searchQuery])

  // Successor claims (approved & non-sensitive)
  const successorClaims = useMemo(() => {
    if (!project || !project.claims) return []
    return project.claims.filter((c) => c.is_approved && !c.is_sensitive)
  }, [project])

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-200 flex flex-col font-sans selection:bg-[#00f0ff]/30 selection:text-[#00f0ff] relative overflow-x-hidden at-grid-bg">
      {/* Glow Aura */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-[15%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[150px] animate-at-aura"
          style={{
            background: 'radial-gradient(circle, rgba(255, 0, 127, 0.12) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute top-[18%] -left-[12%] w-[55vw] h-[55vw] rounded-full blur-[150px] animate-at-aura"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 60%)',
            animationDelay: '6s',
          }}
        />
      </div>

      {/* Floating Telemetry Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/90 backdrop-blur-2xl border border-cyan-400/40 text-cyan-300 text-xs px-4 py-2.5 rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.25)] flex items-center gap-2.5 font-mono animate-fade-in tracking-wider">
          <span className="w-1.5 h-1.5 bg-[#00f0ff] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 1: Landing Hero & Team Showcase */}
      {viewMode === 'landing' ? (
        <div className="relative z-10 flex flex-col min-h-screen">
          <LandingHero
            onLaunchDemo={handleLaunchDemo}
            onCustomInput={handleCustomInput}
            onOpenTeamDossier={() => setIsPortfolioOpen(true)}
          />
        </div>
      ) : (
        /* Screen 2: Handover Studio */
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header
            project={project}
            healthStatus={healthStatus}
            role={role}
            setRole={setRole}
            currentUser={currentUser}
            onSwitchUserRole={handleSwitchUserRole}
            onResetProject={handleResetProject}
            onSelectPreset={handleSelectPreset}
            onLockHandover={() => setIsLockModalOpen(true)}
            onExportMarkdown={handleExportMarkdown}
            onExportJson={handleExportJson}
            onOpenPortfolio={() => setIsPortfolioOpen(true)}
            onBackToLanding={handleBackToLanding}
            onOpenIngest={() => setIsIngestModalOpen(true)}
            onStartTour={handleStartTour}
            onRetryBackend={() => initBackend(false)}
            isConnectingBackend={isConnectingBackend}
            stats={stats}
            isResetting={isResetting}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Loading Indicator */}
            {loading && !project && (
              <div className="py-28 text-center text-neutral-500 space-y-3 font-mono">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent shadow-[0_0_15px_#00f0ff]" />
                <p className="text-[11px] tracking-[0.25em] uppercase text-neutral-400">
                  // INITIALIZING APEX TRANSITION ENGINE & DATASETS...
                </p>
              </div>
            )}

            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>// RUNTIME_NOTICE: {error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="px-2.5 py-1 rounded bg-black/70 border border-white/10 hover:border-white/30 text-[10px] text-neutral-300 transition"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* Workspace Content */}
            {project && (
              <>
                {/* REVIEWER / LEAD MODE */}
                {role === 'lead' && (
                  <div className="space-y-8">
                    <BentoMetricsBar
                      stats={stats}
                      selectedCategoryFilter={selectedCategoryFilter}
                      onSelectFilter={(filterId) => setSelectedCategoryFilter(filterId)}
                    />

                    {/* Executive Synthesis Panel */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-[#0c0d14]/75 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative shadow-lg">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center gap-2.5 text-xs font-mono tracking-[0.18em] text-cyan-400 uppercase font-bold">
                          <span>// 01. RECONSTRUCTION_SYNTHESIS</span>
                          <span className="text-neutral-700">&bull;</span>
                          <span className="text-neutral-400">
                            {project.claims?.length || 0} CLAIMS &bull; {project.raw_sources?.length || 0} ARTIFACTS
                          </span>
                        </div>
                        <p className="font-body text-sm text-neutral-300 leading-relaxed">
                          {project.summary}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleApproveAll}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black/90 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] text-xs font-mono tracking-[0.18em] uppercase font-bold transition active:scale-95"
                        >
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                          <span>[ BATCH_APPROVE_ALL ]</span>
                        </button>
                      </div>
                    </div>

                    {/* Two-Column Split Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
                      {/* Left: Source Artifacts Viewer (5 cols) */}
                      <div className="lg:col-span-5 h-[800px] sticky top-24">
                        <SourceViewer
                          rawSources={project.raw_sources}
                          activeSourceIndex={activeSourceIndex}
                          setActiveSourceIndex={setActiveSourceIndex}
                          highlightedSnippet={highlightedSnippet}
                          highlightedSource={highlightedSource}
                          onClearHighlight={handleClearHighlight}
                        />
                      </div>

                      {/* Right: Claims Stream & Triage (7 cols) */}
                      <div className="lg:col-span-7 space-y-5">
                        {/* Search and Filters */}
                        <div className="bg-[#0c0d14]/80 backdrop-blur-xl p-3 rounded-xl border border-white/10 space-y-2.5 shadow-md">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search claims, excerpts, or document filenames..."
                              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none placeholder:text-neutral-600"
                            />
                            {searchQuery && (
                              <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Filter Tabs */}
                          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 font-mono text-xs tracking-wider">
                            <span className="text-neutral-500 px-1 uppercase text-[10px] font-bold">
                              // FILTER:
                            </span>

                            {[
                              { id: 'all', label: `ALL (${project.claims?.length || 0})` },
                              { id: 'supported', label: 'SUPPORTED' },
                              { id: 'needs_review', label: 'NEEDS_REVIEW' },
                              { id: 'conflicts', label: `CONFLICTS (${stats.conflicts})` },
                              { id: 'pending', label: `PENDING (${stats.pending})` },
                              { id: 'sensitive', label: `REDACTED (${stats.sensitive})` },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategoryFilter(tab.id)}
                                className={`px-2.5 py-1 rounded-lg font-bold uppercase transition shrink-0 text-[11px] ${
                                  selectedCategoryFilter === tab.id
                                    ? 'bg-[#00f0ff]/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Claims List */}
                        <div className="space-y-4">
                          {filteredClaims.length === 0 ? (
                            <div className="p-16 rounded-2xl bg-[#0c0d14]/50 border border-white/5 text-center text-neutral-500 text-xs font-mono tracking-widest uppercase">
                              // NO_MATCHING_CLAIMS_FOR_CRITERIA
                            </div>
                          ) : (
                            filteredClaims.map((claim) => (
                              <ClaimCard
                                key={claim.id}
                                claim={claim}
                                isReviewer={role === 'lead'}
                                onToggleApprove={handleToggleApprove}
                                onToggleSensitive={handleToggleSensitive}
                                onUpdateStatement={handleUpdateStatement}
                                onInspectEvidence={handleInspectEvidence}
                                onOpenConflictModal={() => {
                                  const conf = (project.conflicts || []).find(
                                    (c) => c.claim_id_1 === claim.id || c.claim_id_2 === claim.id
                                  )
                                  if (conf) setActiveConflict(conf)
                                }}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUCCESSOR VIEW (Day 1-30 Sanitized & Persistent Checklist) */}
                {role === 'successor' && (
                  <SuccessorView
                    project={project}
                    approvedClaims={successorClaims}
                    checklist={project.checklist || []}
                    onUpdateChecklistTask={handleUpdateChecklistTask}
                    onExportMarkdown={handleExportMarkdown}
                    onExportJson={handleExportJson}
                    onInspectEvidence={handleInspectEvidence}
                    onOpenConflictModal={(conf) => setActiveConflict(conf)}
                  />
                )}
              </>
            )}
          </main>
        </div>
      )}

      {/* Side-by-Side Conflict Resolution Modal */}
      <ConflictModal
        isOpen={!!activeConflict}
        conflict={activeConflict}
        onClose={() => setActiveConflict(null)}
        onResolveConflict={handleResolveConflict}
        isReviewer={role === 'lead'}
      />

      {/* Lock Handover Modal */}
      <FinalizeModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        stats={stats}
        project={project}
        onLockAndSwitch={async () => {
          setIsLockModalOpen(false)
          // Reviewer locks handover
          if (healthStatus === 'Online' && activeApiBase && project) {
            try {
              const res = await fetchWithTimeout(
                `${activeApiBase}/projects/${project.project_id}/approve`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                  },
                  body: JSON.stringify({ status: 'approved' }),
                },
                2000
              )
              if (!res.ok) {
                const err = await res.json()
                showToast(`// LOCK_REJECTED: ${err.detail || 'Error'}`)
                return
              }
            } catch (err) {
              // Fallback
            }
          }
          setRole('successor')
          showToast('// HANDOVER_APPROVED_&_LOCKED -> SUCCESSOR_VIEW')
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
        onUploadFiles={handleUploadFiles}
        projectId={project?.project_id || 'apex-core-2026'}
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
