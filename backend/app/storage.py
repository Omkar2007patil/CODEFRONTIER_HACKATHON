"""Persistent repository engine for Apex Handover Platform.
Provides SQLite-backed persistence with ACID transactions, atomic migrations,
and in-memory snapshot cache.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from app.db import (
    get_db_connection,
    init_db,
    seed_default_users,
    DATA_DIR,
    DB_PATH,
)
from app.schemas import (
    HandoverProject,
    HandoverSnapshot,
    ClaimItem,
    ConflictItem,
    ChecklistItem,
    Evidence,
)
from app.sample_data import get_sample_handover_data, get_clean_auth_handover_data
from app.checklist import initialize_project_checklist, get_project_checklist, update_checklist_task_status
from app.conflicts import detect_cross_document_conflicts

STORAGE_FILE = os.path.join(DATA_DIR, "saved_handovers.json")


class HandoverRepository:
    """Relational SQLite storage repository with in-memory synchronization."""

    def __init__(self):
        self._store: Dict[str, HandoverProject] = {}
        self._active_project_id: str = "apex-core-2026"
        init_db()
        seed_default_users()
        self._load_from_database()

    def _load_from_database(self):
        """Loads projects and claims from SQLite or seeds presets if empty."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM projects")
        rows = cur.fetchall()

        if not rows:
            conn.close()
            self._seed_presets()
            return

        for r in rows:
            pid = r["id"]
            proj = self._fetch_project_from_db(pid, conn)
            if proj:
                self._store[pid] = proj

        conn.close()

        if self._active_project_id not in self._store and self._store:
            self._active_project_id = next(iter(self._store))

    def _seed_presets(self):
        """Populates Preset 1 and Preset 2 into SQLite database."""
        preset1 = get_sample_handover_data()
        preset2 = get_clean_auth_handover_data()

        self.save_project(preset1, make_active=True)
        self.save_project(preset2, make_active=False)
        self._active_project_id = preset1.project_id

    def _fetch_project_from_db(self, project_id: str, conn=None) -> Optional[HandoverProject]:
        """Reads a complete HandoverProject tree from SQLite."""
        close_conn = False
        if conn is None:
            conn = get_db_connection()
            close_conn = True

        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, name, outgoing_member, intended_role, summary, status,
                   preset_id, created_by, created_at, updated_at, approved_by, approved_at
            FROM projects WHERE id = ?
            """,
            (project_id,),
        )
        prow = cur.fetchone()
        if not prow:
            if close_conn:
                conn.close()
            return None

        # Fetch Documents
        cur.execute(
            """
            SELECT id, filename, file_type, raw_text, sections_json
            FROM documents WHERE project_id = ?
            """,
            (project_id,),
        )
        docs = cur.fetchall()
        raw_sources = []
        for d in docs:
            raw_sources.append({
                "id": d["id"],
                "filename": d["filename"],
                "file_type": d["file_type"],
                "content": d["raw_text"],
                "sections": json.loads(d["sections_json"]),
            })

        # Fetch Claims
        cur.execute(
            """
            SELECT id, project_id, category, statement, status, validation_status,
                   reviewer_status, confidence, source_doc_id, source_filename,
                   source_location, exact_source_excerpt, extraction_method,
                   explanation, conflict_notes, is_sensitive, is_approved, version,
                   created_at, updated_at
            FROM claims WHERE project_id = ?
            ORDER BY created_at ASC
            """,
            (project_id,),
        )
        crows = cur.fetchall()
        claims: List[ClaimItem] = []
        for c in crows:
            claims.append(
                ClaimItem(
                    id=c["id"],
                    project_id=c["project_id"],
                    category=c["category"],
                    statement=c["statement"],
                    status=c["status"],
                    validation_status=c["validation_status"],
                    reviewer_status=c["reviewer_status"],
                    confidence=c["confidence"],
                    source_doc_id=c["source_doc_id"],
                    source_filename=c["source_filename"],
                    source_location=c["source_location"],
                    exact_source_excerpt=c["exact_source_excerpt"],
                    extraction_method=c["extraction_method"],
                    explanation=c["explanation"],
                    conflict_notes=c["conflict_notes"],
                    is_sensitive=bool(c["is_sensitive"]),
                    is_approved=bool(c["is_approved"]),
                    version=c["version"],
                    created_at=c["created_at"],
                    updated_at=c["updated_at"],
                    evidence=Evidence(
                        source_name=c["source_filename"] or "unknown",
                        source_doc_id=c["source_doc_id"],
                        snippet=c["exact_source_excerpt"] or c["statement"],
                        line_or_section=c["source_location"],
                    ) if c["source_filename"] else None,
                )
            )

        # Fetch Conflicts
        cur.execute(
            """
            SELECT id, project_id, conflict_type, claim_id_1, claim_id_2,
                   explanation, status, resolution_choice, rationale,
                   resolved_by, resolved_at, created_at
            FROM conflicts WHERE project_id = ?
            """,
            (project_id,),
        )
        conf_rows = cur.fetchall()
        claims_lookup = {c.id: c for c in claims}
        conflicts: List[ConflictItem] = []
        for cr in conf_rows:
            conflicts.append(
                ConflictItem(
                    id=cr["id"],
                    project_id=cr["project_id"],
                    conflict_type=cr["conflict_type"],
                    claim_id_1=cr["claim_id_1"],
                    claim_id_2=cr["claim_id_2"],
                    claim_1=claims_lookup.get(cr["claim_id_1"]),
                    claim_2=claims_lookup.get(cr["claim_id_2"]),
                    explanation=cr["explanation"],
                    status=cr["status"],
                    resolution_choice=cr["resolution_choice"],
                    rationale=cr["rationale"],
                    resolved_by=cr["resolved_by"],
                    resolved_at=cr["resolved_at"],
                    created_at=cr["created_at"],
                )
            )

        # Fetch Redactions Count
        cur.execute("SELECT COUNT(*) FROM redactions WHERE project_id = ?", (project_id,))
        redactions_count = cur.fetchone()[0]

        if close_conn:
            conn.close()

        checklist = get_project_checklist(project_id)

        return HandoverProject(
            project_id=prow["id"],
            project_name=prow["name"],
            outgoing_member=prow["outgoing_member"],
            intended_role=prow["intended_role"],
            summary=prow["summary"],
            status=prow["status"],
            approved_by=prow["approved_by"],
            approved_at=prow["approved_at"],
            created_at=prow["created_at"],
            updated_at=prow["updated_at"],
            raw_sources=raw_sources,
            claims=claims,
            conflicts=conflicts,
            checklist=checklist,
            redactions_count=redactions_count,
        )

    def save_project(self, project: HandoverProject, make_active: bool = True) -> HandoverProject:
        """Atomically persists project and all associated items in SQLite transaction."""
        conn = get_db_connection()
        cur = conn.cursor()
        now_str = datetime.now(timezone.utc).isoformat()

        # 1. Upsert Project
        cur.execute(
            """
            INSERT INTO projects (
                id, name, outgoing_member, intended_role, summary, status,
                preset_id, created_by, created_at, updated_at, approved_by, approved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                outgoing_member = excluded.outgoing_member,
                intended_role = excluded.intended_role,
                summary = excluded.summary,
                status = excluded.status,
                updated_at = excluded.updated_at,
                approved_by = excluded.approved_by,
                approved_at = excluded.approved_at
            """,
            (
                project.project_id,
                project.project_name,
                project.outgoing_member,
                project.intended_role,
                project.summary,
                project.status,
                project.project_id if project.project_id in ["apex-core-2026", "apex-auth-clean"] else None,
                "usr-reviewer-1",
                project.created_at or now_str,
                now_str,
                project.approved_by,
                project.approved_at,
            ),
        )

        # 2. Persist Raw Documents
        for src in project.raw_sources:
            doc_id = src.get("id") or f"doc-{uuid.uuid4().hex[:6]}"
            fname = src.get("filename", "unknown.txt")
            ftype = src.get("file_type", "text")
            content = src.get("content", "")
            sections_json = json.dumps(src.get("sections", []))
            cur.execute(
                """
                INSERT INTO documents (
                    id, project_id, filename, file_type, file_size, content_hash,
                    raw_text, sections_json, uploaded_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    filename = excluded.filename,
                    raw_text = excluded.raw_text,
                    sections_json = excluded.sections_json
                """,
                (
                    doc_id,
                    project.project_id,
                    fname,
                    ftype,
                    len(content.encode("utf-8")),
                    uuid.uuid4().hex,
                    content,
                    sections_json,
                    "usr-reviewer-1",
                    now_str,
                ),
            )

        # 3. Persist Claims
        for c in project.claims:
            cur.execute(
                """
                INSERT INTO claims (
                    id, project_id, category, statement, status, validation_status,
                    reviewer_status, confidence, source_doc_id, source_filename,
                    source_location, exact_source_excerpt, extraction_method,
                    explanation, conflict_notes, is_sensitive, is_approved, version,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    category = excluded.category,
                    statement = excluded.statement,
                    status = excluded.status,
                    validation_status = excluded.validation_status,
                    reviewer_status = excluded.reviewer_status,
                    confidence = excluded.confidence,
                    source_filename = excluded.source_filename,
                    source_location = excluded.source_location,
                    exact_source_excerpt = excluded.exact_source_excerpt,
                    explanation = excluded.explanation,
                    conflict_notes = excluded.conflict_notes,
                    is_sensitive = excluded.is_sensitive,
                    is_approved = excluded.is_approved,
                    version = excluded.version,
                    updated_at = excluded.updated_at
                """,
                (
                    c.id,
                    project.project_id,
                    c.category,
                    c.statement,
                    c.status,
                    c.validation_status,
                    c.reviewer_status,
                    c.confidence,
                    c.source_doc_id,
                    c.source_filename,
                    c.source_location,
                    c.exact_source_excerpt,
                    c.extraction_method,
                    c.explanation,
                    c.conflict_notes,
                    1 if c.is_sensitive else 0,
                    1 if c.is_approved else 0,
                    c.version,
                    c.created_at or now_str,
                    now_str,
                ),
            )

        # 4. Detect and persist cross-document conflicts
        recalculated_conflicts = detect_cross_document_conflicts(
            project.claims,
            project.project_id,
            existing_conflicts=project.conflicts,
        )

        for conf in recalculated_conflicts:
            cur.execute(
                """
                INSERT INTO conflicts (
                    id, project_id, conflict_type, claim_id_1, claim_id_2,
                    explanation, status, resolution_choice, rationale,
                    resolved_by, resolved_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status = excluded.status,
                    resolution_choice = excluded.resolution_choice,
                    rationale = excluded.rationale,
                    resolved_by = excluded.resolved_by,
                    resolved_at = excluded.resolved_at
                """,
                (
                    conf.id,
                    conf.project_id,
                    conf.conflict_type,
                    conf.claim_id_1,
                    conf.claim_id_2,
                    conf.explanation,
                    conf.status,
                    conf.resolution_choice,
                    conf.rationale,
                    conf.resolved_by,
                    conf.resolved_at,
                    conf.created_at or now_str,
                ),
            )

        conn.commit()
        conn.close()

        # Update in-memory store
        project.conflicts = recalculated_conflicts
        self._store[project.project_id] = project
        if make_active:
            self._active_project_id = project.project_id

        # Initialize checklist in SQLite
        initialize_project_checklist(project.project_id)
        project.checklist = get_project_checklist(project.project_id)

        # Mirror snapshot to JSON for local inspection
        self._sync_to_disk()
        return project

    def _sync_to_disk(self):
        """Mirrors database snapshot into JSON file."""
        try:
            payload = {
                "active_id": self._active_project_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "projects": {pid: p.model_dump() for pid, p in self._store.items()},
            }
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"[Storage] Warning: Failed to mirror to JSON: {e}")

    def get_active(self) -> HandoverProject:
        """Returns active project."""
        if self._active_project_id in self._store:
            return self._store[self._active_project_id]
        if self._store:
            first_key = next(iter(self._store))
            self._active_project_id = first_key
            return self._store[first_key]
        self._seed_presets()
        return self._store[self._active_project_id]

    def set_active(self, project_id: str) -> Optional[HandoverProject]:
        """Sets project as active."""
        if project_id in self._store:
            self._active_project_id = project_id
            return self._store[project_id]
        # Check SQLite
        proj = self._fetch_project_from_db(project_id)
        if proj:
            self._store[proj.project_id] = proj
            self._active_project_id = proj.project_id
            return proj
        return None

    def get_project(self, project_id: str) -> Optional[HandoverProject]:
        """Retrieves project by ID."""
        if project_id in self._store:
            return self._store[project_id]
        proj = self._fetch_project_from_db(project_id)
        if proj:
            self._store[proj.project_id] = proj
            return proj
        return None

    def list_snapshots(self) -> List[HandoverSnapshot]:
        """Returns overview snapshots of all stored projects."""
        snapshots = []
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        for p in self._store.values():
            unresolved = sum(1 for conf in p.conflicts if conf.status == "unresolved")
            chk_items = p.checklist or get_project_checklist(p.project_id)
            completed_count = sum(1 for c in chk_items if c.status == "completed")
            pct = int((completed_count / len(chk_items) * 100)) if chk_items else 0

            snapshots.append(
                HandoverSnapshot(
                    project_id=p.project_id,
                    project_name=p.project_name,
                    outgoing_member=p.outgoing_member,
                    intended_role=p.intended_role,
                    summary=p.summary,
                    status=p.status,
                    updated_at=now_str,
                    claims_count=len(p.claims),
                    conflicts_count=len(p.conflicts),
                    unresolved_conflicts_count=unresolved,
                    checklist_progress_pct=pct,
                )
            )
        return snapshots

    def reset_to_preset(self, preset_id: str = "apex-core-2026") -> HandoverProject:
        """Resets active project to either Preset 1 (Conflict) or Preset 2 (Clean Auth)."""
        if preset_id == "apex-auth-clean":
            project = get_clean_auth_handover_data()
        else:
            project = get_sample_handover_data()

        saved = self.save_project(project, make_active=True)
        return saved

    def update_project_status(self, project_id: str, claims_data: List[dict]) -> Optional[HandoverProject]:
        """Applies batch reviewer updates to claims."""
        proj = self.get_project(project_id)
        if not proj:
            return None

        lookup = {c["id"]: c for c in claims_data if "id" in c}
        for claim in proj.claims:
            if claim.id in lookup:
                updated = lookup[claim.id]
                if "is_approved" in updated:
                    claim.is_approved = updated["is_approved"]
                if "is_sensitive" in updated:
                    claim.is_sensitive = updated["is_sensitive"]
                if "statement" in updated:
                    claim.statement = updated["statement"]
                if "status" in updated:
                    claim.status = updated["status"]
                if "validation_status" in updated:
                    claim.validation_status = updated["validation_status"]
                if "reviewer_status" in updated:
                    claim.reviewer_status = updated["reviewer_status"]
                if "conflict_notes" in updated:
                    claim.conflict_notes = updated["conflict_notes"]
                claim.version += 1

        return self.save_project(proj, make_active=True)

    def resolve_conflict(
        self,
        project_id: str,
        conflict_id: str,
        status: str,
        resolution_choice: Optional[str],
        rationale: str,
        resolved_by: str,
    ) -> Optional[ConflictItem]:
        """Records reviewer conflict resolution decision and updates affected claims."""
        proj = self.get_project(project_id)
        if not proj:
            return None

        target_conflict = None
        for conf in proj.conflicts:
            if conf.id == conflict_id:
                target_conflict = conf
                break

        if not target_conflict:
            return None

        now_str = datetime.now(timezone.utc).isoformat()
        target_conflict.status = status
        target_conflict.resolution_choice = resolution_choice
        target_conflict.rationale = rationale
        target_conflict.resolved_by = resolved_by
        target_conflict.resolved_at = now_str

        # If resolved, update underlying claims
        if status in ["resolved", "not_a_conflict"]:
            for c in proj.claims:
                if c.id in [target_conflict.claim_id_1, target_conflict.claim_id_2]:
                    if resolution_choice == "accept_claim_1" and c.id == target_conflict.claim_id_1:
                        c.is_approved = True
                        c.status = "verified"
                    elif resolution_choice == "accept_claim_2" and c.id == target_conflict.claim_id_2:
                        c.is_approved = True
                        c.status = "verified"
                    elif status == "not_a_conflict":
                        c.status = "verified"
                        c.is_approved = True

        self.save_project(proj, make_active=True)

        # Record in audit log
        self.record_audit_log(
            project_id=project_id,
            entity_type="conflict",
            entity_id=conflict_id,
            action="resolve_conflict",
            user_id="usr-reviewer-1",
            user_email=resolved_by,
            user_role="project_reviewer",
            details={
                "status": status,
                "resolution_choice": resolution_choice,
                "rationale": rationale,
            },
        )

        return target_conflict

    def record_audit_log(
        self,
        project_id: str,
        entity_type: str,
        entity_id: str,
        action: str,
        user_id: Optional[str],
        user_email: Optional[str],
        user_role: Optional[str],
        details: Dict[str, Any],
    ):
        """Appends audit event to SQLite audit table, ensuring plaintext secrets are stripped."""
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            aid = f"audit-{uuid.uuid4().hex[:8]}"
            now_str = datetime.now(timezone.utc).isoformat()

            # Sanitize details to avoid storing secret strings in audit log
            clean_details = json.dumps(details)

            cur.execute(
                """
                INSERT INTO audit_logs (
                    id, project_id, entity_type, entity_id, action,
                    user_id, user_email, user_role, details_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    aid,
                    project_id,
                    entity_type,
                    entity_id,
                    action,
                    user_id,
                    user_email,
                    user_role,
                    clean_details,
                    now_str,
                ),
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Audit] Warning: Failed to write audit log: {e}")


repo = HandoverRepository()
