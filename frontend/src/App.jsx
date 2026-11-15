import React, { useEffect, useState, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import CommandCenter from './components/CommandCenter'
import DocumentsWorkspace from './components/DocumentsWorkspace'
import EvidenceExplorer from './components/EvidenceExplorer'
import ConflictLab from './components/ConflictLab'
import ReviewApprovals from './components/ReviewApprovals'
import TrustSecurity from './components/TrustSecurity'
import SuccessorWorkspace from './components/SuccessorWorkspace'
import AuditHistory from './components/AuditHistory'
import ConflictModal from './components/ConflictModal'
import FinalizeModal from './components/FinalizeModal'
import JudgeTourModal from './components/JudgeTourModal'
import TeamPortfolio from './components/TeamPortfolio'
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
import { AlertTriangle } from 'lucide-react'

const rawEnvApi = import.meta.env.VITE_API_BASE_URL
const normalizedEnvApi = rawEnvApi
  ? rawEnvApi.replace(/\/+$/, '') + (rawEnvApi.endsWith('/api') ? '' : '/api')
  : null

const BACKEND_CANDIDATES = [
  ...(normalizedEnvApi ? [normalizedEnvApi] : []),
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

  // 8 Navigation Tabs: 'command_center' | 'documents' | 'evidence' | 'conflicts' | 'review' | 'security' | 'successor' | 'audit'
  const [activeTab, setActiveTab] = useState('command_center')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Authentication & RBAC state
  const [currentUser, setCurrentUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)

  // Modals
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false)
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
      handleSwitchUserRole('project_reviewer')
      setActiveTab('command_center')
      showToast('// TOUR: STEP 1 - COMMAND CENTER & READINESS INDEX')
    } else if (stepIndex === 1) {
      handleSwitchUserRole('project_reviewer')
      setActiveTab('conflicts')
      showToast('// TOUR: STEP 2 - TIMELINE CONTRADICTION TRIAGE')
    } else if (stepIndex === 2) {
      handleSwitchUserRole('project_reviewer')
      setActiveTab('evidence')
      showToast('// TOUR: STEP 3 - ANCHORED CITATION & PROVENANCE')
    } else if (stepIndex === 3) {
      handleSwitchUserRole('incoming_successor')
      setActiveTab('successor')
      showToast('// TOUR: STEP 4 - SUCCESSOR DAY-1 ONBOARDING')
    }
  }

  const handleStartTour = () => {
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
      full_name:
        targetRole === 'project_reviewer'
          ? 'Jordan Lee (Lead Reviewer)'
          : targetRole === 'incoming_successor'
          ? 'Taylor Morgan (Successor)'
          : 'Alex Chen (Outgoing Contributor)',
      role: targetRole,
    })
    showToast(`// ROLE_SWITCH: [${targetRole.toUpperCase()}]`)
  }

  // Ingest Multi-File Documents
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
          setLoading(false)
          setActiveTab('documents')
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
      } catch (err) {}
    }

    if (!ingestedProject) {
      ingestedProject = extractClientSideHandover(payload)
    }

    setProject(ingestedProject)
    setLoading(false)
    setActiveTab('evidence')
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
      } catch (err) {}
    }

    if (!loadedData) {
      loadedData = getPresetData(presetId)
    }

    setProject(loadedData)
    setIsResetting(false)
    setActiveTab('command_center')
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
      } catch (err) {}
    }

    if (resolvedBase) {
      setActiveApiBase(resolvedBase)
      setHealthStatus('Online')
      setError(null)

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

  // Toggle Claim Approval
  const handleToggleApprove = async (claimId) => {
    let prevVal = null
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) => {
          if (c.id === claimId) {
            prevVal = c.is_approved
            return { ...c, is_approved: !c.is_approved }
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
        } else {
          setProject((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              claims: prev.claims.map((c) =>
                c.id === claimId ? { ...c, is_approved: prevVal } : c
              ),
            }
          })
          const errData = await res.json().catch(() => ({}))
          showToast(`// REJECTED_${res.status}: ${errData.detail || 'PERMISSION_DENIED'}`)
          return
        }
      } catch (err) {
        setProject((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            claims: prev.claims.map((c) =>
              c.id === claimId ? { ...c, is_approved: prevVal } : c
            ),
          }
        })
        showToast(`// API_ERROR: ${err.message}`)
        return
      }
    }

    showToast(`// CLAIM_${claimId} -> ${!prevVal ? 'APPROVED' : 'PENDING'}`)
  }

  // Toggle Sensitive / Redaction
  const handleToggleSensitive = async (claimId) => {
    let prevVal = null
    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) => {
          if (c.id === claimId) {
            prevVal = c.is_sensitive
            return { ...c, is_sensitive: !c.is_sensitive }
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
          showToast(!prevVal ? '// REDACTED_FROM_SUCCESSOR' : '// UNREDACTED')
          return
        } else {
          setProject((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              claims: prev.claims.map((c) =>
                c.id === claimId ? { ...c, is_sensitive: prevVal } : c
              ),
            }
          })
          const errData = await res.json().catch(() => ({}))
          showToast(`// REJECTED_${res.status}: ${errData.detail || 'PERMISSION_DENIED'}`)
          return
        }
      } catch (err) {
        setProject((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            claims: prev.claims.map((c) =>
              c.id === claimId ? { ...c, is_sensitive: prevVal } : c
            ),
          }
        })
        showToast(`// API_ERROR: ${err.message}`)
        return
      }
    }

    showToast(!prevVal ? '// REDACTED_FROM_SUCCESSOR' : '// UNREDACTED')
  }

  // Inline Edit Statement
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
      } catch (err) {}
    }

    showToast(`// CLAIM_${claimId}_STATEMENT_UPDATED`)
  }

  // Batch Approve All
  const handleApproveAll = async () => {
    if (healthStatus === 'Online' && activeApiBase) {
      try {
        const res = await fetchWithTimeout(
          `${activeApiBase}/claims/approve-all`,
          {
            method: 'POST',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          },
          1500
        )
        if (res.ok) {
          setProject((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              claims: prev.claims.map((c) => ({ ...c, is_approved: true })),
            }
          })
          showToast('// ALL_CLAIMS_APPROVED_FOR_HANDOVER')
          return
        } else {
          const errData = await res.json().catch(() => ({}))
          showToast(`// REJECTED_${res.status}: ${errData.detail || 'REVIEWER_ROLE_REQUIRED'}`)
          return
        }
      } catch (err) {
        showToast(`// API_ERROR: ${err.message}`)
        return
      }
    }

    setProject((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        claims: prev.claims.map((c) => ({ ...c, is_approved: true })),
      }
    })
    showToast('// ALL_CLAIMS_APPROVED_FOR_HANDOVER')
  }

  // Resolve Conflict Handler
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
        } else {
          const errData = await res.json().catch(() => ({}))
          showToast(`// REJECTED_${res.status}: ${errData.detail || 'RESOLUTION_FAILED'}`)
          return
        }
      } catch (err) {
        showToast(`// RESOLUTION_ERROR: ${err.message}`)
        return
      }
    }

    // Client update in Standalone mode
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
    showToast('// CONFLICT_RESOLVED_STANDALONE')
  }

  // Update Successor Checklist Task
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
        } else {
          const errData = await res.json().catch(() => ({}))
          showToast(`// CHECKLIST_REJECTED_${res.status}: ${errData.detail || 'FAILED'}`)
          return
        }
      } catch (err) {
        showToast(`// CHECKLIST_ERROR: ${err.message}`)
        return
      }
    }

    // Client update in Standalone mode
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
    if (!evidence) return
    setActiveTab('evidence')
    showToast(`// CITATION_ANCHORED: ${evidence.source_name || 'Document'}`)
  }

  // Export Markdown
  const handleExportMarkdown = () => {
    if (!project) return
    const approvedOnly = project.claims.filter(
      (c) => c.is_approved && !c.is_sensitive
    )
    const content = generateHandoverMarkdown(project, approvedOnly)
    downloadMarkdownFile(
      `${project.project_id || 'codefrontier'}-handover-brief.md`,
      content
    )
    showToast('// EXPORT_COMPLETE: BRIEF (.MD) DOWNLOADED')
  }

  // Export JSON
  const handleExportJson = () => {
    if (!project) return
    const auditData = generateHandoverAuditJson(project, project.claims)
    downloadJsonFile(
      `${project.project_id || 'codefrontier'}-handover-audit.json`,
      auditData
    )
    showToast('// EXPORT_COMPLETE: AUDIT (.JSON) DOWNLOADED')
  }

  // Unresolved conflict count
  const unresolvedConflictCount = useMemo(() => {
    if (!project || !project.conflicts) return 0
    return project.conflicts.filter((c) => c.status === 'unresolved').length
  }, [project])

  // Stats
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

  // Successor claims (approved & non-sensitive)
  const successorClaims = useMemo(() => {
    if (!project || !project.claims) return []
    return project.claims.filter((c) => c.is_approved && !c.is_sensitive)
  }, [project])

  return (
    <div className="flex h-screen bg-[#070a12] text-slate-100 overflow-hidden font-body select-none">
      {/* 1. Left Collapsible Enterprise Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        project={project}
        stats={stats}
        unresolvedConflictCount={unresolvedConflictCount}
        currentUser={currentUser}
        onSwitchUserRole={handleSwitchUserRole}
        onSelectPreset={handleSelectPreset}
        onStartTour={handleStartTour}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* 2. Main Right Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          project={project}
          activeTab={activeTab}
          healthStatus={healthStatus}
          currentUser={currentUser}
          onOpenIngest={() => setActiveTab('documents')}
          onStartTour={handleStartTour}
          onExportMarkdown={handleExportMarkdown}
          onExportJson={handleExportJson}
          onRetryBackend={() => initBackend(false)}
          isConnectingBackend={isConnectingBackend}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setMobileOpen={setMobileOpen}
        />

        {/* Scrollable Main Content Surface */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 cf-grid-pattern">
          {/* Loading Indicator */}
          {loading && !project && (
            <div className="py-28 text-center text-slate-400 font-mono text-xs space-y-3">
              <div className="inline-block animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
              <p className="tracking-widest uppercase text-slate-400">
                // INITIALIZING CODEFRONTIER TRANSITION ENGINE...
              </p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between gap-3 shadow-sm mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>// RUNTIME NOTICE: {error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[10px] text-slate-300 hover:text-white"
              >
                DISMISS
              </button>
            </div>
          )}

          {/* Active Workspace by Tab */}
          {project && (
            <>
              {/* SCREEN 1: Command Center */}
              {activeTab === 'command_center' && (
                <CommandCenter
                  project={project}
                  stats={stats}
                  onNavigateTab={(tab) => {
                    if (tab === 'successor') handleSwitchUserRole('incoming_successor')
                    setActiveTab(tab)
                  }}
                  onOpenConflictModal={(conf) => setActiveConflict(conf)}
                  onLockHandover={() => setIsLockModalOpen(true)}
                  currentUser={currentUser}
                  activeApiBase={activeApiBase}
                  authToken={authToken}
                />
              )}

              {/* SCREEN 2: Documents & Ingestion */}
              {activeTab === 'documents' && (
                <DocumentsWorkspace
                  project={project}
                  onUploadFiles={handleUploadFiles}
                  onIngestCustomText={handleIngestCustomText}
                  isReviewer={currentUser?.role === 'project_reviewer'}
                  onInspectEvidence={(ev) => {
                    handleInspectEvidence(ev)
                    setActiveTab('evidence')
                  }}
                />
              )}

              {/* SCREEN 3: Evidence Explorer */}
              {activeTab === 'evidence' && (
                <EvidenceExplorer
                  project={project}
                  claims={project.claims || []}
                  rawSources={project.raw_sources || []}
                  onToggleApprove={handleToggleApprove}
                  onToggleSensitive={handleToggleSensitive}
                  onUpdateStatement={handleUpdateStatement}
                  onApproveAll={handleApproveAll}
                  onInspectEvidence={handleInspectEvidence}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  isReviewer={currentUser?.role === 'project_reviewer'}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}

              {/* SCREEN 4: Conflict Lab */}
              {activeTab === 'conflicts' && (
                <ConflictLab
                  conflicts={project.conflicts || []}
                  onResolveConflict={handleResolveConflict}
                  onInspectEvidence={(ev) => {
                    handleInspectEvidence(ev)
                    setActiveTab('evidence')
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  isReviewer={currentUser?.role === 'project_reviewer'}
                  currentUser={currentUser}
                />
              )}

              {/* SCREEN 5: Review & Approvals */}
              {activeTab === 'review' && (
                <ReviewApprovals
                  project={project}
                  claims={project.claims || []}
                  onToggleApprove={handleToggleApprove}
                  onToggleSensitive={handleToggleSensitive}
                  onUpdateStatement={handleUpdateStatement}
                  onApproveAll={handleApproveAll}
                  onLockHandover={() => setIsLockModalOpen(true)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  currentUser={currentUser}
                  activeApiBase={activeApiBase}
                  authToken={authToken}
                />
              )}

              {/* SCREEN 6: Trust & Security */}
              {activeTab === 'security' && (
                <TrustSecurity
                  project={project}
                  claims={project.claims || []}
                  currentUser={currentUser}
                  onToggleSensitive={handleToggleSensitive}
                  onSwitchUserRole={handleSwitchUserRole}
                  isReviewer={currentUser?.role === 'project_reviewer'}
                />
              )}

              {/* SCREEN 7: Successor Workspace */}
              {activeTab === 'successor' && (
                <SuccessorWorkspace
                  project={project}
                  approvedClaims={successorClaims}
                  checklist={project.checklist || []}
                  onUpdateChecklistTask={handleUpdateChecklistTask}
                  onExportMarkdown={handleExportMarkdown}
                  onExportJson={handleExportJson}
                  onInspectEvidence={(ev) => {
                    handleInspectEvidence(ev)
                    setActiveTab('evidence')
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {/* SCREEN 8: Audit History */}
              {activeTab === 'audit' && (
                <AuditHistory
                  project={project}
                  activeApiBase={activeApiBase}
                  authToken={authToken}
                  currentUser={currentUser}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Telemetry Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c101c]/95 border border-cyan-500/40 text-cyan-300 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 font-mono animate-fade-in tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <ConflictModal
        isOpen={!!activeConflict}
        conflict={activeConflict}
        onClose={() => setActiveConflict(null)}
        onResolveConflict={handleResolveConflict}
        isReviewer={currentUser?.role === 'project_reviewer'}
      />

      <FinalizeModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        stats={stats}
        project={project}
        onLockAndSwitch={async () => {
          setIsLockModalOpen(false)
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
            } catch (err) {}
          }
          await handleSwitchUserRole('incoming_successor')
          setActiveTab('successor')
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
