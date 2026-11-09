import os
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.schemas import HandoverProject, HandoverSnapshot, ClaimItem, ClaimStatusUpdatePayload
from app.sample_data import get_sample_handover_data, get_clean_auth_handover_data

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORAGE_FILE = os.path.join(DATA_DIR, "saved_handovers.json")

class HandoverRepository:
    """Persistent storage engine using JSON-backed store with in-memory synchronization."""

    def __init__(self):
        self._store: Dict[str, HandoverProject] = {}
        self._active_project_id: str = "apex-core-2026"
        self._ensure_storage_dir()
        self._load_from_disk()

    def _ensure_storage_dir(self):
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
        except Exception:
            pass

    def _load_from_disk(self):
        """Loads projects from disk or seeds presets if empty."""
        loaded = False
        if os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for pid, pdata in data.get("projects", {}).items():
                        self._store[pid] = HandoverProject(**pdata)
                    self._active_project_id = data.get("active_id", "apex-core-2026")
                    if self._store:
                        loaded = True
            except Exception as e:
                print(f"[Storage] Warning: Failed to parse saved_handovers.json: {e}")

        if not loaded:
            self._seed_presets()
            self._save_to_disk()

    def _seed_presets(self):
        preset1 = get_sample_handover_data()
        preset2 = get_clean_auth_handover_data()
        self._store[preset1.project_id] = preset1
        self._store[preset2.project_id] = preset2
        self._active_project_id = preset1.project_id

    def _save_to_disk(self):
        """Persists current state to JSON file."""
        try:
            self._ensure_storage_dir()
            payload = {
                "active_id": self._active_project_id,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "projects": {
                    pid: p.model_dump() for pid, p in self._store.items()
                },
            }
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"[Storage] Warning: Could not write to saved_handovers.json: {e}")

    def get_active(self) -> HandoverProject:
        if self._active_project_id in self._store:
            return self._store[self._active_project_id]
        if self._store:
            first_key = next(iter(self._store))
            self._active_project_id = first_key
            return self._store[first_key]
        self._seed_presets()
        return self._store[self._active_project_id]

    def set_active(self, project_id: str) -> Optional[HandoverProject]:
        if project_id in self._store:
            self._active_project_id = project_id
            self._save_to_disk()
            return self._store[project_id]
        return None

    def save_project(self, project: HandoverProject, make_active: bool = True) -> HandoverProject:
        self._store[project.project_id] = project
        if make_active:
            self._active_project_id = project.project_id
        self._save_to_disk()
        return project

    def get_project(self, project_id: str) -> Optional[HandoverProject]:
        return self._store.get(project_id)

    def list_snapshots(self) -> List[HandoverSnapshot]:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        snapshots: List[HandoverSnapshot] = []
        for p in self._store.values():
            conflicts = sum(1 for c in p.claims if c.status == "conflicting")
            snapshots.append(
                HandoverSnapshot(
                    project_id=p.project_id,
                    project_name=p.project_name,
                    outgoing_member=p.outgoing_member,
                    intended_role=p.intended_role,
                    summary=p.summary,
                    updated_at=now_str,
                    claims_count=len(p.claims),
                    conflicts_count=conflicts,
                )
            )
        return snapshots

    def reset_to_preset(self, preset_id: str = "apex-core-2026") -> HandoverProject:
        if preset_id == "apex-auth-clean":
            project = get_clean_auth_handover_data()
        else:
            project = get_sample_handover_data()
        self._store[project.project_id] = project
        self._active_project_id = project.project_id
        self._save_to_disk()
        return project

    def update_project_status(self, project_id: str, claims_data: List[dict]) -> Optional[HandoverProject]:
        proj = self._store.get(project_id)
        if not proj:
            return None
        # Update existing claims
        lookup = {c["id"]: c for c in claims_data if "id" in c}
        for idx, claim in enumerate(proj.claims):
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
                if "conflict_notes" in updated:
                    claim.conflict_notes = updated["conflict_notes"]
        self._save_to_disk()
        return proj


repo = HandoverRepository()

