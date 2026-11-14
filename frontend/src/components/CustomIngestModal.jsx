import React, { useState, useRef } from 'react'
import {
  FileText,
  Upload,
  Zap,
  Sparkles,
  X,
  Terminal,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FileType,
  Files,
  Trash2,
} from 'lucide-react'

const SAMPLE_CUSTOM_SNIPPET = `# Architecture Notes & Sprint Review - Apex Core
Date: 2026-11-04
Author: Alex Chen (Departing Lead)

## ADR-005: Event Bus Selection
### Status: Accepted
We evaluated RabbitMQ vs Kafka for internal event dispatching. RabbitMQ is selected for audit event routing due to low operational overhead and reliable dead-letter exchange support.

## Critical Staging Blocker
- STAGING INCIDENT: Auth token verification times out under sustained load (APEX-502).
- Owner: UNASSIGNED. Ticket logged as APEX-502.

## Next Actions
- Step 1: Deploy RabbitMQ broker on staging cluster.
- Step 2: Audit JWT token expiration settings.`

export default function CustomIngestModal({
  isOpen,
  onClose,
  onIngestCustomText,
  onUploadFiles,
  projectId = 'apex-core-2026',
}) {
  const [activeTab, setActiveTab] = useState('files') // 'files' | 'paste'
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  // Text paste state
  const [projectName, setProjectName] = useState('Apex Enterprise Gateway')
  const [outgoingMember, setOutgoingMember] = useState('Alex Chen (Lead Architect)')
  const [intendedRole, setIntendedRole] = useState('Incoming Full-Stack Engineer')
  const [rawText, setRawText] = useState('')
  const [filename, setFilename] = useState('handover_notes.md')

  if (!isOpen) return null

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
      setUploadError(null)
    }
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one document to upload.')
      return
    }

    setIsProcessing(true)
    setUploadProgress('Uploading and parsing documents (extracting claims & provenance)...')
    setUploadError(null)

    try {
      if (onUploadFiles) {
        await onUploadFiles(selectedFiles)
      }
      onClose()
    } catch (err) {
      setUploadError(`Upload failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
      setUploadProgress(null)
    }
  }

  const handleProcessCustomText = async () => {
    if (!rawText.trim()) {
      setUploadError('Please enter or paste raw document text.')
      return
    }

    setIsProcessing(true)
    setUploadError(null)
    try {
      await onIngestCustomText({
        project_name: projectName,
        outgoing_member: outgoingMember,
        intended_role: intendedRole,
        raw_text: rawText,
        filename: filename || 'handover_notes.md',
      })
      onClose()
    } catch (err) {
      setUploadError(`Error extracting claims: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-[#050507] border border-white/10 hover:border-cyan-400/40 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.18)] overflow-hidden my-auto transition-all duration-300 corner-crosshair">
        {/* Top Accent Ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-[#ff007f] shadow-[0_0_10px_#ff007f]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 flex items-start justify-between border-b border-white/10 font-mono">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-bold block">
              // DATA_INGESTION_GATEWAY
            </span>
            <h3 className="text-xl font-heading font-bold text-white tracking-tight uppercase">
              Ingest Multi-Format Knowledge Documents
            </h3>
            <p className="font-body text-xs text-neutral-400 leading-relaxed">
              Upload project documents (TXT, MD, PDF, DOCX, CSV, JSON) to extract evidence-linked claims and detect cross-document contradictions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition font-mono text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex items-center gap-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'files'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Files className="w-4 h-4" />
            <span>Multi-File Upload (PDF, DOCX, CSV, TXT, JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'paste'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Direct Text / Markdown Paste</span>
          </button>
        </div>

        {/* Error / Feedback Banner */}
        {uploadError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Tab 1: Multi-File Upload */}
        {activeTab === 'files' && (
          <div className="p-6 space-y-5">
            {/* Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 bg-white/[0.02] hover:bg-cyan-500/[0.03] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.markdown,.pdf,.docx,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="text-white font-mono text-sm font-bold uppercase tracking-wider">
                Click or Drop Project Files Here
              </h4>
              <p className="text-neutral-400 font-body text-xs mt-1">
                Supported formats: <strong className="text-cyan-300">TXT, Markdown, PDF, DOCX, CSV, JSON</strong> (up to 15MB each)
              </p>
              <p className="text-neutral-500 font-mono text-[10px] mt-2">
                // AUTOMATIC_PAGE_LINE_ROW_PROVENANCE_INDEXING
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Selected Documents ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-neutral-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileType className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate font-semibold text-white">{file.name}</span>
                        <span className="text-[10px] text-neutral-500">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingestion Submit */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-mono text-neutral-400 hover:text-white bg-white/[0.03] border border-white/10"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isProcessing || selectedFiles.length === 0}
                onClick={handleUploadSubmit}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 text-black font-mono font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 transition active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-3.5 h-3.5 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>INGEST & EXTRACT CLAIMS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Text Paste */}
        {activeTab === 'paste' && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Outgoing Member
                </label>
                <input
                  type="text"
                  value={outgoingMember}
                  onChange={(e) => setOutgoingMember(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono uppercase text-neutral-400">
                  Raw Documentation / Notes
                </label>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_CUSTOM_SNIPPET)}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                >
                  Insert Sample Snippet
                </button>
              </div>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste architectural notes, ADRs, meeting logs, or sprint tasks here..."
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-mono text-neutral-400 hover:text-white bg-white/[0.03] border border-white/10"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isProcessing || !rawText.trim()}
                onClick={handleProcessCustomText}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 text-black font-mono font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-50 transition active:scale-95"
              >
                {isProcessing ? 'PARSING...' : 'EXTRACT CLAIMS'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
