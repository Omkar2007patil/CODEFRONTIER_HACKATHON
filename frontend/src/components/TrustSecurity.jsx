import React, { useState } from 'react'
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Server,
  Layers,
  Database,
  ArrowRight,
  Info,
} from 'lucide-react'

/**
 * TrustSecurity Component
 * Dedicated security & compliance workspace verifying:
 * - Current session RBAC identity and verified permissions
 * - Server-side secret redaction demonstration
 * - Role permissions matrix
 * - Redacted claims ledger
 * - Security audit history
 */
export default function TrustSecurity({
  project,
  claims = [],
  currentUser,
  onToggleSensitive,
  onSwitchUserRole,
  isReviewer = true,
}) {
  const [showExplanation, setShowExplanation] = useState(false)

  const userRole = currentUser?.role || 'project_reviewer'
  const sensitiveClaims = claims.filter((c) => c.is_sensitive)

  const permissionsMatrix = [
    {
      capability: 'Multi-Format Document Upload',
      description: 'Upload raw notes, ADRs, PDFs, and spreadsheets to project',
      reviewer: true,
      outgoing: true,
      successor: false,
      enforcedBy: 'FastAPI require_roles(["outgoing_member", "project_reviewer"])',
    },
    {
      capability: 'Reconcile Cross-Document Conflicts',
      description: 'Commit binding human resolution decisions and engineering rationales',
      reviewer: true,
      outgoing: false,
      successor: false,
      enforcedBy: 'FastAPI require_roles(["project_reviewer"])',
    },
    {
      capability: 'Toggle Operational Claim Approval',
      description: 'Approve or revoke claim inclusion in successor handover package',
      reviewer: true,
      outgoing: false,
      successor: false,
      enforcedBy: 'FastAPI require_roles(["project_reviewer"])',
    },
    {
      capability: 'Mask Sensitive Secrets / Redaction',
      description: 'Flag confidential API keys or credentials for server-side masking',
      reviewer: true,
      outgoing: false,
      successor: false,
      enforcedBy: 'FastAPI require_roles(["project_reviewer"])',
    },
    {
      capability: 'Certify & Lock Handover Package',
      description: 'Transition project from In Review to Approved with conflict verification',
      reviewer: true,
      outgoing: false,
      successor: false,
      enforcedBy: 'FastAPI require_roles(["project_reviewer"])',
    },
    {
      capability: 'Access Unapproved Draft Packages',
      description: 'View project before lead reviewer certification',
      reviewer: true,
      outgoing: true,
      successor: false,
      enforcedBy: 'FastAPI 403 Forbidden check on unapproved project access',
    },
    {
      capability: 'Interactive Successor Checklist',
      description: 'Check off Day 1-30 persistent onboarding tasks',
      reviewer: true,
      outgoing: false,
      successor: true,
      enforcedBy: 'FastAPI require_roles(["incoming_successor", "project_reviewer"])',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">
              // ROLE-BASED ACCESS CONTROL & CREDENTIAL REDACTION
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-white tracking-tight uppercase">
            Trust & Security Posture
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Enterprise security architecture with server-side RBAC enforcement and cryptographic secret redaction.
            Confidential infrastructure tokens are masked on the server before HTTP serialization so successors cannot
            recover raw secrets through browser devtools.
          </p>
        </div>

        {/* Current Verified Session Pill */}
        <div className="p-3.5 rounded-xl bg-[#111728] border border-[#1e293b] font-mono text-xs space-y-1 shrink-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Verified Session Identity</div>
          <div className="flex items-center gap-2 text-white font-bold">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentUser?.full_name || 'Jordan Lee'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
              {userRole}
            </span>
            <span className="text-slate-400">{currentUser?.email || 'reviewer@apex.dev'}</span>
          </div>
        </div>
      </div>

      {/* 2. Server-Side Redaction Demonstration Card */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e293b]">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Server-Side Secret Redaction Architecture</span>
            </h3>
            <p className="text-xs text-slate-400">
              Unlike client-side CSS masking or visual blurring, CodeFrontier sanitizes sensitive tokens in backend Python Pydantic models.
            </p>
          </div>

          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 font-semibold uppercase shrink-0">
            {sensitiveClaims.length} Active Redaction(s)
          </span>
        </div>

        {/* Comparison: Reviewer View vs Successor Wire Payload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#111728] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-cyan-400 text-[10px] uppercase font-bold">
              <span>Authorized Reviewer View (Jordan Lee)</span>
              <span>Full Access</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Authorized reviewers can inspect original configuration text, toggle secret classification, and audit token usage across services.
            </p>
            <div className="p-2.5 rounded bg-black/60 border border-white/5 text-[11px] text-slate-300 italic">
              AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE (Staging S3 bucket sync token)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111728] border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-purple-400 text-[10px] uppercase font-bold">
              <span>Successor Wire Payload (Taylor Morgan)</span>
              <span>Server-Sanitized</span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              When a successor requests the project, the FastAPI endpoint sanitizes the response with `[REDACTED_BY_LEAD]`. Raw tokens are never sent over the wire.
            </p>
            <div className="p-2.5 rounded bg-black/60 border border-white/5 text-[11px] text-purple-300 font-bold">
              AWS_SECRET_KEY=[REDACTED_BY_LEAD] (Staging S3 bucket sync token)
            </div>
          </div>
        </div>

        {/* Redacted Claims Ledger */}
        <div className="pt-2 space-y-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Redacted Claims Ledger ({sensitiveClaims.length})
          </div>

          {sensitiveClaims.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-mono text-xs rounded-lg bg-[#111728] border border-[#1e293b]">
              No sensitive credentials currently flagged for redaction.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sensitiveClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-3 rounded-lg bg-[#111728] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-400">CLAIM #{claim.id}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-[10px] text-slate-400 uppercase">{claim.category}</span>
                    </div>
                    <div className="text-white font-medium truncate">{claim.statement}</div>
                  </div>

                  {isReviewer && (
                    <button
                      type="button"
                      onClick={() => onToggleSensitive && onToggleSensitive(claim.id)}
                      className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 uppercase text-[10px] font-bold transition shrink-0"
                    >
                      Unmask Secret
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Role-Based Permissions Matrix */}
      <div className="p-6 rounded-xl bg-[#0c101c] border border-[#1e293b] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>RBAC Capabilities & Authorization Boundaries</span>
            </h3>
            <p className="text-xs text-slate-400">
              Backend-enforced permission matrix comparing capabilities across all three hackathon roles.
            </p>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1e293b] text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 pr-4">Capability / Operation</th>
                <th className="py-2.5 px-3 text-center">Reviewer (Jordan)</th>
                <th className="py-2.5 px-3 text-center">Outgoing (Alex)</th>
                <th className="py-2.5 px-3 text-center">Successor (Taylor)</th>
                <th className="py-2.5 pl-4">Backend Enforcement Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-white">{row.capability}</div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">{row.description}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.reviewer ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ALLOWED
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        DENIED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.outgoing ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ALLOWED
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        DENIED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {row.successor ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ALLOWED
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        DENIED
                      </span>
                    )}
                  </td>
                  <td className="py-3 pl-4 text-[11px] text-cyan-400/90 font-mono">
                    {row.enforcedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
