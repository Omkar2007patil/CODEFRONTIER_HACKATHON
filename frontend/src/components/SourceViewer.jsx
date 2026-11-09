import React, { useEffect, useRef } from 'react'
import { FileText, ExternalLink, Sparkles, X, Code, Terminal } from 'lucide-react'

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
      <div className="h-full bg-black/60 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-600 font-mono text-xs tracking-widest uppercase">
        <Terminal className="w-8 h-8 mb-2 opacity-30 text-cyan-400" />
        <p>// NO_SOURCES_AVAILABLE</p>
      </div>
    )
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
          className={`group flex items-start text-xs font-mono py-0.5 px-4 transition-all duration-150 ${
            isHighlighted
              ? 'bg-[#00f0ff]/15 text-cyan-200 border-l-2 border-[#00f0ff] font-bold shadow-[inset_0_0_15px_rgba(0,240,255,0.2)]'
              : 'hover:bg-white/[0.03] text-neutral-300'
          }`}
        >
          {/* Line number gutter */}
          <span
            className={`select-none w-8 text-right pr-4 text-[10px] font-mono shrink-0 ${
              isHighlighted ? 'text-cyan-400 font-bold' : 'text-neutral-600 group-hover:text-neutral-400'
            }`}
          >
            {lineNum}
          </span>

          {/* Line content */}
          <span className="whitespace-pre-wrap break-all flex-1 font-mono leading-relaxed text-xs">
            {line || ' '}
          </span>

          {isHighlighted && (
            <span className="ml-3 select-none px-2 py-0.5 rounded-sm bg-[#00f0ff] text-black text-xs uppercase font-mono font-bold shrink-0 tracking-[0.18em] shadow-[0_0_8px_#00f0ff]">
              CITATION_ANCHOR
            </span>
          )}
        </div>
      )
    })
  }

  return (
    <div className="h-full flex flex-col bg-black/75 backdrop-blur-xl border border-white/10 hover:border-cyan-400/30 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 relative corner-crosshair">
      {/* File Tabs Header */}
      <div className="bg-white/[0.02] border-b border-white/5 p-2.5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono tracking-[0.18em] transition-all shrink-0 ${
                  isActive
                    ? 'bg-black text-cyan-300 border border-cyan-400/60 font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <span className="text-neutral-600">//</span>
                <span>{src.filename}</span>
                {isHighlightedDoc && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff] animate-ping" title="Citation in document" />
                )}
              </button>
            )
          })}
        </div>

        <div className="text-xs text-neutral-500 font-mono uppercase tracking-[0.18em] hidden sm:block shrink-0 px-2 font-bold">
          [{rawSources.length}_SOURCES]
        </div>
      </div>

      {/* Highlight Active Alert Banner */}
      {highlightedSnippet && (
        <div className="bg-[#00f0ff]/10 border-b border-cyan-400/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 gap-3 animate-fade-in shadow-inner font-mono">
          <div className="flex items-center gap-2 overflow-hidden text-xs tracking-[0.18em]">
            <span className="text-cyan-400 font-bold">// ANCHORED:</span>
            <span className="truncate text-cyan-100 font-body italic text-sm">
              "{highlightedSnippet}"
            </span>
          </div>
          <button
            type="button"
            onClick={onClearHighlight}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-black border border-cyan-400/50 hover:bg-cyan-950 text-cyan-300 text-xs font-mono tracking-[0.18em] font-bold shrink-0 transition"
          >
            <X className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      )}

      {/* Document Code Viewer */}
      <div
        ref={codeContainerRef}
        className="flex-1 overflow-y-auto bg-black py-3 scrollbar-thin font-mono text-xs leading-relaxed"
      >
        {renderDocumentLines()}
      </div>

      {/* Footer Meta */}
      <div className="bg-white/[0.02] border-t border-white/5 px-4 py-2 flex items-center justify-between text-xs text-neutral-400 font-mono tracking-[0.18em]">
        <span className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-neutral-300 font-bold">{activeSource?.filename}</span>
        </span>
        <span className="uppercase text-neutral-500">
          {activeSource?.content?.split('\n').length || 0} LINES &bull;{' '}
          {activeSource?.file_type?.toUpperCase() || 'DOCUMENT'}
        </span>
      </div>
    </div>
  )
}
