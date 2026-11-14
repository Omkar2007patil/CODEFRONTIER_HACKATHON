"""Automated tests for Sensitive Credential Redaction & Security (Outcome E)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.redaction import (
    detect_sensitive_spans,
    has_sensitive_content,
    mask_sensitive_text,
    sanitize_claim_for_role,
)
from app.schemas import ClaimItem, Evidence
from app.db import get_db_connection


@pytest.fixture
def client():
    return TestClient(app)


class TestRedactionAndSecurity:
    def test_detect_sensitive_spans(self):
        sample = "export GITHUB_TOKEN='ghp_sampleTestToken12345678901234567890' and DB='postgres://user:superpass@db:5432/main'"
        spans = detect_sensitive_spans(sample)
        assert len(spans) >= 2
        types = [s["secret_type"] for s in spans]
        assert "github_token" in types or "api_key" in types
        assert "connection_string" in types

    def test_mask_sensitive_text(self):
        text = "Staging key: api_key='ghp_sampleSecretKey1234567890'"
        masked = mask_sensitive_text(text)
        assert "ghp_sampleSecretKey1234567890" not in masked
        assert "[REDACTED" in masked

    def test_sanitize_claim_masks_secrets_for_successor(self):
        secret_val = "ghp_testSecret994821034"
        claim = ClaimItem(
            id="c-secret",
            category="technical_configuration",
            statement=f"Staging access key: api_key='{secret_val}'",
            exact_source_excerpt=f"api_key='{secret_val}'",
            is_sensitive=True,
            evidence=Evidence(
                source_name="notes.txt",
                snippet=f"Found: api_key='{secret_val}'",
            ),
        )

        # 1. Successor role sanitization
        succ_claim = sanitize_claim_for_role(claim, user_role="incoming_successor")
        assert secret_val not in succ_claim.statement
        assert secret_val not in succ_claim.exact_source_excerpt
        assert secret_val not in succ_claim.evidence.snippet
        assert "[REDACTED" in succ_claim.statement

        # 2. Reviewer role can view raw claim for triage
        rev_claim = sanitize_claim_for_role(claim, user_role="project_reviewer")
        assert secret_val in rev_claim.statement

    def test_successor_api_endpoint_never_delivers_raw_secrets(self, client):
        # 1. Login as Successor
        res = client.post("/api/auth/demo-login", json={"role": "incoming_successor"})
        token = res.json()["access_token"]

        # 2. Fetch project
        p_res = client.get("/api/sample", headers={"Authorization": f"Bearer {token}"})
        assert p_res.status_code == 200
        p_data = p_res.json()

        # 3. Assert mock credential never appears anywhere in response
        raw_json = str(p_data)
        assert "ghp_mockApexTestStagingToken994821034" not in raw_json
        assert "[REDACTED" in raw_json

    def test_export_endpoint_never_exposes_raw_secrets(self, client):
        # Fetch markdown export
        res = client.get("/api/projects/apex-core-2026/export/markdown")
        assert res.status_code == 200
        md_text = res.text
        assert "ghp_mockApexTestStagingToken994821034" not in md_text
        assert "[REDACTED" in md_text

    def test_audit_logs_do_not_contain_plaintext_secrets(self):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT details_json FROM audit_logs")
        rows = cur.fetchall()
        conn.close()

        for r in rows:
            assert "ghp_mockApexTestStagingToken994821034" not in r["details_json"]
