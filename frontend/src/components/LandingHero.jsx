import React from 'react'
import CyberMatrixBackground from './CyberMatrixBackground'
import {
  Sparkles,
  ArrowRight,
  FileText,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Award,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
  Code2,
} from 'lucide-react'

export default function LandingHero({
  onLaunchDemo,
  onCustomInput,
  onOpenTeamDossier,
}) {
  return (
    <div className="min-h-screen text-neutral-100 flex flex-col font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Interactive Active Theory Cyber Matrix & Knowledge Graph Canvas */}
      <CyberMatrixBackground />

      {/* Laser Radar Scanline */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent animate-scanline" />
      </div>

      {/* 1. Floating Tactical Navigation Bar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-6xl bg-black/75 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-all">
        {/* Logo / Team Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-black border border-cyan-400/60 flex items-center justify-center font-mono font-black text-xs text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider uppercase text-white">
              TEAM APEX CODERS
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-400/30 hidden sm:inline tracking-widest uppercase">
              R2 BUILD
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase text-neutral-400">
          <a
            href="#about"
            className="hover:text-cyan-300 transition-colors"
          >
            // ABOUT
          </a>
          <a
            href="#architecture"
            className="hover:text-cyan-300 transition-colors"
          >
            // ARCHITECTURE
          </a>
          <button
            type="button"
            onClick={onOpenTeamDossier}
            className="hover:text-rose-300 transition-colors"
          >
            // TEAM_DOSSIER
          </button>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLaunchDemo}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 active:scale-95"
          >
            <span>LAUNCH STUDIO</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-36 sm:pt-44 pb-20 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center text-center space-y-8 relative z-10">
        {/* Tracked Super-Header */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/85 border border-white/10 shadow-[0_0_20px_rgba(0,240,255,0.15)] font-mono text-xs tracking-[0.18em] uppercase text-neutral-400 animate-fade-in-up delay-100">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
          <span>// CODEFRONTIER HACKATHON R2</span>
          <span className="text-neutral-700">&bull;</span>
          <span className="text-rose-400 font-bold">VIT PUNE</span>
        </div>

        {/* Two-Tone Glow Headline */}
        <div className="space-y-1 animate-fade-in-up delay-200">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-heading font-bold tracking-tight uppercase leading-none">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-cyan-100 drop-shadow-[0_0_35px_rgba(0,240,255,0.45)]">
              KNOWLEDGE
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 drop-shadow-[0_0_40px_rgba(255,0,127,0.5)] mt-1 sm:mt-2">
              HANDOVER
            </span>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-cyan-400/90 tracking-[0.18em] uppercase pt-3 font-bold">
            EVIDENCE-LINKED PROJECT TRANSITION PLATFORM
          </p>
        </div>

        {/* Subtitle */}
        <p className="max-w-3xl font-body text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed animate-fade-in-up delay-300">
          Autonomous, evidence-linked project transition engine. Ingest raw notes and ADRs,
          anchor factual claims to exact citations, detect release timeline contradictions,
          and generate audited Day 1 continuation checklists for incoming successors.
        </p>

        {/* Primary Interactive CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 w-full sm:w-auto font-mono text-xs tracking-[0.18em] uppercase animate-fade-in-up delay-400">
          {/* Button 1: Try Live Demo */}
          <button
            type="button"
            onClick={onLaunchDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] text-black font-extrabold transition-all duration-300 active:scale-95 border border-cyan-300 animate-neon-pulse"
          >
            <Zap className="w-4 h-4 fill-current text-black" />
            <span>[ ⚡ TRY LIVE DEMO ]</span>
          </button>

          {/* Button 2: Paste Your Own Handover */}
          <button
            type="button"
            onClick={onCustomInput}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-black/85 hover:bg-white/[0.04] text-neutral-200 hover:text-white font-extrabold transition-all duration-300 active:scale-95 border border-rose-500/50 hover:border-rose-400 hover:shadow-[0_0_30px_rgba(255,0,127,0.45)] animate-rose-pulse"
          >
            <FileText className="w-4 h-4 text-[#ff007f]" />
            <span>[ 📄 PASTE YOUR OWN HANDOVER ]</span>
          </button>
        </div>

        {/* Key Feature Badges Ribbon */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl text-left font-mono animate-fade-in-up delay-500">
          <div className="p-4 rounded-xl bg-black/75 border border-white/10 space-y-1 hover:border-cyan-400/30 transition-all duration-300">
            <span className="text-xs text-cyan-400 font-bold tracking-[0.18em]">// 01</span>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Anchored Citations</div>
            <p className="font-body text-xs text-neutral-400">Every claim cites exact quote & section.</p>
          </div>

          <div className="p-4 rounded-xl bg-black/75 border border-white/10 space-y-1 hover:border-rose-400/30 transition-all duration-300">
            <span className="text-xs text-rose-400 font-bold tracking-[0.18em]">// 02</span>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Conflict Detection</div>
            <p className="font-body text-xs text-neutral-400">Flags conflicting freeze vs launch dates.</p>
          </div>

          <div className="p-4 rounded-xl bg-black/75 border border-white/10 space-y-1 hover:border-amber-400/30 transition-all duration-300">
            <span className="text-xs text-amber-400 font-bold tracking-[0.18em]">// 03</span>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Human Triage</div>
            <p className="font-body text-xs text-neutral-400">Inline editing, redaction & lead approval.</p>
          </div>

          <div className="p-4 rounded-xl bg-black/75 border border-white/10 space-y-1 hover:border-emerald-400/30 transition-all duration-300">
            <span className="text-xs text-emerald-400 font-bold tracking-[0.18em]">// 04</span>
            <div className="text-xs font-bold text-white uppercase tracking-wider">Successor View</div>
            <p className="font-body text-xs text-neutral-400">Filtered checklist with progress tracking.</p>
          </div>
        </div>
      </section>

      {/* 3. About & Problem Statement Section */}
      <section id="about" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10 space-y-10 relative z-10 font-mono">
        <div className="space-y-2">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-cyan-400 font-bold block">
            // PROBLEM_STATEMENT & THESIS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Prevent Critical Knowledge From Leaving With People
          </h2>
          <p className="text-sm text-neutral-300 font-sans max-w-3xl leading-relaxed">
            When an engineer, researcher, or core team member leaves a project, critical context leaves with them.
            Existing documentation fails because decisions are buried across chats, task ownership becomes outdated,
            and unverified AI summaries hallucinate unsupported claims.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase font-mono">1. Unchecked Hallucination</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generic LLMs invent facts without citing evidence. Apex anchors every single extracted claim to an exact text quote from uploaded documents.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase font-mono">2. Undetected Conflicts</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              When ADR files declare an API freeze on Nov 10 but sprint tasks plan launch on Nov 15, Apex automatically catches and highlights the contradiction.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase font-mono">3. Confidentiality Leaks</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Sharing raw files leaks private tokens or unverified gossip. Apex gives reviewers granular redaction toggles before presenting the successor package.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Architecture & Tech Stack Section */}
      <section id="architecture" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10 space-y-8 relative z-10 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.25em] uppercase text-cyan-400 font-bold block">
              // ARCHITECTURAL_PIPELINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Deterministic 5-Stage Transition Engine
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500">
            FASTAPI &bull; REACT VITE &bull; TAILWIND CSS
          </span>
        </div>

        {/* 5-Stage Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { step: '01', title: 'Source Ingest', desc: 'Parses Markdown, text & ADR files preserving section offsets.' },
            { step: '02', title: 'Claim Anchor', desc: 'Heuristic & LLM extraction maps decisions to exact quotes.' },
            { step: '03', title: 'Conflict Engine', desc: 'Identifies milestone clashes and missing owners.' },
            { step: '04', title: 'Lead Triage', desc: 'Inline statement refinement, redaction & batch approval.' },
            { step: '05', title: 'Successor View', desc: 'Audited continuation plan with interactive task progress.' },
          ].map((s) => (
            <div key={s.step} className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2">
              <span className="text-cyan-400 font-bold text-xs tracking-wider">STAGE {s.step}</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">{s.title}</h4>
              <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Team Dossier Section */}
      <section id="team" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10 space-y-8 relative z-10 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-[0.2em] text-rose-300 border border-rose-500/40 bg-rose-950/20 uppercase mb-1">
              <Award className="w-3 h-3 text-[#ff007f]" />
              <span>ROUND 1 TOP 300 SELECTION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Team Apex Coders Leadership
            </h2>
            <p className="text-xs text-neutral-400 font-sans">
              Vishwakarma Institute of Technology (VIT Pune) &bull; Department of Computer Engineering
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenTeamDossier}
            className="text-xs text-cyan-400 hover:text-cyan-300 tracking-wider uppercase font-bold flex items-center gap-1.5 transition"
          >
            <span>[ OPEN EXPANDED DOSSIER ]</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Member Profiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Aayush Patil */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 hover:border-cyan-400/40 transition-all space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black border border-cyan-400/60 flex items-center justify-center text-cyan-300 font-black text-base shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                AP
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Aayush Patil
                </h3>
                <p className="text-xs font-bold text-cyan-400">
                  Team Lead &bull; Frontend Architect
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Responsible for product architecture, Active Theory cyber aesthetic, dual-role triage workflows, client state management, evidence inspection drawers, and hackathon submission lead.
            </p>

            <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 text-[10px]">
              {['React 18', 'Vite', 'Tailwind CSS', 'UX Architecture', 'State Machines'].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-black text-cyan-300 border border-cyan-400/30 font-bold uppercase">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Omkar Patil */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 hover:border-rose-500/40 transition-all space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black border border-rose-500/60 flex items-center justify-center text-rose-300 font-black text-base shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                OP
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Omkar Patil
                </h3>
                <p className="text-xs font-bold text-rose-400">
                  Backend &bull; Data Lead
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Responsible for FastAPI microservices architecture, Pydantic v2 schemas, heuristic & LLM extraction pipelines, evidence citation anchoring, automated contradiction detection, and test suites.
            </p>

            <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5 text-[10px]">
              {['Python 3.13', 'FastAPI', 'Pydantic v2', 'PostgreSQL', 'NLP Heuristics'].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-black text-rose-300 border border-rose-500/30 font-bold uppercase">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer CTA Banner */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 text-center space-y-6 font-mono text-xs text-neutral-500 relative z-10">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-lg font-black text-white uppercase tracking-wider">
            Ready to audit and transition project knowledge?
          </h3>
          <button
            type="button"
            onClick={onLaunchDemo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] text-black font-bold uppercase tracking-wider transition active:scale-95"
          >
            <span>LAUNCH KNOWLEDGE STUDIO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-6 text-[10px] tracking-[0.2em] uppercase text-neutral-600">
          // TEAM APEX CODERS &bull; CODEFRONTIER HACKATHON ROUND 2 &bull; ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  )
}

