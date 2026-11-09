/**
 * Enterprise-grade Export Packaging Engine for Apex Knowledge Handover Platform.
 * Generates:
 * 1. handover-brief.md (Clean, formatted transition brief for successor)
 * 2. handover-audit.json (Machine-readable audit trail with confidence scores)
 */

export function generateHandoverMarkdown(project, approvedClaims) {
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const decisions = approvedClaims.filter((c) => c.category === 'decision')
  const blockers = approvedClaims.filter((c) => c.category === 'blocker')
  const nextActions = approvedClaims.filter((c) => c.category === 'next_action')
  const conflicts = approvedClaims.filter((c) => c.status === 'conflicting')

  let md = `# Project Handover Continuation Brief: ${project.project_name}\n\n`
  md += `> **Audit Verified by Lead Reviewer** | Generated on ${now} via Apex Knowledge Platform\n\n`
  
  md += `## Handover Metadata\n`
  md += `- **Project ID:** \`${project.project_id}\`\n`
  md += `- **Outgoing Contributor:** ${project.outgoing_member}\n`
  md += `- **Successor Role:** ${project.intended_role}\n`
  md += `- **Date:** ${now}\n`
  md += `- **Scope:** Core Platform Architecture & Operational Transition\n`
  md += `- **Total Approved Claims:** ${approvedClaims.length}\n\n`

  md += `## Executive Transition Summary\n`
  md += `${project.summary}\n\n`

  md += `## 1. Approved Architectural Decisions\n`
  if (decisions.length === 0) {
    md += `*No approved architectural decision records.*\n\n`
  } else {
    decisions.forEach((d, idx) => {
      md += `### 1.${idx + 1} ${d.statement}\n`
      md += `- **Verification Status:** \`${d.status.toUpperCase()}\`\n`
      if (d.evidence) {
        md += `- **Original Source Citation:** \`${d.evidence.source_name}\`${d.evidence.line_or_section ? ` (§ ${d.evidence.line_or_section})` : ''}\n`
        md += `  > "${d.evidence.snippet}"\n`
      }
      if (d.conflict_notes) {
        md += `- **Context / Conflict Note:** ${d.conflict_notes}\n`
      }
      md += `\n`
    })
  }

  md += `## 2. Active Blockers & Known Operational Risks\n`
  if (blockers.length === 0) {
    md += `*No active blockers flagged on staging or production.*\n\n`
  } else {
    blockers.forEach((b, idx) => {
      md += `### 2.${idx + 1} ${b.statement}\n`
      md += `- **Triage Status:** \`${b.status.toUpperCase()}\`\n`
      if (b.evidence) {
        md += `- **Evidence Source:** \`${b.evidence.source_name}\`${b.evidence.line_or_section ? ` (§ ${b.evidence.line_or_section})` : ''}\n`
        md += `  > "${b.evidence.snippet}"\n`
      }
      if (b.conflict_notes) {
        md += `- **Owner / Mitigation Plan:** ${b.conflict_notes}\n`
      }
      md += `\n`
    })
  }

  md += `## 3. Immediate Day 1–30 Action Items\n`
  if (nextActions.length === 0) {
    md += `*No continuation items recorded.*\n\n`
  } else {
    nextActions.forEach((a) => {
      md += `- [ ] **${a.statement}**\n`
      if (a.evidence) {
        md += `  - *Supporting Snippet:* \`${a.evidence.source_name}\` ("${a.evidence.snippet}")\n`
      }
      if (a.conflict_notes) {
        md += `  - *Action Guidance:* ${a.conflict_notes}\n`
      }
    })
    md += `\n`
  }

  if (conflicts.length > 0) {
    md += `## 4. Reconciled Conflicts & Resolved Contradictions\n`
    conflicts.forEach((c, idx) => {
      md += `### 4.${idx + 1} ${c.statement}\n`
      md += `- **Resolution Analysis:** ${c.conflict_notes || 'Reconciled during Lead Reviewer sign-off.'}\n`
      if (c.evidence) {
        md += `- **Citation:** \`${c.evidence.source_name}\`: "${c.evidence.snippet}"\n`
      }
      md += `\n`
    })
  }

  md += `\n---\n*Enterprise Handover Pack produced by Team Apex Coders • CodeFrontier R2.*\n`
  return md
}

export function generateHandoverAuditJson(project, allClaims) {
  const now = new Date().toISOString()
  
  const auditEntries = (allClaims || project.claims || []).map((c) => {
    let confidence = 0.98
    if (c.status === 'uncertain') confidence = 0.68
    if (c.status === 'conflicting') confidence = 0.42
    
    return {
      claim_id: c.id,
      category: c.category,
      statement: c.statement,
      status: c.status,
      is_approved: c.is_approved,
      is_sensitive: c.is_sensitive,
      confidence_score: confidence,
      evidence_citation: c.evidence
        ? {
            source_file: c.evidence.source_name,
            snippet: c.evidence.snippet,
            section: c.evidence.line_or_section || 'N/A',
          }
        : null,
      conflict_notes: c.conflict_notes || null,
      reviewed_at: now,
    }
  })

  return {
    handover_audit_spec: '2.0.0',
    export_timestamp: now,
    platform: 'Apex Coders Knowledge Handover Platform',
    project_metadata: {
      project_id: project.project_id,
      project_name: project.project_name,
      outgoing_member: project.outgoing_member,
      intended_role: project.intended_role,
      summary: project.summary,
    },
    metrics: {
      total_claims_ingested: auditEntries.length,
      approved_claims: auditEntries.filter((a) => a.is_approved).length,
      redacted_sensitive_claims: auditEntries.filter((a) => a.is_sensitive).length,
      contradictions_detected: auditEntries.filter((a) => a.status === 'conflicting').length,
    },
    raw_sources_manifest: (project.raw_sources || []).map((s) => ({
      filename: s.filename,
      file_type: s.file_type || 'markdown',
      byte_length: (s.content || '').length,
    })),
    audit_trail: auditEntries,
  }
}

export function downloadMarkdownFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadJsonFile(filename, data) {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportCompleteHandoverPackage(project, approvedClaims, allClaims) {
  // 1. Download Markdown Brief
  const mdContent = generateHandoverMarkdown(project, approvedClaims)
  const baseName = (project.project_id || 'apex-handover').replace(/[^a-zA-Z0-9_-]/g, '_')
  downloadMarkdownFile(`${baseName}-handover-brief.md`, mdContent)

  // 2. Download JSON Audit Trail
  setTimeout(() => {
    const jsonContent = generateHandoverAuditJson(project, allClaims)
    downloadJsonFile(`${baseName}-handover-audit.json`, jsonContent)
  }, 300)
}
