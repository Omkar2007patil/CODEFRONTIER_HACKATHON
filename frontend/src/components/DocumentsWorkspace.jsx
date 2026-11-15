import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileText,
  FileCode2,
  FileSpreadsheet,
  FileType,
  Files,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Code2,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Eye,
  File,
} from 'lucide-react'
import SourceViewer from './SourceViewer'

/**
 * DocumentsWorkspace Component
 * Dedicated workspace for multi-format document ingestion, format specs,
 * per-file processing status, duplicate rejection, and source artifact manifest.
 */
export default function DocumentsWorkspace({
  project,
  onUploadFiles,
  onIngestCustomText,
  isReviewer = true,
  onInspectEvidence,
}) {
  const [activeTabMode, setActiveTabMode] = useState('upload') // 'upload' | 'manifest' | 'paste'
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState(null)
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0)
  const [manifestSearch, setManifestSearch] = useState('')
  const fileInputRef = useRef(null)

  // Custom Text State
  const [rawText, setRawText] = useState('')
  const [customFilename, setCustomFilename] = useState('architecture_notes.md')
  const [customProjectName, setCustomProjectName] = useState(project?.project_name || 'Apex Enterprise Gateway')
  const [customOutgoing, setCustomOutgoing] = useState(project?.outgoing_member || 'Alex Chen (Lead Architect)')
  const [customSuccessor, setCustomSuccessor] = useState(project?.intended_role || 'Senior Backend Engineer')

  const supportedFormats = [
    {
      ext: '.TXT',
      name: 'Plain Text',
      desc: 'Runbooks, sprint meeting transcripts, and server shell logs.',
      badge: 'LINE NUMBERED',
      color: 'border-slate-700 bg-slate-900/60 text-slate-300',
    },
    {
      ext: '.MD',
      name: 'Markdown',
      desc: 'Architecture Decision Records (ADRs), RFCs, and repo READMEs.',
      badge: 'SECTION ANCHORED',
      color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
    },
    {
      ext: '.PDF',
      name: 'PDF Documents',
      desc: 'Architecture diagrams, requirements docs, and compliance specs.',
      badge: 'PAGE NUMBERED',
      color: 'border-rose-500/30 bg-rose-950/20 text-rose-300',
    },
    {
      ext: '.DOCX',
      name: 'Word Documents',
      desc: 'Design documents and enterprise specification manuals.',
      badge: 'HEADING PARSED',
      color: 'border-blue-500/30 bg-blue-950/20 text-blue-300',
    },
    {
      ext: '.CSV',
      name: 'CSV Spreadsheets',
      desc: 'Sprint backlogs, Jira ticket dumps, and service dependency tables.',
      badge: 'ROW REFERENCED',
      color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
    },
    {
      ext: '.JSON',
      name: 'JSON Configs',
      desc: 'OpenAPI contracts, environment specs, and architecture manifests.',
      badge: 'KEY-PATH PARSED',
      color: 'border-purple-500/30 bg-purple-950/20 text-purple-300',
    },
  ]

  const rawSources = project?.raw_sources || []

  // File selection validation
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    validateAndAddFiles(files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || [])
    validateAndAddFiles(files)
  }

  const validateAndAddFiles = (newFiles) => {
    const validExtensions = ['.txt', '.md', '.pdf', '.docx', '.csv', '.json']
    const maxSize = 20 * 1024 * 1024 // 20 MB

    const valid = []
    const rejected = []

    newFiles.forEach((file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!validExtensions.includes(ext)) {
        rejected.push(`${file.name} (unsupported format)`)
      } else if (file.size > maxSize) {
        rejected.push(`${file.name} (exceeds 20MB limit)`)
      } else {
        valid.push(file)
      }
    })

    if (rejected.length > 0) {
      alert(`Some files could not be added:\n${rejected.join('\n')}`)
    }

    setSelectedFiles((prev) => [...prev, ...valid])
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleExecuteUpload = async () => {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setUploadFeedback(null)

    try {
      if (onUploadFiles) {
        await onUploadFiles(selectedFiles)
      }
      setUploadFeedback({
        status: 'success',
        message: `Successfully processed and ingested ${selectedFiles.length} document(s). Claims and line citations extracted.`,
      })
      setSelectedFiles([])
      setActiveTabMode('manifest')
    } catch (err) {
      setUploadFeedback({
        status: 'error',
        message: err.message || 'Ingestion failed on backend server.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleExecutePaste = async () => {
    if (!rawText.trim()) return
    setIsUploading(true)
    try {
      if (onIngestCustomText) {
        await onIngestCustomText({
          raw_text: rawText,
          filename: customFilename,
          project_name: customProjectName,
          outgoing_member: customOutgoing,
          intended_role: customSuccessor,
        })
      }
      setUploadFeedback({
        status: 'success',
        message: `Custom document '${customFilename}' parsed successfully.`,
      })
      setRawText('')
      setActiveTabMode('manifest')
    } catch (err) {
      setUploadFeedback({
        status: 'error',
        message: err.message || 'Custom ingestion failed.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Filtered sources for manifest table
  const filteredSources = rawSources.filter((s) => {
    if (!manifestSearch) return true
    return s.filename.toLowerCase().includes(manifestSearch.toLowerCase())
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header & Mode Switcher */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              // ARTIFACT INGESTION & PROVENANCE ENGINE
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Documents & Ingestion Studio
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Ingest raw engineering notes, ADRs, spreadsheets, and specification manuals. The transition engine parses
            structured sections, extracts claims, computes SHA-256 duplicate hashes, and anchors line-level citations.
          </p>
        </div>

        {/* Tab Mode Buttons */}
        <div className="flex items-center bg-[#111728] p-1 rounded-lg border border-[#1e293b] shrink-0 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTabMode('upload')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTabMode === 'upload' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Files
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('manifest')}
            className={`px-3 py-1.5 rounded-md transition font-semibold flex items-center gap-1.5 ${
              activeTabMode === 'manifest' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Manifest ({rawSources.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('paste')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTabMode === 'paste' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Paste Mode
          </button>
        </div>
      </div>

      {/* Upload Feedback Notice */}
      {uploadFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono ${
            uploadFeedback.status === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadFeedback.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{uploadFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadFeedback(null)}
            className="text-[10px] uppercase hover:underline"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* MODE 1: File Upload */}
      {activeTabMode === 'upload' && (
        <div className="space-y-6">
          {/* Supported Format Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {supportedFormats.map((fmt) => (
              <div
                key={fmt.ext}
                className={`p-3.5 rounded-xl border space-y-1.5 flex flex-col justify-between ${fmt.color}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold">{fmt.ext}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-black/40 border border-white/10 uppercase">
                      {fmt.badge}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">{fmt.name}</div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">{fmt.desc}</p>
              </div>
            ))}
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="border-2 border-dashed border-[#1e293b] hover:border-cyan-500/50 bg-[#0c101c] hover:bg-[#111728] p-10 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-white">
                Drag & Drop Multi-Format Documentation Files
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Supports .TXT, .MD, .PDF, .DOCX, .CSV, and .JSON up to 20MB per file
              </p>
            </div>

            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#111728] border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/10 transition"
            >
              Browse Files From Device
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".txt,.md,.pdf,.docx,.csv,.json"
              className="hidden"
            />
          </div>

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <Files className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                    Files Ready for Ingestion ({selectedFiles.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-xs font-mono text-slate-400 hover:text-rose-400"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="p-3 rounded-lg bg-[#111728] border border-[#1e293b] flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <File className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-white font-medium truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(idx)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Parsing & Extracting Citations...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Start Document Ingestion & Extraction</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: Ingested Sources Manifest & Embedded Reader */}
      {activeTabMode === 'manifest' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Manifest Table (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
                Ingested Sources ({rawSources.length})
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">SELECT TO PREVIEW</span>
            </div>

            {/* Manifest Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manifestSearch}
                onChange={(e) => setManifestSearch(e.target.value)}
                placeholder="Search ingested documents..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#111728] border border-[#1e293b] text-xs font-mono text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            {/* Document List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredSources.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-mono text-xs">
                  No ingested documents matching search.
                </div>
              ) : (
                filteredSources.map((source, idx) => {
                  const isSelected = selectedSourceIndex === idx
                  return (
                    <div
                      key={source.id || source.filename || idx}
                      onClick={() => setSelectedSourceIndex(idx)}
                      className={`p-3 rounded-lg border transition cursor-pointer space-y-1 ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm'
                          : 'bg-[#111728] border-[#1e293b] hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-xs font-semibold text-white truncate font-mono">
                            {source.filename}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-400 border border-white/5 uppercase shrink-0">
                          {source.file_type || 'text'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                        <span>{source.content ? `${source.content.split('\n').length} lines` : 'N/A'}</span>
                        <span>{source.sections ? `${source.sections.length} sections` : 'Provenance extracted'}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Embedded IDE Source Viewer (7 Cols) */}
          <div className="lg:col-span-7 h-[680px] sticky top-20">
            <SourceViewer
              rawSources={rawSources}
              activeSourceIndex={selectedSourceIndex}
              setActiveSourceIndex={setSelectedSourceIndex}
              highlightedSnippet={null}
              highlightedSource={null}
              onClearHighlight={() => {}}
            />
          </div>
        </div>
      )}

      {/* MODE 3: Raw Paste Mode */}
      {activeTabMode === 'paste' && (
        <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-5">
          <div className="space-y-1 pb-3 border-b border-[#1e293b]">
            <h3 className="font-heading font-bold text-base text-white uppercase tracking-wider">
              Paste Raw Documentation or Architecture Notes
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Instantly ingest raw Markdown ADRs, handoff notes, or sprint retro text. The extraction engine will
              reconstruct factual claims and cite exact line numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1 uppercase text-[10px]">Document Filename</label>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#111728] border border-[#1e293b] text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 uppercase text-[10px]">Outgoing Author</label>
              <input
                type="text"
                value={customOutgoing}
                onChange={(e) => setCustomOutgoing(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#111728] border border-[#1e293b] text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 uppercase text-[10px]">Successor Role</label>
              <input
                type="text"
                value={customSuccessor}
                onChange={(e) => setCustomSuccessor(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#111728] border border-[#1e293b] text-white focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Document Content (Markdown / Text)</label>
            <textarea
              rows={14}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="# Architecture Notes - Service Migration..."
              className="w-full p-3 rounded-lg bg-[#111728] border border-[#1e293b] text-white font-mono text-xs focus:border-cyan-500/50 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleExecutePaste}
              disabled={!rawText.trim() || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Extract Claims & Provenance</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
