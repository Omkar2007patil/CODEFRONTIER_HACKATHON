"""Automated tests for Cross-Document Conflict Engine (Outcome C)."""

import os
import pytest
from app.schemas import ClaimItem, Evidence, ConflictItem
from app.conflicts import (
    detect_cross_document_conflicts,
    parse_normalized_date,
    format_parsed_date,
    extract_task_key,
)
from app.storage import repo


class TestConflictEngine:
    def test_parse_normalized_date(self):
        d1 = parse_normalized_date("All changes stop on November 10, 2026.")
        assert d1 == (2026, 11, 10)
        assert format_parsed_date(d1) == "Nov 10, 2026"

        d2 = parse_normalized_date("Launch target 2026-11-15.")
        assert d2 == (2026, 11, 15)

    def test_extract_task_key(self):
        assert extract_task_key("Database migration task (APEX-398) verified") == "APEX-398"
        assert extract_task_key("Ticket JIRA-402 is blocked") == "JIRA-402"
        assert extract_task_key("General note without ticket") is None

    def test_detect_timeline_contradiction(self):
        c1 = ClaimItem(
            id="c-freeze",
            category="project_dates_milestones",
            statement="All breaking API changes must cease by the API freeze milestone on November 10, 2026.",
            source_filename="adr_004.md",
            source_location="ADR-004",
            exact_source_excerpt="API freeze milestone on November 10, 2026.",
        )
        c2 = ClaimItem(
            id="c-launch",
            category="project_dates_milestones",
            statement="Production launch scheduled for Nov 15, 2026 with final QA signoff Nov 14.",
            source_filename="sprint_tasks.txt",
            source_location="Milestones",
            exact_source_excerpt="Production launch scheduled for Nov 15, 2026",
        )

        conflicts = detect_cross_document_conflicts([c1, c2], project_id="proj-test")
        assert len(conflicts) >= 1
        conf = conflicts[0]
        assert conf.conflict_type == "dates_deadlines"
        assert conf.status == "unresolved"
        assert "adr_004.md" in conf.explanation
        assert "sprint_tasks.txt" in conf.explanation

    def test_detect_task_status_contradiction(self):
        c1 = ClaimItem(
            id="c-task-done",
            category="task_status",
            statement="Task APEX-398 database migration is completed and verified on staging.",
            source_filename="release_log.md",
            source_location="Line 10",
        )
        c2 = ClaimItem(
            id="c-task-blocked",
            category="task_status",
            statement="Database migration scripts execution (APEX-398) is blocked by unassigned DBA.",
            source_filename="sprint_board.txt",
            source_location="Line 25",
        )

        conflicts = detect_cross_document_conflicts([c1, c2], project_id="proj-test")
        assert len(conflicts) >= 1
        conf = conflicts[0]
        assert conf.conflict_type == "task_status"
        assert "APEX-398" in conf.explanation

    def test_detect_decision_contradiction(self):
        c1 = ClaimItem(
            id="c-dec-pg",
            category="decisions",
            statement="PostgreSQL is selected for compliance event streaming and audit trail storage.",
            source_filename="adr_001.md",
            source_location="ADR-001",
        )
        c2 = ClaimItem(
            id="c-dec-mongo",
            category="decisions",
            statement="MongoDB is selected for compliance event streaming due to sharding requirements.",
            source_filename="data_strategy.md",
            source_location="Section 2",
        )

        conflicts = detect_cross_document_conflicts([c1, c2], project_id="proj-test")
        assert len(conflicts) >= 1
        conf = conflicts[0]
        assert conf.conflict_type == "decisions"
        assert "Architectural decision contradiction" in conf.explanation

    def test_non_conflicting_claims_not_flagged(self):
        c1 = ClaimItem(
            id="c-clean-1",
            category="decisions",
            statement="Migrated token signing from RS256 to Ed25519 for low latency.",
            source_filename="adr_009.md",
        )
        c2 = ClaimItem(
            id="c-clean-2",
            category="next_action",
            statement="Rotate external identity provider client secrets in AWS Secrets Manager.",
            source_filename="auth_ops.txt",
        )

        conflicts = detect_cross_document_conflicts([c1, c2], project_id="proj-clean")
        assert len(conflicts) == 0

    def test_human_resolution_workflow_and_audit(self):
        proj = repo.reset_to_preset("apex-core-2026")
        assert len(proj.conflicts) >= 1
        target_conf = proj.conflicts[0]
        assert target_conf.status == "unresolved"

        # Reviewer resolves conflict with rationale
        resolved = repo.resolve_conflict(
            project_id=proj.project_id,
            conflict_id=target_conf.id,
            status="resolved",
            resolution_choice="accept_claim_1",
            rationale="Product team confirmed API freeze milestone on Nov 10 governs. Launch moved to Nov 22 to permit staging hardening.",
            resolved_by="reviewer@apex.dev",
        )

        assert resolved.status == "resolved"
        assert resolved.resolution_choice == "accept_claim_1"
        assert "Product team confirmed" in resolved.rationale
        assert resolved.resolved_by == "reviewer@apex.dev"
        assert resolved.resolved_at is not None

        # Re-fetching project confirms persistence
        refetched = repo.get_project(proj.project_id)
        saved_conf = next(c for c in refetched.conflicts if c.id == target_conf.id)
        assert saved_conf.status == "resolved"
