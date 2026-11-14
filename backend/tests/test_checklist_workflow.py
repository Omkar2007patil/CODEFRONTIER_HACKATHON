"""Automated tests for Successor Checklist, Approval Lifecycle & Workflow (Outcomes E, F, H)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage import repo, HandoverRepository
from app.checklist import get_project_checklist, update_checklist_task_status


@pytest.fixture
def client():
    return TestClient(app)


class TestChecklistAndWorkflow:
    def test_default_checklist_initialization(self):
        items = get_project_checklist("apex-core-2026")
        assert len(items) == 10
        keys = [i.task_key for i in items]
        assert "review_overview" in keys
        assert "review_architecture" in keys
        assert "verify_milestones" in keys
        assert "confirm_handover" in keys

    def test_update_checklist_task_via_api(self, client):
        # 1. Login as Successor
        res = client.post("/api/auth/demo-login", json={"role": "incoming_successor"})
        token = res.json()["access_token"]
        email = res.json()["user"]["email"]

        # 2. Update task to completed
        update_res = client.put(
            "/api/projects/apex-core-2026/checklist/review_overview",
            json={"status": "completed", "notes": "Reviewed ADRs and departure brief with team lead."},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert update_res.status_code == 200
        task = update_res.json()
        assert task["status"] == "completed"
        assert task["completed_by"] == email
        assert task["completed_at"] is not None
        assert "Reviewed ADRs" in task["notes"]

        # 3. Confirm persistence via separate fetch
        list_res = client.get("/api/projects/apex-core-2026/checklist")
        assert list_res.status_code == 200
        saved_task = next(t for t in list_res.json() if t["task_key"] == "review_overview")
        assert saved_task["status"] == "completed"

    def test_approval_lifecycle_blocks_when_conflicts_unresolved(self, client):
        # 1. Login as Reviewer
        res = client.post("/api/auth/demo-login", json={"role": "project_reviewer"})
        token = res.json()["access_token"]

        # 2. Ensure project has unresolved conflict
        proj = repo.reset_to_preset("apex-core-2026")
        assert any(c.status == "unresolved" for c in proj.conflicts)

        # 3. Attempting to approve project with unresolved conflict returns 400 Bad Request
        approve_res = client.post(
            "/api/projects/apex-core-2026/approve",
            json={"status": "approved", "notes": "Attempting premature approval"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert approve_res.status_code == 400
        assert "unresolved contradictions remain" in approve_res.json()["detail"]

    def test_approval_lifecycle_succeeds_when_clean_or_resolved(self, client):
        # 1. Login as Reviewer
        res = client.post("/api/auth/demo-login", json={"role": "project_reviewer"})
        token = res.json()["access_token"]

        # 2. Load Preset 2 (Clean Auth - 0 conflicts)
        clean_proj = repo.reset_to_preset("apex-auth-clean")
        assert len(clean_proj.conflicts) == 0

        # 3. Approve clean project
        approve_res = client.post(
            "/api/projects/apex-auth-clean/approve",
            json={"status": "approved", "notes": "All benchmarks verified, ready for Devika Nair Day-1."},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "approved"

    def test_database_persistence_across_repository_reinitialization(self):
        # 1. Write specific state to database
        update_checklist_task_status(
            project_id="apex-core-2026",
            task_key="verify_milestones",
            status="completed",
            user_email="successor@apex.dev",
            notes="Milestone confirmed for testing.",
        )

        # 2. Instantiate a fresh repository instance (simulates application restart)
        new_repo = HandoverRepository()
        reloaded_proj = new_repo.get_project("apex-core-2026")
        assert reloaded_proj is not None

        # 3. Verify checklist item retained completed state from SQLite
        chk = next(t for t in reloaded_proj.checklist if t.task_key == "verify_milestones")
        assert chk.status == "completed"
        assert chk.completed_by == "successor@apex.dev"
