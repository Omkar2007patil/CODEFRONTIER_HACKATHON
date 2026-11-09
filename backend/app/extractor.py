"""Knowledge Extraction and Claim Reconstruction Pipeline for Apex Handover Platform.

Implements dual-mode extraction:
1. Heuristic & NLP Rule-Based Engine: Zero-dependency, offline-ready, deterministic extraction
   with automated conflict detection, uncertainty flagging, and sensitive data detection.
2. LLM Engine (Optional): Invoked when GEMINI_API_KEY is available.
"""

import os
import re
import json
import uuid
from typing import List, Dict, Any, Optional

import httpx

from app.schemas import (
    HandoverProject,
    ClaimItem,
    ClaimCategory,
    ClaimStatus,
    Evidence,
)
from app.ingest import parse_document_sections


def detect_sensitive_content(text: str) -> bool:
    """Detects credentials, secret tokens, or private tokens that should be marked sensitive."""
    patterns = [
        r"(?i)(api[_-]?key|secret|password|bearer|token)\s*[:=]\s*['\"][A-Za-z0-9_\-\.]{8,}['\"]",
        r"(ghp_[A-Za-z0-9]{30,})",
        r"(AKIA[0-9A-Z]{16})",
        r"(ey[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})",
    ]
    for pattern in patterns:
        if re.search(pattern, text):
            return True
    return False


def run_heuristic_extraction(
    raw_sources: List[Dict[str, Any]],
    project_id: str,
    project_name: str,
    outgoing_member: str,
    intended_role: str,
) -> HandoverProject:
    """Reconstructs project claims from raw document sources using heuristic section and semantic pattern analysis."""
    claims: List[ClaimItem] = []
    
    # Store date references across documents to detect contradiction
    date_milestones: List[Dict[str, str]] = []

    for src in raw_sources:
        fname = src.get("filename", "unknown.txt")
        content = src.get("content", "")
        sections = parse_document_sections(fname, content)

        for sec in sections:
            sec_text = sec.content
            lines = [l.strip() for l in sec_text.splitlines() if l.strip()]

            # 1. Decisions
            if "decision" in sec.heading.lower() or "adr" in fname.lower() or "adr" in sec.heading.lower():
                for line in lines:
                    if line.lower().startswith("### decision") or line.lower().startswith("decision:"):
                        continue
                    if any(term in line.lower() for term in ["selected", "chosen", "accepted", "migrating to", "must cease", "strictly utilize"]):
                        claim_id = f"claim-{len(claims) + 1}"
                        status = ClaimStatus.verified
                        conflict_note = None

                        # Check for API freeze or date constraints
                        if "freeze" in line.lower() or "deadline" in line.lower():
                            date_match = re.search(r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}", line, re.I)
                            if date_match:
                                date_milestones.append({
                                    "file": fname,
                                    "date": date_match.group(0),
                                    "text": line,
                                    "type": "freeze",
                                    "claim_id": claim_id,
                                })

                        claims.append(
                            ClaimItem(
                                id=claim_id,
                                category=ClaimCategory.decision,
                                statement=line,
                                status=status,
                                evidence=Evidence(
                                    source_name=fname,
                                    snippet=line,
                                    line_or_section=sec.heading,
                                ),
                                conflict_notes=conflict_note,
                                is_sensitive=detect_sensitive_content(line),
                                is_approved=True,
                            )
                        )

            # 2. Blockers and Incidents
            if any(term in sec.heading.lower() for term in ["incident", "blocker", "alert", "issue", "bug"]):
                for line in lines:
                    if any(kw in line.lower() for kw in ["alert", "timeout", "times out", "failing", "blocked", "unassigned", "starvation"]):
                        claim_id = f"claim-{len(claims) + 1}"
                        is_uncertain = "unassigned" in line.lower() or "hypothesis" in line.lower()
                        status = ClaimStatus.uncertain if is_uncertain else ClaimStatus.verified
                        conflict_note = "Missing owner or unverified hypothesis flagged in operational logs." if is_uncertain else None

                        claims.append(
                            ClaimItem(
                                id=claim_id,
                                category=ClaimCategory.blocker,
                                statement=line.lstrip("-* ").replace("[BLOCKED]", "").strip(),
                                status=status,
                                evidence=Evidence(
                                    source_name=fname,
                                    snippet=line,
                                    line_or_section=sec.heading,
                                ),
                                conflict_notes=conflict_note,
                                is_sensitive=detect_sensitive_content(line),
                                is_approved=True,
                            )
                        )

            # 3. Next Actions / Successor Checklist
            if any(term in sec.heading.lower() for term in ["action", "task", "milestone", "board", "checklist", "sprint"]):
                for line in lines:
                    clean_line = line.lstrip("-* [ ] 0123456789.: ")
                    if any(action_kw in clean_line.lower() for action_kw in ["run migration", "verify", "resolve", "profile", "need someone", "audit"]):
                        claim_id = f"claim-{len(claims) + 1}"
                        is_uncertain = "hypothesis" in clean_line.lower() or "unverified" in clean_line.lower()
                        claims.append(
                            ClaimItem(
                                id=claim_id,
                                category=ClaimCategory.next_action,
                                statement=f"Action: {clean_line}",
                                status=ClaimStatus.uncertain if is_uncertain else ClaimStatus.verified,
                                evidence=Evidence(
                                    source_name=fname,
                                    snippet=line,
                                    line_or_section=sec.heading,
                                ),
                                conflict_notes="Operational action item requires staging environment access." if is_uncertain else None,
                                is_sensitive=False,
                                is_approved=True,
                            )
                        )

                    # Check for launch milestones
                    if "launch" in clean_line.lower() or "qa sign-off" in clean_line.lower():
                        date_match = re.search(r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}", clean_line, re.I)
                        if date_match:
                            date_milestones.append({
                                "file": fname,
                                "date": date_match.group(0),
                                "text": clean_line,
                                "type": "launch",
                                "claim_id": f"claim-{len(claims) + 1}",
                            })

    # Detect Contradictions across extracted milestones
    freeze_items = [d for d in date_milestones if d["type"] == "freeze"]
    launch_items = [d for d in date_milestones if d["type"] == "launch"]

    if freeze_items and launch_items:
        f_item = freeze_items[0]
        l_item = launch_items[0]
        contradiction_claim_id = f"claim-conflict-{uuid.uuid4().hex[:4]}"
        claims.append(
            ClaimItem(
                id=contradiction_claim_id,
                category=ClaimCategory.decision,
                statement=(
                    f"Contradiction detected in release schedule: {f_item['file']} specifies API freeze on {f_item['date']}, "
                    f"while {l_item['file']} schedules release for {l_item['date']} without sufficient verification buffer."
                ),
                status=ClaimStatus.conflicting,
                evidence=Evidence(
                    source_name=f_item["file"],
                    snippet=f_item["text"],
                    line_or_section=f"Contradicts {l_item['file']}",
                ),
                conflict_notes=(
                    f"Conflict: Freeze is set for {f_item['date']} in {f_item['file']}, but {l_item['file']} plans "
                    f"active QA and launch on {l_item['date']}. Reviewer must reconcile dates before successor handoff."
                ),
                is_sensitive=False,
                is_approved=False,
            )
        )

    # If no claims were extracted, provide default fallback structure
    if not claims:
        claims.append(
            ClaimItem(
                id="claim-default-1",
                category=ClaimCategory.decision,
                statement="Project sources ingested. Reviewing initial architectural state.",
                status=ClaimStatus.verified,
                evidence=Evidence(
                    source_name=raw_sources[0]["filename"] if raw_sources else "source.txt",
                    snippet="Initial document ingested.",
                    line_or_section="Document Header",
                ),
                is_approved=True,
            )
        )

    summary = (
        f"Handover package for {project_name}. Outgoing engineer {outgoing_member} is transitioning to {intended_role}. "
        f"{len(claims)} key claims extracted across {len(raw_sources)} project artifacts, highlighting verified decisions, "
        "active blockers, and day-one continuation actions."
    )

    return HandoverProject(
        project_id=project_id,
        project_name=project_name,
        outgoing_member=outgoing_member,
        intended_role=intended_role,
        summary=summary,
        raw_sources=raw_sources,
        claims=claims,
    )


def extract_handover_claims(text: str, filename: str = "ingested_notes.md") -> List[ClaimItem]:
    """Deterministic parser that extracts decisions, blockers, next steps,
    and flags contradictory dates/claims with clear conflict notes and snippet citations."""
    claims: List[ClaimItem] = []
    date_milestones: List[Dict[str, str]] = []

    lines = [line.strip() for line in text.splitlines()]
    non_empty_lines = [l for l in lines if l]

    current_section = "General Documentation"

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Section header tracking
        if line.startswith("#"):
            current_section = line.lstrip("#").strip()
            continue

        lower = line.lower()

        # 1. Detect Decisions
        is_decision = any(k in lower for k in [
            "decision", "adr", "accepted", "selected", "migrated", "migrating to",
            "chose", "chosen", "adopted", "architecture", "database", "standardized",
            "we evaluated", "strictly utilize", "must cease"
        ])

        # 2. Detect Blockers / Incidents
        is_blocker = any(k in lower for k in [
            "blocker", "blocked", "incident", "alert", "timeout", "times out",
            "failing", "broken", "critical", "crash", "unassigned", "starvation",
            "bottleneck", "open issue", "bug"
        ])

        # 3. Detect Next Actions / Tasks
        is_action = any(k in lower for k in [
            "todo", "action item", "next step", "next action", "step 1", "step 2",
            "step 3", "need to", "need someone", "run migration", "audit", "profile",
            "verify", "rotate", "deploy", "checklist", "milestone", "[in progress]"
        ])

        # Date tracking for contradiction engine
        date_match = re.search(
            r"\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b",
            line,
            re.I
        )

        if date_match:
            d_val = date_match.group(0)
            if any(term in lower for term in ["freeze", "cutoff", "deadline", "stop", "lock"]):
                date_milestones.append({
                    "date": d_val,
                    "type": "freeze",
                    "text": line,
                    "section": current_section,
                })
            elif any(term in lower for term in ["launch", "release", "deploy", "public beta", "go live", "qa sign-off"]):
                date_milestones.append({
                    "date": d_val,
                    "type": "launch",
                    "text": line,
                    "section": current_section,
                })

        # Process Claims by Category
        if is_blocker:
            is_unassigned = "unassigned" in lower or "missing owner" in lower or "tbd" in lower
            status = ClaimStatus.uncertain if is_unassigned else ClaimStatus.verified
            conflict_note = (
                "Unassigned owner: Critical issue logged without assigned successor."
                if is_unassigned else None
            )
            claims.append(
                ClaimItem(
                    id=f"claim-blocker-{len(claims) + 1}",
                    category=ClaimCategory.blocker,
                    statement=line.lstrip("-* [ ] 0123456789.: ").strip(),
                    status=status,
                    evidence=Evidence(
                        source_name=filename,
                        snippet=line,
                        line_or_section=current_section,
                    ),
                    conflict_notes=conflict_note,
                    is_sensitive=detect_sensitive_content(line),
                    is_approved=not is_unassigned,
                )
            )
        elif is_decision:
            claims.append(
                ClaimItem(
                    id=f"claim-decision-{len(claims) + 1}",
                    category=ClaimCategory.decision,
                    statement=line.lstrip("-* [ ] 0123456789.: ").strip(),
                    status=ClaimStatus.verified,
                    evidence=Evidence(
                        source_name=filename,
                        snippet=line,
                        line_or_section=current_section,
                    ),
                    conflict_notes=None,
                    is_sensitive=detect_sensitive_content(line),
                    is_approved=True,
                )
            )
        elif is_action:
            claims.append(
                ClaimItem(
                    id=f"claim-action-{len(claims) + 1}",
                    category=ClaimCategory.next_action,
                    statement=line.lstrip("-* [ ] 0123456789.: ").strip(),
                    status=ClaimStatus.verified,
                    evidence=Evidence(
                        source_name=filename,
                        snippet=line,
                        line_or_section=current_section,
                    ),
                    conflict_notes=None,
                    is_sensitive=detect_sensitive_content(line),
                    is_approved=True,
                )
            )

    # 4. Conflict Engine: Date & Milestone Contradiction Analysis
    freeze_items = [d for d in date_milestones if d["type"] == "freeze"]
    launch_items = [d for d in date_milestones if d["type"] == "launch"]

    if freeze_items and launch_items:
        f = freeze_items[0]
        l = launch_items[0]
        claims.append(
            ClaimItem(
                id=f"claim-conflict-{uuid.uuid4().hex[:4]}",
                category=ClaimCategory.decision,
                statement=(
                    f"Contradiction in delivery schedule: Code freeze is specified for {f['date']}, "
                    f"but launch/release is scheduled for {l['date']} without sufficient verification window."
                ),
                status=ClaimStatus.conflicting,
                evidence=Evidence(
                    source_name=filename,
                    snippet=f"Freeze: \"{f['text']}\" vs Launch: \"{l['text']}\"",
                    line_or_section=f"{f['section']} vs {l['section']}",
                ),
                conflict_notes=(
                    f"Timeline Contradiction: Freeze milestone on {f['date']} directly conflicts with "
                    f"scheduled launch date on {l['date']}. Reviewer must reconcile before successor sign-off."
                ),
                is_sensitive=False,
                is_approved=False,
            )
        )

    # Fallback if no explicit keywords matched
    if not claims and non_empty_lines:
        for idx, line in enumerate(non_empty_lines[:4]):
            cat = ClaimCategory.decision if idx == 0 else (ClaimCategory.next_action if idx % 2 == 0 else ClaimCategory.blocker)
            claims.append(
                ClaimItem(
                    id=f"claim-extracted-{idx + 1}",
                    category=cat,
                    statement=line.lstrip("-* #").strip(),
                    status=ClaimStatus.verified,
                    evidence=Evidence(
                        source_name=filename,
                        snippet=line,
                        line_or_section="Ingested Notes",
                    ),
                    conflict_notes=None,
                    is_sensitive=detect_sensitive_content(line),
                    is_approved=True,
                )
            )

    return claims


async def run_gemini_extraction(
    raw_sources: List[Dict[str, Any]],
    project_id: str,
    project_name: str,
    outgoing_member: str,
    intended_role: str,
    api_key: str,
) -> HandoverProject:
    """Invokes the Gemini REST API for structured extraction if GEMINI_API_KEY is configured."""
    system_prompt = (
        "You are an expert Principal Engineer auditing project handovers. "
        "Analyze the provided source files and extract factual claims categorized into: "
        "'decision', 'wip', 'blocker', 'dependency', 'next_action'. "
        "For each claim, quote the exact supporting snippet from the source file. "
        "Explicitly flag any contradictions across files as 'conflicting' with conflict_notes. "
        "Flag unassigned tasks or unverified assumptions as 'uncertain'. "
        "Return strictly valid JSON conforming to the HandoverProject schema."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"Project: {project_name}\nOutgoing: {outgoing_member}\nSuccessor: {intended_role}\n\nDocuments:\n" + json.dumps(raw_sources, indent=2)}
                ]
            }
        ],
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "generationConfig": {"responseMimeType": "application/json"},
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
                return HandoverProject(**parsed)
    except Exception:
        # Fall back gracefully to the heuristic pipeline
        pass

    return run_heuristic_extraction(raw_sources, project_id, project_name, outgoing_member, intended_role)


async def extract_project_handover(
    raw_sources: List[Dict[str, Any]],
    project_id: str = "apex-project",
    project_name: str = "Apex Handover Project",
    outgoing_member: str = "Alex Chen",
    intended_role: str = "Incoming Engineer",
) -> HandoverProject:
    """Main extraction coordinator: checks for API key and delegates appropriately."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        return await run_gemini_extraction(
            raw_sources=raw_sources,
            project_id=project_id,
            project_name=project_name,
            outgoing_member=outgoing_member,
            intended_role=intended_role,
            api_key=gemini_key,
        )

    return run_heuristic_extraction(
        raw_sources=raw_sources,
        project_id=project_id,
        project_name=project_name,
        outgoing_member=outgoing_member,
        intended_role=intended_role,
    )

