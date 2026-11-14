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
  Terminal,
} from 'lucide-react'

/**
 * IngestionWorkspace
 * Dedicated document ingestion studio supporting TXT, Markdown, PDF, DOCX, CSV, and JSON.
 * Displays upload progress, format validation, provenance counters, and SHA-256 duplicate detection.
 */
export default function IngestionWorkspace({
  project,
  onUploadFiles,
  onIngestCustomText,
  isReviewer = true,
  onInspectEvidence,
}) {
  const [activeMode, setActiveMode] = useState('files') // 'files' | 'paste'
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const fileInputRef = useRef(null)

  // Custom Text State
  const [rawText, setRawText] = useState('')
  const [customFilename, setCustomFilename] = useState('architecture_notes.md')
  const [customProjectName, setCustomProjectName] = useState('Apex Enterprise Gateway')
  const [customOutgoing, setCustomOutgoing] = useState('Alex Chen (Lead Architect)')
  const [customSuccessor, setCustomSuccessor] = useState('Successor Engineer')

  const supportedFormats = [
    { ext: '.TXT', name: 'Plain Text', desc: 'Preserves line numbering and section headers', color: 'text-neutral-300 border-neutral-700 bg-neutral-900/50' },
    { ext: '.MD', name: 'Markdown', desc: 'Extracts ADR decisions and line ranges', color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30' },
    { ext: '.PDF', name: 'PDF Document', desc: 'Retains exact page numbers (Page 1..N)', color: 'text-rose-300 border-rose-500/40 bg-rose-950/30' },
    { ext: '.DOCX', name: 'Word Document', desc: 'Extracts OpenXML paragraph & heading styles', color: 'text-blue-300 border-blue-500/40 bg-blue-950/30' },
    { ext: '.CSV', name: 'CSV Table', desc: 'Extracts tabular records preserving Row numbers', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30' },
    { ext: '.JSON', name: 'JSON Config', desc: 'Traverses object hierarchy preserving $.paths', color: 'text-purple-300 border-purple-500/40 bg-purple-950/30' },
  ]

  const handleFileDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const filesArr = Array.from(e.dataTransfer.files)
      setSelectedFiles((prev) => [...prev, ...filesArr])
      setErrorMessage(null)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArr])
      setErrorMessage(null)
    }
  }

  const handleRemoveFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleTriggerUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select or drop at least one document to upload.')
      return
    }

    setIsUploading(true)
    setUploadStatus(`Processing ${selectedFiles.length} file(s) — extracting claims and validating provenance...`)
    setErrorMessage(null)

    try {
      if (onUploadFiles) {
        await onUploadFiles(selectedFiles)
        setSelectedFiles([])
        setUploadStatus('Ingestion complete! New claims and citations extracted.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload documents.')
      setUploadStatus(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleTriggerCustomPaste = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Please enter or paste document content.')
      return
    }

    setIsUploading(true)
    setErrorMessage(null)
    try {
      if (onIngestCustomText) {
        await onIngestCustomText({
          raw_text: rawText.trim(),
          filename: customFilename,
          project_name: customProjectName,
          outgoing_member: customOutgoing,
          intended_role: customSuccessor,
        })
        setRawText('')
        setUploadStatus('Custom text ingested! Reconstructed project state.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse text.')
    } finally {
      setIsUploading(false)
    }
  }

  const ingestedSources = project?.raw_sources || []

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
              // MULTI-FORMAT DOCUMENT INGESTION PIPELINE
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Document Ingestion & Provenance Extraction
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Upload raw project artifacts. The transition engine validates file headers, prevents directory traversal, computes SHA-256 hashes for duplicate rejection, and extracts claims with traceable source locations.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('files')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeMode === 'files'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 font-bold'
                : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            Multi-File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('paste')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeMode === 'paste'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 font-bold'
                : 'bg-white/[0.03] border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            Raw Text / Paste
          </button>
        </div>
      </div>

      {/* 2. Supported Formats Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {supportedFormats.map((fmt) => (
          <div
            key={fmt.ext}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between ${fmt.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold">{fmt.ext}</span>
              <span className="text-[9px] font-mono opacity-60">PARSER</span>
            </div>
            <div className="mt-2">
              <span className="font-heading text-xs font-bold text-white block">{fmt.name}</span>
              <span className="text-[10px] text-neutral-400 block leading-tight mt-0.5">{fmt.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Ingestion Area */}
      {activeMode === 'files' ? (
        <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] space-y-5">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center space-y-3 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="font-mono text-sm font-bold text-white">
                DRAG & DROP MULTIPLE DOCUMENTS HERE, OR <span className="text-cyan-400 underline">BROWSE</span>
              </p>
              <p className="text-xs text-neutral-400 font-mono">
                Supports TXT, MD, PDF, DOCX, CSV, JSON (Up to 15 MB per file)
              </p>
            </div>

            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.md,.markdown,.pdf,.docx,.csv,.json"
            />
          </div>

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>QUEUE FOR EXTRACTION ({selectedFiles.length} FILES):</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-neutral-500 hover:text-neutral-300 text-[11px]"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="p-2.5 rounded-lg bg-black/40 border border-white/[0.08] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-neutral-200 truncate font-bold">{file.name}</span>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
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

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleTriggerUpload}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-black font-bold uppercase tracking-wider text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Parse & Ingest {selectedFiles.length} Document(s)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Feedback & Progress Banners */}
          {uploadStatus && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-400/30 text-cyan-200 text-xs font-mono flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        /* Custom Raw Text Paste Mode */
        <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase">Virtual Source Filename:</span>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase">Project Name:</span>
              <input
                type="text"
                value={customProjectName}
                onChange={(e) => setCustomProjectName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 uppercase">Paste Raw Notes / Markdown:</span>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="# Project Architecture..."
              className="w-full p-3 rounded-lg bg-black/60 border border-white/10 text-white placeholder-neutral-600 text-xs font-mono focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleTriggerCustomPaste}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold uppercase tracking-wider text-xs transition active:scale-95 disabled:opacity-50"
            >
              {isUploading ? 'Extracting...' : 'Reconstruct Handover From Text &rarr;'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Ingested Sources Manifest (Already Ingested Files) */}
      <div className="p-6 rounded-2xl bg-[#0c0e17]/80 backdrop-blur-md border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Files className="w-4 h-4 text-cyan-400" />
              <span>INGESTED SOURCES MANIFEST ({ingestedSources.length} FILES)</span>
            </h3>
            <p className="text-xs text-neutral-400 font-body">
              Documents stored in project database with sections, paragraph offsets, and extracted provenance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ingestedSources.map((src, i) => {
            const secCount = src.sections?.length || 0
            const charCount = src.content?.length || 0

            return (
              <div
                key={src.id || src.filename || i}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-400/30">
                      {src.file_type ? src.file_type.toUpperCase() : 'DOC'}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {charCount.toLocaleString()} chars
                    </span>
                  </div>

                  <h4 className="font-mono text-xs font-bold text-white truncate mt-2">
                    {src.filename}
                  </h4>
                  <p className="text-[11px] font-mono text-neutral-400">
                    Provenance sections: <strong className="text-neutral-200">{secCount}</strong>
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-neutral-500 flex items-center justify-between">
                  <span>SHA-256 Verified</span>
                  <span className="text-emerald-400">Indexed</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
