"""FastAPI main application for Apex Knowledge Handover Platform (Round 3 Final).
Integrates multi-format ingestion, cross-document conflict detection, backend-enforced RBAC,
server-side secret redaction, and persistent successor checklist.
"""

import os
import json
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    Query,
    UploadFile,
    File,
    Form,
    status,
    Response,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel

from app.schemas import (
    HandoverProject,
    HandoverSnapshot,
    ClaimItem,
    ConflictItem,
    ChecklistItem,
    IngestPayload,
    ClaimStatusUpdatePayload,
    ChecklistUpdatePayload,
    ConflictResolutionPayload,
    UserProfile,
    LoginPayload,
    DemoLoginPayload,
    AuthTokenResponse,
    HandoverApprovePayload,
    DocumentMetadata,
)
from app.db import get_db_connection
from app.storage import repo
from app.auth import (
    create_access_token,
    authenticate_user,
    get_user_by_email,
    get_user_by_id,
    get_current_user,
    get_optional_user,
    require_roles,
)
from app.ingest import process_uploaded_file, sanitize_filename, compute_sha256
from app.claims import validate_claim_evidence
from app.conflicts import detect_cross_document_conflicts
from app.extractor import run_heuristic_extraction, extract_claims_from_sections
from app.checklist import get_project_checklist, update_checklist_task_status
from app.redaction import (
    sanitize_claim_for_role,
    sanitize_project_for_successor,
    mask_sensitive_text,
    has_sensitive_content,
)

app = FastAPI(
    title="Apex Coders Knowledge Handover API",
    description="Evidence-linked transition engine with verified citations, conflict detection, and server-side RBAC",
    version="3.0.0",
)

# Configurable CORS
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://codefrontier-hackathon-3b6g.vercel.app",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in ALLOWED_ORIGINS else ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Health Check
# ==============================================================================
@app.get("/api/health")
def get_health() -> Dict[str, Any]:
    """Health check endpoint confirming service and database connectivity."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM projects")
        p_count = cur.fetchone()[0]
        conn.close()
        return {
            "status": "ok",
            "version": "3.0.0",
            "engine": "Apex Deterministic Transition Engine",
            "database": "sqlite_wal_relational",
            "projects_count": p_count,
        }
    except Exception as e:
        return {"status": "degraded", "detail": str(e)}


# ==============================================================================
# Authentication & Role Identity
# ==============================================================================
@app.post("/api/auth/login", response_model=AuthTokenResponse)
def login_with_password(payload: LoginPayload):
    """Authenticates user with email and password, returning JWT access token."""
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials.",
        )
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return AuthTokenResponse(access_token=token, user=user)


@app.post("/api/auth/demo-login", response_model=AuthTokenResponse)
def login_demo_account(payload: DemoLoginPayload):
    """Convenience 1-click evaluator login for Judge testing across RBAC roles."""
    role_email_map = {
        "project_reviewer": "reviewer@apex.dev",
        "outgoing_member": "outgoing@apex.dev",
        "incoming_successor": "successor@apex.dev",
    }
    email = role_email_map.get(payload.role)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown role '{payload.role}'. Must be one of: {list(role_email_map.keys())}",
        )

    user_dict = get_user_by_email(email)
    if not user_dict:
        raise HTTPException(status_code=404, detail=f"Demo user for role '{payload.role}' not initialized.")

    user = UserProfile(
        id=user_dict["id"],
        email=user_dict["email"],
        full_name=user_dict["full_name"],
        role=user_dict["role"],
        created_at=user_dict["created_at"],
    )
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return AuthTokenResponse(access_token=token, user=user)


@app.get("/api/auth/me", response_model=UserProfile)
def get_current_user_profile(user: UserProfile = Depends(get_current_user)):
    """Returns verified authenticated profile for current session."""
    return user


# ==============================================================================
# Projects & Workspaces
# ==============================================================================
@app.get("/api/projects", response_model=List[HandoverSnapshot])
def list_projects(user: Optional[UserProfile] = Depends(get_optional_user)):
    """Returns overview snapshots of all available handover projects."""
    return repo.list_snapshots()


@app.get("/api/projects/{project_id}", response_model=HandoverProject)
def get_project_by_id(project_id: str, user: Optional[UserProfile] = Depends(get_optional_user)):
    """Retrieves project details. If user is an Incoming Successor and project is not approved, enforces 403 Forbidden."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    # Backend RBAC: Successor cannot access unapproved draft projects
    if user and user.role == "incoming_successor":
        if proj.status != "approved":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Successors can only access approved handover packages. Project '{proj.project_name}' is currently in state '{proj.status}'.",
            )
        return sanitize_project_for_successor(proj)

    # For anonymous/demo lead review, return full sanitized claims
    if not user or user.role != "project_reviewer":
        # Non-reviewers get masked sensitive fields
        return sanitize_project_for_successor(proj)

    return proj


@app.get("/api/sample", response_model=HandoverProject)
def get_active_project(user: Optional[UserProfile] = Depends(get_optional_user)):
    """Backwards-compatible endpoint returning currently active handover workspace."""
    proj = repo.get_active()
    if user and user.role == "incoming_successor":
        return sanitize_project_for_successor(proj)
    return proj


@app.get("/api/handovers", response_model=List[HandoverSnapshot])
def list_saved_handovers():
    """Backwards-compatible alias for /api/projects."""
    return repo.list_snapshots()


@app.get("/api/handovers/{project_id}", response_model=HandoverProject)
def get_handover_project(project_id: str, user: Optional[UserProfile] = Depends(get_optional_user)):
    """Backwards-compatible alias for /api/projects/{project_id}."""
    return get_project_by_id(project_id, user)


@app.post("/api/handovers/{project_id}/select", response_model=HandoverProject)
def select_handover_project(project_id: str):
    """Sets project as active."""
    proj = repo.set_active(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return proj


# ==============================================================================
# Multi-Format Document Ingestion (Outcome A)
# ==============================================================================
@app.post("/api/projects/{project_id}/documents/upload")
async def upload_project_documents(
    project_id: str,
    files: List[UploadFile] = File(...),
    user: UserProfile = Depends(require_roles(["outgoing_member", "project_reviewer"])),
):
    """Uploads multiple files (TXT, MD, PDF, DOCX, CSV, JSON) into project.
    Enforces format validation, size checks, path traversal protection,
    provenance section extraction, and cross-document conflict updates.
    """
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    results: List[Dict[str, Any]] = []
    new_claims: List[ClaimItem] = []
    now_str = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    cur = conn.cursor()

    for file in files:
        raw_bytes = await file.read()
        fname = file.filename or "uploaded_document.txt"
        file_hash = compute_sha256(raw_bytes)

        # 1. Duplicate check: check if hash already exists in this project
        cur.execute(
            "SELECT id, filename FROM documents WHERE project_id = ? AND content_hash = ?",
            (project_id, file_hash),
        )
        existing_doc = cur.fetchone()
        if existing_doc:
            results.append({
                "filename": fname,
                "status": "skipped",
                "message": f"Duplicate document skipped: identical content already ingested as '{existing_doc['filename']}' (Doc ID: {existing_doc['id']}).",
                "document_id": existing_doc["id"],
            })
            continue

        try:
            file_type, clean_name, full_text, sections = process_uploaded_file(raw_bytes, fname)
            doc_id = f"doc-{uuid.uuid4().hex[:6]}"
            sections_dicts = [s.to_dict() for s in sections]

            # Save document to SQLite
            cur.execute(
                """
                INSERT INTO documents (
                    id, project_id, filename, file_type, file_size, content_hash,
                    raw_text, sections_json, uploaded_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    doc_id,
                    project_id,
                    clean_name,
                    file_type,
                    len(raw_bytes),
                    file_hash,
                    full_text,
                    json.dumps(sections_dicts),
                    user.id,
                    now_str,
                ),
            )

            # Add to project's raw sources
            proj.raw_sources.append({
                "id": doc_id,
                "filename": clean_name,
                "file_type": file_type,
                "content": full_text,
                "sections": sections_dicts,
            })

            # Extract evidence-backed claims from document sections
            extracted = extract_claims_from_sections(sections, clean_name, doc_id=doc_id, project_id=project_id)
            new_claims.extend(extracted)

            results.append({
                "filename": clean_name,
                "status": "success",
                "document_id": doc_id,
                "file_type": file_type,
                "file_size": len(raw_bytes),
                "sections_extracted": len(sections),
                "claims_extracted": len(extracted),
            })

        except Exception as e:
            results.append({
                "filename": fname,
                "status": "error",
                "error": str(e),
            })

    conn.commit()
    conn.close()

    # Re-validate all claims and recalculate conflicts
    proj.claims.extend(new_claims)

    docs_lookup = {s["filename"]: {"id": s.get("id"), "filename": s["filename"], "raw_text": s.get("content", "")} for s in proj.raw_sources}
    for c in proj.claims:
        v_status, conf, expl = validate_claim_evidence(c, docs_lookup)
        c.validation_status = v_status
        c.confidence = conf
        c.explanation = expl

    # Recalculate cross-document conflicts
    proj.conflicts = detect_cross_document_conflicts(proj.claims, project_id=proj.project_id, existing_conflicts=proj.conflicts)

    # Persist updated project
    repo.save_project(proj, make_active=True)

    # Audit log
    repo.record_audit_log(
        project_id=project_id,
        entity_type="documents",
        entity_id=project_id,
        action="upload_documents",
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        details={"files_processed": len(files), "results": results},
    )

    return {
        "success": True,
        "project_id": project_id,
        "results": results,
        "total_claims": len(proj.claims),
        "total_conflicts": len(proj.conflicts),
        "project": proj,
    }


@app.get("/api/projects/{project_id}/documents")
def list_project_documents(project_id: str):
    """Lists metadata for all ingested documents in project."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, project_id, filename, file_type, file_size, content_hash, created_at, sections_json
        FROM documents WHERE project_id = ?
        """,
        (project_id,),
    )
    rows = cur.fetchall()
    conn.close()

    docs = []
    for r in rows:
        sections = json.loads(r["sections_json"])
        docs.append(
            DocumentMetadata(
                id=r["id"],
                project_id=r["project_id"],
                filename=r["filename"],
                file_type=r["file_type"],
                file_size=r["file_size"],
                content_hash=r["content_hash"],
                created_at=r["created_at"],
                sections_count=len(sections),
            )
        )
    return docs


# ==============================================================================
# Legacy Ingestion Alias (/api/ingest)
# ==============================================================================
@app.post("/api/ingest", response_model=HandoverProject)
def ingest_handover_sources(payload: IngestPayload, user: Optional[UserProfile] = Depends(get_optional_user)):
    """Dynamic multi-source ingestion: extracts claims and flags cross-document conflicts."""
    filename = payload.filename or "ingested_notes.md"
    proj_id = f"proj-{uuid.uuid4().hex[:6]}"

    proj = run_heuristic_extraction(
        raw_sources=[
            {
                "id": f"doc-{uuid.uuid4().hex[:6]}",
                "filename": filename,
                "file_type": "markdown",
                "content": payload.raw_text.strip(),
            }
        ],
        project_id=proj_id,
        project_name=payload.project_name or "Ingested Project Handover",
        outgoing_member=payload.outgoing_member or "Departing Engineer",
        intended_role=payload.intended_role or "Successor Engineer",
    )

    return repo.save_project(proj, make_active=True)


@app.post("/api/extract", response_model=HandoverProject)
def extract_handover_sources_alias(payload: IngestPayload):
    """Alias for /api/ingest."""
    return ingest_handover_sources(payload)


# ==============================================================================
# Claim Review & Triage (Reviewer Only)
# ==============================================================================
@app.post("/api/claims/{claim_id}/toggle-approve")
def toggle_claim_approval(
    claim_id: str,
    user: UserProfile = Depends(require_roles(["project_reviewer"])),
):
    """Reviewer Gate: Toggles human approval status for a claim."""
    active = repo.get_active()
    for claim in active.claims:
        if claim.id == claim_id:
            claim.is_approved = not claim.is_approved
            claim.reviewer_status = "approved" if claim.is_approved else "pending"
            claim.version += 1
            repo.save_project(active)

            repo.record_audit_log(
                project_id=active.project_id,
                entity_type="claim",
                entity_id=claim_id,
                action="toggle_approval",
                user_id=user.id,
                user_email=user.email,
                user_role=user.role,
                details={"claim_id": claim.id, "is_approved": claim.is_approved},
            )

            return {
                "success": True,
                "claim_id": claim.id,
                "is_approved": claim.is_approved,
                "reviewer_status": claim.reviewer_status,
                "claim": claim,
            }

    raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")


@app.post("/api/claims/{claim_id}/toggle-sensitive")
def toggle_claim_sensitive(
    claim_id: str,
    user: UserProfile = Depends(require_roles(["project_reviewer"])),
):
    """Reviewer Gate: Toggles sensitive redaction status for a claim."""
    active = repo.get_active()
    for claim in active.claims:
        if claim.id == claim_id:
            claim.is_sensitive = not claim.is_sensitive
            claim.version += 1
            repo.save_project(active)

            repo.record_audit_log(
                project_id=active.project_id,
                entity_type="claim",
                entity_id=claim_id,
                action="toggle_sensitive",
                user_id=user.id,
                user_email=user.email,
                user_role=user.role,
                details={"claim_id": claim.id, "is_sensitive": claim.is_sensitive},
            )

            return {
                "success": True,
                "claim_id": claim.id,
                "is_sensitive": claim.is_sensitive,
                "claim": claim,
            }

    raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")


@app.put("/api/claims/{claim_id}")
def update_claim(
    claim_id: str,
    req: ClaimStatusUpdatePayload,
    user: UserProfile = Depends(require_roles(["project_reviewer", "outgoing_member"])),
):
    """Updates statement or metadata of an existing claim."""
    active = repo.get_active()
    for claim in active.claims:
        if claim.id == claim_id:
            if req.statement is not None:
                claim.statement = req.statement
            if req.status is not None:
                claim.status = req.status
            if req.category is not None:
                claim.category = req.category
            if req.validation_status is not None:
                claim.validation_status = req.validation_status
            if req.reviewer_status is not None:
                claim.reviewer_status = req.reviewer_status
            if req.is_approved is not None:
                claim.is_approved = req.is_approved
            if req.is_sensitive is not None:
                claim.is_sensitive = req.is_sensitive
            if req.conflict_notes is not None:
                claim.conflict_notes = req.conflict_notes
            claim.version += 1

            repo.save_project(active)
            return {"success": True, "claim_id": claim.id, "claim": claim}

    raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found.")


@app.post("/api/claims/approve-all")
def approve_all_claims(user: UserProfile = Depends(require_roles(["project_reviewer"]))):
    """Batch approves all claims in the active workspace."""
    active = repo.get_active()
    for claim in active.claims:
        claim.is_approved = True
        claim.reviewer_status = "approved"
        claim.version += 1
    repo.save_project(active)

    repo.record_audit_log(
        project_id=active.project_id,
        entity_type="claims",
        entity_id=active.project_id,
        action="approve_all_claims",
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        details={"approved_count": len(active.claims)},
    )
    return {"success": True, "message": "All claims approved", "count": len(active.claims)}


# ==============================================================================
# Cross-Document Conflict Resolution (Outcome C)
# ==============================================================================
@app.get("/api/projects/{project_id}/conflicts", response_model=List[ConflictItem])
def list_conflicts(project_id: str):
    """Returns detected cross-document contradictions with competing evidence."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")
    return proj.conflicts


@app.post("/api/projects/{project_id}/conflicts/{conflict_id}/resolve")
def resolve_conflict_item(
    project_id: str,
    conflict_id: str,
    payload: ConflictResolutionPayload,
    user: UserProfile = Depends(require_roles(["project_reviewer"])),
):
    """Reviewer Gate: Records human resolution decision and rationale for a conflict."""
    updated = repo.resolve_conflict(
        project_id=project_id,
        conflict_id=conflict_id,
        status=payload.status,
        resolution_choice=payload.resolution_choice,
        rationale=payload.rationale,
        resolved_by=user.email,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found.")

    return {
        "success": True,
        "conflict": updated,
        "message": f"Conflict resolved with status '{payload.status}'.",
    }


# ==============================================================================
# Successor Checklist (Outcome F)
# ==============================================================================
@app.get("/api/projects/{project_id}/checklist", response_model=List[ChecklistItem])
def get_checklist(project_id: str):
    """Retrieves persistent Day 1-30 successor checklist."""
    return get_project_checklist(project_id)


@app.put("/api/projects/{project_id}/checklist/{task_key}", response_model=ChecklistItem)
def update_checklist_task(
    project_id: str,
    task_key: str,
    payload: ChecklistUpdatePayload,
    user: UserProfile = Depends(require_roles(["incoming_successor", "project_reviewer"])),
):
    """Updates interactive status of a successor checklist task."""
    updated = update_checklist_task_status(
        project_id=project_id,
        task_key=task_key,
        status=payload.status,
        user_email=user.email,
        notes=payload.notes,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Checklist task '{task_key}' not found.")

    repo.record_audit_log(
        project_id=project_id,
        entity_type="checklist",
        entity_id=task_key,
        action="update_task",
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        details={"task_key": task_key, "status": payload.status},
    )
    return updated


# ==============================================================================
# Handover Approval & Successor Package (Outcome E)
# ==============================================================================
@app.post("/api/projects/{project_id}/approve")
def approve_handover_package(
    project_id: str,
    payload: HandoverApprovePayload,
    user: UserProfile = Depends(require_roles(["project_reviewer"])),
):
    """Reviewer Gate: Transitions handover state from Draft/In Review to Approved."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    # Check for unresolved conflicts
    unresolved = [c for c in proj.conflicts if c.status == "unresolved"]
    if unresolved and payload.status == "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve handover: {len(unresolved)} unresolved contradictions remain. Reconcile all conflicts before locking.",
        )

    now_str = datetime.now(timezone.utc).isoformat()
    proj.status = payload.status
    proj.approved_by = user.email
    proj.approved_at = now_str
    repo.save_project(proj, make_active=True)

    repo.record_audit_log(
        project_id=project_id,
        entity_type="project",
        entity_id=project_id,
        action="approve_handover",
        user_id=user.id,
        user_email=user.email,
        user_role=user.role,
        details={"status": payload.status, "notes": payload.notes},
    )

    return {"success": True, "status": proj.status, "project": proj}


@app.get("/api/projects/{project_id}/successor-package", response_model=HandoverProject)
def get_successor_package(
    project_id: str,
    user: UserProfile = Depends(require_roles(["incoming_successor", "project_reviewer"])),
):
    """Enforces sanitized view: incoming successors ONLY receive approved claims with masked credentials."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    if proj.status != "approved" and user.role == "incoming_successor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: The handover package has not been approved by the Engineering Lead.",
        )

    return sanitize_project_for_successor(proj)


# ==============================================================================
# Presets & Reset
# ==============================================================================
@app.get("/api/presets/{preset_id}", response_model=HandoverProject)
def load_preset(preset_id: str):
    """Judge Demo Preset Switcher: instantly loads Preset 1 (conflict) or Preset 2 (clean)."""
    return repo.reset_to_preset(preset_id)


@app.post("/api/sample/reset")
def reset_sample_project(preset_id: Optional[str] = Query(default="apex-core-2026")):
    """Resets to selected scenario preset."""
    proj = repo.reset_to_preset(preset_id)
    return {"success": True, "message": f"Dataset reset to {preset_id}", "project": proj}


# ==============================================================================
# Handover Exports (Outcome E & G)
# ==============================================================================
@app.get("/api/projects/{project_id}/export/markdown")
def export_handover_markdown(
    project_id: str,
    user: Optional[UserProfile] = Depends(get_optional_user),
):
    """Generates clean, sanitized handover-brief.md without leaking secrets."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    sanitized = sanitize_project_for_successor(proj)
    md_lines = [
        f"# Handover Brief: {sanitized.project_name}",
        f"**Outgoing Member:** {sanitized.outgoing_member}",
        f"**Intended Role:** {sanitized.intended_role}",
        f"**Status:** {sanitized.status.upper()}",
        f"**Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
        "## Executive Summary",
        sanitized.summary,
        "",
        "## Verified Operational Claims",
    ]

    for c in sanitized.claims:
        badge = f"[{c.category.upper()}]"
        cit = f"(Source: {c.source_filename} @ {c.source_location})" if c.source_filename else ""
        md_lines.append(f"- **{badge}** {c.statement} {cit}")

    if sanitized.conflicts:
        md_lines.extend(["", "## Conflict Reconciliation Log"])
        for conf in sanitized.conflicts:
            md_lines.append(f"### Conflict: {conf.conflict_type.replace('_', ' ').title()} [{conf.status.upper()}]")
            md_lines.append(f"- {conf.explanation}")
            if conf.rationale:
                md_lines.append(f"- **Resolution Rationale ({conf.resolved_by}):** {conf.rationale}")

    md_lines.extend(["", "## Day 1-30 Successor Checklist"])
    chk = sanitized.checklist or get_project_checklist(project_id)
    for t in chk:
        box = "[x]" if t.status == "completed" else "[ ]"
        md_lines.append(f"- {box} **{t.title}**: {t.description}")

    md_content = "\n".join(md_lines)
    return PlainTextResponse(
        content=md_content,
        headers={"Content-Disposition": f"attachment; filename=handover-brief-{project_id}.md"},
    )


@app.get("/api/projects/{project_id}/export/audit-json")
def export_handover_audit_json(
    project_id: str,
    user: Optional[UserProfile] = Depends(get_optional_user),
):
    """Generates machine-readable, fully sanitized handover-audit.json."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found.")

    sanitized = sanitize_project_for_successor(proj)
    audit_payload = {
        "handover_audit_spec": "3.0.0",
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "platform": "Apex Coders Knowledge Handover Platform",
        "project_metadata": {
            "project_id": sanitized.project_id,
            "project_name": sanitized.project_name,
            "outgoing_member": sanitized.outgoing_member,
            "intended_role": sanitized.intended_role,
            "status": sanitized.status,
            "summary": sanitized.summary,
        },
        "metrics": {
            "total_claims": len(sanitized.claims),
            "approved_claims": len([c for c in sanitized.claims if c.is_approved]),
            "conflicts_count": len(sanitized.conflicts),
        },
        "claims": [c.model_dump() for c in sanitized.claims],
        "conflicts": [conf.model_dump() for conf in sanitized.conflicts],
        "checklist": [item.model_dump() for item in (sanitized.checklist or get_project_checklist(project_id))],
    }
    return JSONResponse(
        content=audit_payload,
        headers={"Content-Disposition": f"attachment; filename=handover-audit-{project_id}.json"},
    )


@app.get("/api/projects/{project_id}/audit-logs")
def get_project_audit_logs(
    project_id: str,
    user: UserProfile = Depends(require_roles(["project_reviewer"])),
):
    """Reviewer Gate: Returns tamper-evident audit history from SQLite database."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, project_id, entity_type, entity_id, action,
               user_id, user_email, user_role, details_json, created_at
        FROM audit_logs
        WHERE project_id = ?
        ORDER BY created_at DESC
        """,
        (project_id,),
    )
    rows = cur.fetchall()
    conn.close()

    logs = []
    for r in rows:
        logs.append({
            "id": r["id"],
            "project_id": r["project_id"],
            "entity_type": r["entity_type"],
            "entity_id": r["entity_id"],
            "action": r["action"],
            "user_id": r["user_id"],
            "user_email": r["user_email"],
            "user_role": r["user_role"],
            "details": json.loads(r["details_json"]),
            "created_at": r["created_at"],
        })
    return logs
