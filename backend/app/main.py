import uuid
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.schemas import (
    HandoverProject,
    HandoverSnapshot,
    ClaimItem,
    IngestPayload,
    ClaimStatusUpdatePayload,
)
from app.extractor import extract_handover_claims
from app.storage import repo

app = FastAPI(
    title="Apex Coders Handover API",
    description="Evidence-linked project transition engine with persistent audit trail",
    version="2.0.0",
)

# Open CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def get_health() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/sample", response_model=HandoverProject)
def get_active_project() -> HandoverProject:
    """Returns the currently active handover project from persistent storage."""
    return repo.get_active()


@app.get("/api/handovers", response_model=List[HandoverSnapshot])
def list_saved_handovers() -> List[HandoverSnapshot]:
    """Returns list of all saved/ingested handover snapshots with timestamps and metrics."""
    return repo.list_snapshots()


@app.get("/api/handovers/{project_id}", response_model=HandoverProject)
def get_handover_project(project_id: str) -> HandoverProject:
    """Retrieves a specific historical or active handover project by ID."""
    proj = repo.get_project(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Handover project '{project_id}' not found")
    return proj


@app.post("/api/handovers/{project_id}/select", response_model=HandoverProject)
def select_handover_project(project_id: str) -> HandoverProject:
    """Sets a historical handover as the currently active project."""
    proj = repo.set_active(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Handover project '{project_id}' not found")
    return proj


class ProjectStatusUpdatePayload(BaseModel):
    claims: List[Dict[str, Any]]


@app.put("/api/handovers/{project_id}/status", response_model=HandoverProject)
def update_handover_status(project_id: str, payload: ProjectStatusUpdatePayload) -> HandoverProject:
    """Persists claim edits, toggled approvals, and redactions done by Reviewer."""
    updated = repo.update_project_status(project_id, payload.claims)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return updated


@app.post("/api/ingest", response_model=HandoverProject)
def ingest_handover_sources(payload: IngestPayload) -> HandoverProject:
    """Dynamic multi-source ingestion: deterministic parser extracts decisions, blockers,
    next actions, and flags contradictory dates/claims with snippet citations."""
    filename = payload.filename or "ingested_notes.md"
    claims = extract_handover_claims(payload.raw_text, filename=filename)

    proj_id = f"proj-{uuid.uuid4().hex[:6]}"
    summary = (
        f"Handover package for {payload.project_name}. Outgoing engineer {payload.outgoing_member} "
        f"is transitioning to {payload.intended_role}. Ingested and reconstructed {len(claims)} operational claims "
        f"with evidence citations and conflict monitoring."
    )

    new_project = HandoverProject(
        project_id=proj_id,
        project_name=payload.project_name or "Ingested Project Handover",
        outgoing_member=payload.outgoing_member or "Departing Engineer",
        intended_role=payload.intended_role or "Successor Engineer",
        summary=summary,
        raw_sources=[
            {
                "filename": filename,
                "file_type": "markdown",
                "content": payload.raw_text.strip(),
            }
        ],
        claims=claims,
    )

    return repo.save_project(new_project, make_active=True)


@app.post("/api/extract", response_model=HandoverProject)
def extract_handover_sources_alias(payload: IngestPayload) -> HandoverProject:
    """Backward compatibility alias for /api/ingest."""
    return ingest_handover_sources(payload)


@app.get("/api/presets/{preset_id}", response_model=HandoverProject)
def load_preset(preset_id: str) -> HandoverProject:
    """Judge Demo Preset Switcher: instantly loads Preset 1 (conflict) or Preset 2 (clean)."""
    return repo.reset_to_preset(preset_id)


@app.post("/api/sample/reset")
def reset_sample_project(preset_id: Optional[str] = Query(default="apex-core-2026")) -> Dict[str, Any]:
    """Resets to selected scenario preset."""
    proj = repo.reset_to_preset(preset_id)
    return {"success": True, "message": f"Dataset reset to {preset_id}", "project": proj}


@app.post("/api/claims/{claim_id}/toggle-approve")
def toggle_claim_approval(claim_id: str) -> Dict[str, Any]:
    """Toggles human reviewer approval status for a claim in active project."""
    active = repo.get_active()
    for claim in active.claims:
        if claim.id == claim_id:
            claim.is_approved = not claim.is_approved
            repo.save_project(active)
            return {
                "success": True,
                "claim_id": claim.id,
                "is_approved": claim.is_approved,
                "claim": claim,
            }

    raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")


@app.post("/api/claims/{claim_id}/toggle-sensitive")
def toggle_claim_sensitive(claim_id: str) -> Dict[str, Any]:
    """Toggles sensitive/redacted status for a claim in active project."""
    active = repo.get_active()
    for claim in active.claims:
        if claim.id == claim_id:
            claim.is_sensitive = not claim.is_sensitive
            repo.save_project(active)
            return {
                "success": True,
                "claim_id": claim.id,
                "is_sensitive": claim.is_sensitive,
                "claim": claim,
            }

    raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")


@app.put("/api/claims/{claim_id}")
def update_claim_field(claim_id: str, req: ClaimStatusUpdatePayload) -> Dict[str, Any]:
    """Updates statement or status of an existing claim item."""
    active = repo.get_active()
    for claim in active.claims:
        if claim.id == claim_id:
            if req.statement is not None:
                claim.statement = req.statement
            if req.status is not None:
                claim.status = req.status
            if req.is_approved is not None:
                claim.is_approved = req.is_approved
            if req.is_sensitive is not None:
                claim.is_sensitive = req.is_sensitive
            if req.conflict_notes is not None:
                claim.conflict_notes = req.conflict_notes

            repo.save_project(active)
            return {
                "success": True,
                "claim_id": claim.id,
                "claim": claim,
            }

    raise HTTPException(status_code=404, detail=f"Claim '{claim_id}' not found")


@app.post("/api/claims/approve-all")
def approve_all_claims() -> Dict[str, Any]:
    """Batch approves all claims in the active project and persists."""
    active = repo.get_active()
    for claim in active.claims:
        claim.is_approved = True
    repo.save_project(active)
    return {"success": True, "message": "All claims approved", "count": len(active.claims)}
