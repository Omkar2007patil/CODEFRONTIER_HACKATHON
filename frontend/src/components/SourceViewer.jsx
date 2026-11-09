import React, { useEffect, useRef } from 'react'
import {
  FileText,
  ExternalLink,
  Sparkles,
  X,
  Code2,
  Terminal,
  FileCode2,
  FolderGit2,
  AlignLeft,
} from 'lucide-react'

/**
 * SourceViewer Component
 * Sleek IDE-style source artifact reader with file tabs, line number gutter,
 * and deterministic evidence citation highlighting.
 */
export default function SourceViewer({
  rawSources,
  activeSourceIndex,
  setActiveSourceIndex,
  highlightedSnippet,
  highlightedSource,
  onClearHighlight,
}) {
  const codeContainerRef = useRef(null)
  const highlightedRef = useRef(null)

  const activeSource = rawSources[activeSourceIndex] || rawSources[0]

  // Auto-scroll to highlighted snippet when changed
  useEffect(() => {
    if (highlightedSnippet && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [highlightedSnippet, activeSourceIndex])

  if (!rawSources || rawSources.length === 0) {
    return (
      <div className="h-full bg-[#0c0d14]/75 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-neutral-500 font-mono text-xs tracking-widest uppercase">
        <Terminal className="w-10 h-10 mb-3 opacity-30 text-cyan-400" />
        <p>// NO_SOURCES_INGESTED_YET</p>
      </div>
    )
  }

  // Determine file icon
  const getFileIcon = (filename = '') => {
    if (filename.endsWith('.md')) return <FileText className="w-3.5 h-3.5 text-cyan-400" />
    if (filename.endsWith('.json')) return <Code2 className="w-3.5 h-3.5 text-rose-400" />
    if (filename.endsWith('.py') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
      return <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
    }
    return <AlignLeft className="w-3.5 h-3.5 text-neutral-400" />
  }

  // Split content into lines and check for snippet match
  const renderDocumentLines = () => {
    if (!activeSource || !activeSource.content) return null

    const lines = activeSource.content.split('\n')
    const cleanSnippet = (highlightedSnippet || '').trim()
    const isMatchingSource =
      highlightedSource &&
      (highlightedSource === activeSource.filename ||
        activeSource.filename.includes(highlightedSource) ||
        highlightedSource.includes(activeSource.filename))

    return lines.map((line, idx) => {
      const lineNum = idx + 1
      const isHighlighted =
        isMatchingSource &&
        cleanSnippet.length > 5 &&
        (line.includes(cleanSnippet) ||
          cleanSnippet.includes(line.trim()) ||
          (line.trim().length > 15 && cleanSnippet.toLowerCase().includes(line.trim().toLowerCase())))

      return (
        <div
          key={lineNum}
          ref={isHighlighted ? highlightedRef : null}
          className={`group flex items-start text-xs font-mono py-1 px-4 transition-all duration-150 ${
            isHighlighted
              ? 'bg-[#00f0ff]/15 text-cyan-200 border-l-2 border-[#00f0ff] font-bold shadow-[inset_0_0_15px_rgba(0,240,255,0.2)]'
              : 'hover:bg-white/[0.03] text-neutral-300'
          }`}
        >
          {/* Line number gutter */}
          <span
            className={`select-none w-9 text-right pr-4 text-[11px] font-mono shrink-0 ${
              isHighlighted
                ? 'text-cyan-400 font-bold'
                : 'text-neutral-600 group-hover:text-neutral-400'
            }`}
          >
            {lineNum}
          </span>

          {/* Line content */}
          <span className="whitespace-pre-wrap break-all flex-1 font-mono leading-relaxed text-xs">
            {line || ' '}
          </span>

          {isHighlighted && (
            <span className="ml-3 select-none px-2 py-0.5 rounded-sm bg-[#00f0ff] text-black text-[10px] uppercase font-mono font-bold shrink-0 tracking-[0.18em] shadow-[0_0_8px_#00f0ff]">
              CITATION_ANCHOR
            </span>
          )}
        </div>
      )
    })
  }

  return (
    <div className="h-full flex flex-col bg-[#08090f]/90 backdrop-blur-2xl border border-white/10 hover:border-cyan-400/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* IDE Window Bar with Decorative Dots & Tab Bar */}
      <div className="bg-[#050507] border-b border-white/10 px-3 pt-2.5 flex items-center justify-between gap-3 overflow-x-auto">
        
        {/* Left: Window Dots & Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto">
          {/* 3 Muted Window Dots */}
          <div className="hidden sm:flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>

          {/* Document Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {rawSources.map((src, idx) => {
              const isActive = idx === activeSourceIndex
              const isHighlightedDoc =
                highlightedSource &&
                (src.filename === highlightedSource ||
                  src.filename.includes(highlightedSource) ||
                  highlightedSource.includes(src.filename))

              return (
                <button
                  key={src.filename || idx}
                  type="button"
                  onClick={() => setActiveSourceIndex(idx)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg text-xs font-mono tracking-wider transition-all shrink-0 border-t-2 ${
                    isActive
                      ? 'bg-[#0c0d14] text-cyan-300 border-t-[#00f0ff] border-x border-x-white/10 font-bold shadow-[0_-2px_10px_rgba(0,240,255,0.15)]'
                      : 'bg-transparent text-neutral-400 hover:text-neutral-200 border-t-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  {getFileIcon(src.filename)}
                  <span className="truncate max-w-[140px]">{src.filename}</span>
                  {isHighlightedDoc && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff] animate-ping"
                      title="Citation anchored in this artifact"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Sources Count Badge */}
        <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-[0.2em] hidden sm:block shrink-0 px-2 font-bold">
          [{rawSources.length}_ARTIFACTS]
        </div>
      </div>

      {/* Sub-Header IDE File Breadcrumb */}
      <div className="bg-[#0c0d14]/60 border-b border-white/5 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-neutral-400 tracking-wider">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">// ARTIFACT:</span>
          <span className="text-neutral-200 font-semibold">{activeSource?.filename}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase">
          <span>UTF-8</span>
          <span>&bull;</span>
          <span>{activeSource?.content?.split('\n').length || 0} LINES</span>
        </div>
      </div>

      {/* Highlight Active Alert Banner */}
      {highlightedSnippet && (
        <div className="bg-[#00f0ff]/10 border-b border-cyan-400/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 gap-3 animate-fade-in font-mono">
          <div className="flex items-center gap-2 overflow-hidden text-xs tracking-[0.16em]">
            <span className="text-cyan-400 font-bold shrink-0">// ANCHOR:</span>
            <span className="truncate text-cyan-100 font-body italic text-sm">
              "{highlightedSnippet}"
            </span>
          </div>
          <button
            type="button"
            onClick={onClearHighlight}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/90 border border-cyan-400/50 hover:bg-cyan-950 text-cyan-300 text-xs font-mono tracking-[0.16em] font-bold shrink-0 transition"
          >
            <X className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      )}

      {/* Document Code Viewer */}
      <div
        ref={codeContainerRef}
        className="flex-1 overflow-y-auto bg-[#050508] py-3 scrollbar-thin font-mono text-xs leading-relaxed"
      >
        {renderDocumentLines()}
      </div>

      {/* Footer IDE Status Bar */}
      <div className="bg-[#050507] border-t border-white/10 px-4 py-1.5 flex items-center justify-between text-[10px] text-neutral-400 font-mono tracking-[0.18em]">
        <span className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-cyan-400" />
          <span className="text-neutral-400">READY</span>
          <span className="text-neutral-600">&bull;</span>
          <span className="text-neutral-400 uppercase">{activeSource?.file_type || 'SOURCE'}</span>
        </span>
        <span className="uppercase text-neutral-500">
          DETERMINISTIC_CITATIONS_ENABLED
        </span>
      </div>

    </div>
  )
}
