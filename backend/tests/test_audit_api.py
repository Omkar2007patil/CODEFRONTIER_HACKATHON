"""Tests for server-side audit logs, JSON exports, and role boundaries."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

class TestAuditApiEndpoints:
    @pytest.fixture(autouse=True)
    def setup_preset(self, client):
        client.post("/api/sample/reset?preset_id=apex-core-2026")

    def test_json_audit_export_masks_secrets(self, client):
        res = client.get("/api/projects/apex-core-2026/export/audit-json")
        assert res.status_code == 200
        data = res.json()
        assert data["handover_audit_spec"] == "3.0.0"
        raw_text = res.text
        assert "ghp_mockApexTestStagingToken994821034" not in raw_text
        assert "[REDACTED" in raw_text

    def test_audit_logs_rbac_protection(self, client):
        # 1. Unauthenticated should return 401
        res_unauth = client.get("/api/projects/apex-core-2026/audit-logs")
        assert res_unauth.status_code == 401

        # 2. Successor role should return 403 Forbidden
        succ_login = client.post("/api/auth/demo-login", json={"role": "incoming_successor"}).json()
        res_succ = client.get(
            "/api/projects/apex-core-2026/audit-logs",
            headers={"Authorization": f"Bearer {succ_login['access_token']}"}
        )
        assert res_succ.status_code == 403

        # 3. Project reviewer role should return 200 OK
        rev_login = client.post("/api/auth/demo-login", json={"role": "project_reviewer"}).json()
        res_rev = client.get(
            "/api/projects/apex-core-2026/audit-logs",
            headers={"Authorization": f"Bearer {rev_login['access_token']}"}
        )
        assert res_rev.status_code == 200
        logs = res_rev.json()
        assert isinstance(logs, list)
        for log in logs:
            raw_details = str(log["details"])
            assert "ghp_mockApexTestStagingToken994821034" not in raw_details
