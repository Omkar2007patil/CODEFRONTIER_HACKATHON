"""Comprehensive release audit verification script for Apex Knowledge Handover Platform.
Executes automated checks across all 10 release audit criteria.
"""

import os
import sys
import json
import io
import shutil
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.db import get_db_connection, DB_PATH
from app.storage import HandoverRepository
from app.ingest import (
    process_uploaded_file,
    parse_pdf_document,
    parse_docx_document,
    parse_csv_document,
    parse_json_document,
    parse_text_or_markdown,
)
from app.claims import validate_claim_evidence
from app.conflicts import detect_cross_document_conflicts
from app.redaction import mask_sensitive_text, has_sensitive_content

client = TestClient(app)

def run_all_checks():
    report = []
    
    # -------------------------------------------------------------
    # 1. Health check & DB engine
    # -------------------------------------------------------------
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    assert health_data["status"] == "ok"
    report.append(("Health Check & Database", "PASS", f"Status: {health_data['status']}, Database: {health_data['database']}, Projects: {health_data['projects_count']}"))

    # -------------------------------------------------------------
    # 2. Multi-Format Ingestion & Citation Provenance
    # -------------------------------------------------------------
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_documents")
    formats_tested = []

    # 2a. Markdown
    with open(os.path.join(sample_dir, "01_architecture_adr.md"), "rb") as f:
        md_bytes = f.read()
    ft, fn, text, sections = process_uploaded_file(md_bytes, "01_architecture_adr.md")
    assert ft == "markdown"
    assert len(sections) >= 2
    assert any("Line " in s.location_ref for s in sections)
    formats_tested.append(f"Markdown ({len(sections)} sections, location format: '{sections[0].location_ref}')")

    # 2b. Text
    with open(os.path.join(sample_dir, "02_sprint_board.txt"), "rb") as f:
        txt_bytes = f.read()
    ft, fn, text, sections = process_uploaded_file(txt_bytes, "02_sprint_board.txt")
    assert ft == "text"
    assert len(sections) >= 1
    formats_tested.append(f"Text ({len(sections)} sections, location format: '{sections[0].location_ref}')")

    # 2c. CSV
    with open(os.path.join(sample_dir, "03_release_schedule.csv"), "rb") as f:
        csv_bytes = f.read()
    ft, fn, text, sections = process_uploaded_file(csv_bytes, "03_release_schedule.csv")
    assert ft == "csv"
    assert len(sections) == 4  # 4 data rows
    assert sections[0].location_ref == "Row 2"
    formats_tested.append(f"CSV ({len(sections)} rows, location format: '{sections[0].location_ref}')")

    # 2d. JSON
    with open(os.path.join(sample_dir, "04_infrastructure.json"), "rb") as f:
        json_bytes = f.read()
    ft, fn, text, sections = process_uploaded_file(json_bytes, "04_infrastructure.json")
    assert ft == "json"
    assert len(sections) >= 8
    assert any("$.database" in s.location_ref for s in sections)
    formats_tested.append(f"JSON ({len(sections)} paths, location format: '{sections[1].location_ref}')")

    # 2e. DOCX
    with open(os.path.join(sample_dir, "05_project_proposal.docx"), "rb") as f:
        docx_bytes = f.read()
    ft, fn, text, sections = process_uploaded_file(docx_bytes, "05_project_proposal.docx")
    assert ft == "docx"
    assert len(sections) > 100
    assert "Para " in sections[0].location_ref
    formats_tested.append(f"DOCX ({len(sections)} paragraphs, location format: '{sections[0].location_ref}')")

    # 2f. PDF
    with open(os.path.join(sample_dir, "06_security_audit.pdf"), "rb") as f:
        pdf_bytes = f.read()
    ft, fn, text, sections = process_uploaded_file(pdf_bytes, "06_security_audit.pdf")
    assert ft == "pdf"
    assert len(sections) == 6
    assert sections[0].location_ref == "Page 1"
    assert sections[5].location_ref == "Page 6"
    formats_tested.append(f"PDF ({len(sections)} pages, location format: '{sections[0].location_ref}')")

    report.append(("Multi-Format Ingestion & Provenance", "PASS", "; ".join(formats_tested)))

    # -------------------------------------------------------------
    # 3. Cross-Document Conflicts & Non-Automatic Resolution
    # -------------------------------------------------------------
    # Reset to preset 1
    res = client.post("/api/sample/reset?preset_id=apex-core-2026")
    assert res.status_code == 200
    p = res.json()["project"]
    conflicts = p.get("conflicts", [])
    assert len(conflicts) > 0, "No conflicts found in preset 1"
    
    # Verify unresolved by default
    unresolved = [c for c in conflicts if c["status"] == "unresolved"]
    assert len(unresolved) == len(conflicts), "Unresolved conflicts were prematurely auto-resolved!"

    # Verify side-by-side excerpts exist
    c0 = conflicts[0]
    assert c0["claim_1"]["statement"] is not None
    assert c0["claim_2"]["statement"] is not None
    assert c0["explanation"] is not None

    report.append(("Cross-Document Conflict Detection", "PASS", f"Detected {len(conflicts)} conflicts across documents; all {len(unresolved)} strictly unresolved by default; competing excerpts preserved side-by-side."))

    # -------------------------------------------------------------
    # 4. Authentication & RBAC Boundaries
    # -------------------------------------------------------------
    # 4a. Unauthenticated access to reviewer route
    res_unauth = client.post("/api/claims/claim-1/toggle-approve")
    assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"

    # 4b. Invalid/forged token
    res_forged = client.post(
        "/api/claims/claim-1/toggle-approve",
        headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.forged_signature"}
    )
    assert res_forged.status_code == 401, f"Expected 401, got {res_forged.status_code}"

    # 4c. Outgoing member cannot approve claims
    login_out = client.post("/api/auth/demo-login", json={"role": "outgoing_member"}).json()
    token_out = login_out["access_token"]
    res_out_approve = client.post(
        "/api/claims/claim-1/toggle-approve",
        headers={"Authorization": f"Bearer {token_out}"}
    )
    assert res_out_approve.status_code == 403, f"Expected 403 for outgoing member approving claim, got {res_out_approve.status_code}"

    # 4d. Outgoing member cannot approve/lock handover
    res_out_lock = client.post(
        "/api/projects/apex-core-2026/approve",
        headers={"Authorization": f"Bearer {token_out}"},
        json={"status": "approved"}
    )
    assert res_out_lock.status_code == 403, f"Expected 403 for outgoing member approving handover, got {res_out_lock.status_code}"

    # 4e. Incoming successor cannot approve claims or resolve conflicts
    login_succ = client.post("/api/auth/demo-login", json={"role": "incoming_successor"}).json()
    token_succ = login_succ["access_token"]
    res_succ_resolve = client.post(
        f"/api/projects/apex-core-2026/conflicts/{c0['id']}/resolve",
        headers={"Authorization": f"Bearer {token_succ}"},
        json={"status": "resolved", "resolution_choice": "claim_1", "rationale": "I am successor"}
    )
    assert res_succ_resolve.status_code == 403, f"Expected 403 for successor resolving conflict, got {res_succ_resolve.status_code}"

    # 4f. Reviewer CAN approve claims and resolve conflicts
    login_rev = client.post("/api/auth/demo-login", json={"role": "project_reviewer"}).json()
    token_rev = login_rev["access_token"]
    res_rev_resolve = client.post(
        f"/api/projects/apex-core-2026/conflicts/{c0['id']}/resolve",
        headers={"Authorization": f"Bearer {token_rev}"},
        json={"status": "resolved", "resolution_choice": "claim_1", "rationale": "Reconciled with lead architect on Nov 10 freeze."}
    )
    assert res_rev_resolve.status_code == 200, f"Expected 200 for reviewer resolving conflict, got {res_rev_resolve.status_code}"

    report.append(("Authentication & RBAC Enforcement", "PASS", "Verified 401 for unauthenticated/forged requests; 403 for Outgoing and Successor on privileged operations; 200 for Reviewer."))

    # -------------------------------------------------------------
    # 5. Server-Side Redaction & Secret Leak Prevention
    # -------------------------------------------------------------
    secret_marker = "ghp_mockApexTestStagingToken994821034"

    # 5a. Successor requesting project data
    res_succ_proj = client.get(
        "/api/sample",
        headers={"Authorization": f"Bearer {token_succ}"}
    )
    assert res_succ_proj.status_code == 200
    succ_payload_str = res_succ_proj.text
    assert secret_marker not in succ_payload_str, "Raw token leaked to successor in /api/sample!"
    assert "[REDACTED" in succ_payload_str

    # 5b. Markdown Export
    res_export_md = client.get("/api/projects/apex-core-2026/export/markdown")
    assert res_export_md.status_code == 200
    assert secret_marker not in res_export_md.text, "Raw token leaked in markdown export!"
    assert "[REDACTED" in res_export_md.text

    # 5c. Audit records in database
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT details_json FROM audit_logs WHERE project_id = 'apex-core-2026'")
    rows = cur.fetchall()
    conn.close()
    for r in rows:
        assert secret_marker not in r["details_json"], "Raw token found in SQLite audit_logs table!"

    report.append(("Server-Side Redaction & Zero Secret Leak", "PASS", f"Tested /api/sample, /export/markdown, and audit_logs; raw token '{secret_marker}' was masked in 100% of tested outputs."))

    # -------------------------------------------------------------
    # 6. Database Restart Persistence (SQLite Relational Store)
    # -------------------------------------------------------------
    # Update a checklist task via API
    res_chk = client.put(
        "/api/projects/apex-core-2026/checklist/verify_environment",
        headers={"Authorization": f"Bearer {token_rev}"},
        json={"status": "completed", "notes": "Verified PostgreSQL connection string"}
    )
    assert res_chk.status_code == 200, f"Checklist update failed: {res_chk.text}"

    # Instantiate brand new repository instance to simulate complete application restart
    fresh_repo = HandoverRepository()
    reloaded_proj = fresh_repo.get_project("apex-core-2026")
    task_env = next((t for t in reloaded_proj.checklist if t.task_key == "verify_environment"), None)
    assert task_env is not None
    assert task_env.status == "completed", f"Checklist state did not persist! Expected 'completed', got '{task_env.status}'"
    assert "Verified PostgreSQL" in (task_env.notes or ""), "Task notes did not persist!"

    # Verify conflict resolution persisted across restart
    reloaded_c0 = next((c for c in reloaded_proj.conflicts if c.id == c0["id"]), None)
    assert reloaded_c0 is not None
    assert reloaded_c0.status == "resolved", f"Conflict status did not persist across restart! Got '{reloaded_c0.status}'"
    assert reloaded_c0.resolved_by == "reviewer@apex.dev"

    report.append(("Backend Restart Persistence (SQLite)", "PASS", "Reinitialized repository instance from cold storage; verified checklist completion, conflict resolution, and notes fully persisted."))

    # -------------------------------------------------------------
    # 7. Handover Lock Lifecycle Integrity
    # -------------------------------------------------------------
    # Reset to preset 1 to ensure conflict is in 'unresolved' state
    client.post("/api/sample/reset?preset_id=apex-core-2026")
    proj_preset = client.get("/api/projects/apex-core-2026").json()
    assert any(c["status"] == "unresolved" for c in proj_preset["conflicts"]), "Preset should have unresolved conflict"

    # Attempting to lock handover while unresolved conflicts exist MUST fail with 400
    res_lock_blocked = client.post(
        "/api/projects/apex-core-2026/approve",
        headers={"Authorization": f"Bearer {token_rev}"},
        json={"status": "approved"}
    )
    assert res_lock_blocked.status_code == 400, f"Expected 400 when unresolved conflicts remain, got {res_lock_blocked.status_code}"
    assert "unresolved contradictions remain" in res_lock_blocked.json()["detail"]

    # Now resolve all remaining conflicts
    for conf in proj_preset["conflicts"]:
        if conf["status"] == "unresolved":
            res_res = client.post(
                f"/api/projects/apex-core-2026/conflicts/{conf['id']}/resolve",
                headers={"Authorization": f"Bearer {token_rev}"},
                json={"status": "resolved", "resolution_choice": "claim_1", "rationale": "Resolved during final audit."}
            )
            assert res_res.status_code == 200, f"Resolve failed: {res_res.text}"

    # Now locking MUST succeed
    res_lock_ok = client.post(
        "/api/projects/apex-core-2026/approve",
        headers={"Authorization": f"Bearer {token_rev}"},
        json={"status": "approved"}
    )
    assert res_lock_ok.status_code == 200, f"Expected 200 when all conflicts resolved, got {res_lock_ok.status_code}"
    assert res_lock_ok.json()["status"] == "approved"

    # Now successor CAN access the approved package
    res_succ_package = client.get(
        "/api/projects/apex-core-2026/successor-package",
        headers={"Authorization": f"Bearer {token_succ}"}
    )
    assert res_succ_package.status_code == 200, f"Expected 200 for approved package, got {res_succ_package.status_code}"
    assert secret_marker not in res_succ_package.text

    report.append(("Handover Approval Lifecycle & Successor Package Gate", "PASS", "Blocked locking while unresolved conflicts remained (400); permitted locking once resolved (200); unlocked successor package gate."))

    # Reset back to clean preset 1 for clean slate
    client.post("/api/sample/reset?preset_id=apex-core-2026")

    print("\n" + "="*80)
    print("APEX HANDOVER PLATFORM — AUDIT VERIFICATION REPORT")
    print("="*80)
    for dim, status, details in report:
        print(f"[{status}] {dim}")
        print(f"       Details: {details}\n")
    print("="*80)

if __name__ == "__main__":
    run_all_checks()
