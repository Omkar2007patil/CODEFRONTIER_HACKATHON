"""Automated tests for Evidence Verification & Claim Provenance (Outcome B)."""

import os
import pytest
from app.schemas import ClaimItem, Evidence
from app.claims import validate_claim_evidence, normalize_text_for_comparison, find_best_excerpt_match


class TestEvidenceVerification:
    def test_normalize_text_for_comparison(self):
        t1 = "  PostgreSQL is   selected for  Audit-Trail!  "
        assert normalize_text_for_comparison(t1) == "postgresql is selected for audit-trail!"

    def test_find_best_excerpt_match_verbatim(self):
        doc = "Architecture Decision: PostgreSQL is selected for audit trail storage due to ACID compliance."
        excerpt = "PostgreSQL is selected for audit trail storage"
        ratio, span = find_best_excerpt_match(excerpt, doc)
        assert ratio == 1.0
        assert span == excerpt

    def test_find_best_excerpt_match_fuzzy(self):
        doc = "PostgreSQL was selected for audit-trail storage due to its ACID guarantees."
        excerpt = "PostgreSQL is selected for audit trail storage"
        ratio, _ = find_best_excerpt_match(excerpt, doc)
        assert ratio > 0.80

    def test_claim_with_valid_supporting_evidence(self):
        doc_content = "All breaking API changes must cease by the API freeze milestone on November 10, 2026."
        docs = {"adr-004.md": {"id": "doc-1", "filename": "adr-004.md", "raw_text": doc_content}}

        claim = ClaimItem(
            id="test-claim-1",
            category="decisions",
            statement="API freeze milestone is November 10, 2026.",
            source_filename="adr-004.md",
            source_location="ADR-004 Section 1",
            exact_source_excerpt="All breaking API changes must cease by the API freeze milestone on November 10, 2026.",
        )

        v_status, confidence, explanation = validate_claim_evidence(claim, docs)
        assert v_status == "supported"
        assert confidence == 1.0
        assert "Supported by source" in explanation

    def test_claim_with_missing_evidence(self):
        docs = {"adr-004.md": {"id": "doc-1", "filename": "adr-004.md", "raw_text": "Sample text"}}

        claim = ClaimItem(
            id="test-claim-2",
            category="decisions",
            statement="Uncited claim without evidence snippet.",
            source_filename=None,
            exact_source_excerpt=None,
        )

        v_status, confidence, explanation = validate_claim_evidence(claim, docs)
        assert v_status == "missing_evidence"
        assert confidence == 0.0
        assert "Missing evidence" in explanation

    def test_claim_with_missing_source_document(self):
        docs = {"adr-004.md": {"id": "doc-1", "filename": "adr-004.md", "raw_text": "Sample text"}}

        claim = ClaimItem(
            id="test-claim-3",
            category="decisions",
            statement="Claim pointing to non-existent file.",
            source_filename="ghost_document.docx",
            exact_source_excerpt="Some quoted sentence that never existed.",
        )

        v_status, confidence, explanation = validate_claim_evidence(claim, docs)
        assert v_status == "missing_evidence"
        assert "Missing document" in explanation

    def test_claim_with_fabricated_or_altered_citation(self):
        doc_content = "The team evaluated Kafka, RabbitMQ, and Redis for pub/sub messaging."
        docs = {"messaging.md": {"id": "doc-1", "filename": "messaging.md", "raw_text": doc_content}}

        # Claim claims Kafka was rejected and deleted, which is NOT in the text
        claim = ClaimItem(
            id="test-claim-4",
            category="decisions",
            statement="Kafka was completely deleted from production infrastructure.",
            source_filename="messaging.md",
            exact_source_excerpt="Kafka was completely deleted from production infrastructure due to excessive JVM memory footprint.",
        )

        v_status, confidence, explanation = validate_claim_evidence(claim, docs)
        assert v_status == "unsupported"
        assert confidence < 0.2
        assert "Unsupported claim" in explanation

    def test_claim_with_ambiguous_or_unassigned_qualifiers(self):
        doc_content = "Root Cause Hypothesis: Connection pool max_connections set too low or unverified packet drops."
        docs = {"retro.txt": {"id": "doc-1", "filename": "retro.txt", "raw_text": doc_content}}

        claim = ClaimItem(
            id="test-claim-5",
            category="risks_blockers",
            statement="Staging Redis times out due to packet drops.",
            source_filename="retro.txt",
            source_location="Line 1",
            exact_source_excerpt="Root Cause Hypothesis: Connection pool max_connections set too low or unverified packet drops.",
        )

        v_status, confidence, explanation = validate_claim_evidence(claim, docs)
        assert v_status == "needs_human_review"
        assert confidence == 0.65
        assert "Needs human review" in explanation
