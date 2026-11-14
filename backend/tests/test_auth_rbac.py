"""Automated tests for Backend-Enforced RBAC & Authorization (Outcome D)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from app.storage import repo


@pytest.fixture
def client():
    return TestClient(app)


class TestRBACAuthorization:
    def test_unauthenticated_protected_endpoint_returns_401(self, client):
        res = client.post("/api/claims/claim-1/toggle-approve")
        assert res.status_code == 401
        assert "Authentication credentials were not provided" in res.json()["detail"]

    def test_invalid_token_returns_401(self, client):
        res = client.post(
            "/api/claims/claim-1/toggle-approve",
            headers={"Authorization": "Bearer invalid.jwt.token.string"},
        )
        assert res.status_code == 401

    def test_outgoing_member_can_upload_but_cannot_approve(self, client):
        # 1. Login as Outgoing Member
        res = client.post("/api/auth/demo-login", json={"role": "outgoing_member"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        assert res.json()["user"]["role"] == "outgoing_member"

        # 2. Outgoing member can upload documents
        upload_res = client.post(
            "/api/projects/apex-core-2026/documents/upload",
            files=[("files", ("outgoing_notes.txt", b"Notes from departing engineer.", "text/plain"))],
            headers={"Authorization": f"Bearer {token}"},
        )
        assert upload_res.status_code == 200

        # 3. Outgoing member is prohibited from toggling claim approvals (403 Forbidden)
        forbid_approve = client.post(
            "/api/claims/claim-1/toggle-approve",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert forbid_approve.status_code == 403
        assert "Forbidden" in forbid_approve.json()["detail"]

        # 4. Outgoing member is prohibited from resolving conflicts (403 Forbidden)
        forbid_resolve = client.post(
            "/api/projects/apex-core-2026/conflicts/conf-test/resolve",
            json={"status": "resolved", "rationale": "Attempted resolution by outgoing"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert forbid_resolve.status_code == 403

        # 5. Outgoing member is prohibited from approving the handover package (403 Forbidden)
        forbid_lock = client.post(
            "/api/projects/apex-core-2026/approve",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert forbid_lock.status_code == 403

    def test_successor_cannot_access_unapproved_handover_package(self, client):
        # 1. Login as Incoming Successor
        res = client.post("/api/auth/demo-login", json={"role": "incoming_successor"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        assert res.json()["user"]["role"] == "incoming_successor"

        # 2. Ensure project is unapproved
        proj = repo.reset_to_preset("apex-core-2026")
        proj.status = "in_review"
        repo.save_project(proj, make_active=True)

        # 3. Successor attempts to fetch successor package for unapproved project (403 Forbidden)
        succ_res = client.get(
            "/api/projects/apex-core-2026/successor-package",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert succ_res.status_code == 403
        assert "has not been approved" in succ_res.json()["detail"]

        # 4. Successor cannot toggle approvals or resolve conflicts
        forbid_toggle = client.post(
            "/api/claims/claim-1/toggle-approve",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert forbid_toggle.status_code == 403

    def test_reviewer_can_perform_triage_and_approve(self, client):
        # 1. Login as Reviewer
        res = client.post("/api/auth/demo-login", json={"role": "project_reviewer"})
        assert res.status_code == 200
        token = res.json()["access_token"]

        # 2. Reviewer toggles claim approval
        toggle_res = client.post(
            "/api/claims/claim-1/toggle-approve",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert toggle_res.status_code == 200
        assert "is_approved" in toggle_res.json()

        # 3. Reviewer batch approves all claims
        batch_res = client.post(
            "/api/claims/approve-all",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert batch_res.status_code == 200
        assert batch_res.json()["success"] is True

    def test_password_authentication(self, client):
        # Valid credentials
        res = client.post(
            "/api/auth/login",
            json={"email": "reviewer@apex.dev", "password": "apexReviewer2026!"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "reviewer@apex.dev"
        assert data["user"]["role"] == "project_reviewer"

        # Invalid password
        bad_res = client.post(
            "/api/auth/login",
            json={"email": "reviewer@apex.dev", "password": "wrongPassword123!"},
        )
        assert bad_res.status_code == 401
