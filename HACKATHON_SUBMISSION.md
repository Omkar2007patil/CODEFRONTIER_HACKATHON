# Apex Coders Knowledge Handover Platform
### CodeFrontier Hackathon — Round 3 Final Build Submission Dossier

**Team APEX CODERS (VIT Pune)**
- **Aayush Patil** — Team Lead & Full-Stack Architect
- **Omkar Patil** — Backend, Data & Security Lead

---

## 1. 60–90 Second Judge Presentation Script

> "Hello Judges! Every time a software engineer departs a team, institutional knowledge vanishes into fragmented Slack chats, undocumented assumptions, and broken timelines. Existing AI summarizers hallucinate facts and invent deadlines without evidence, leaving incoming engineers with technical debt.
>
> We built the **Apex Coders Knowledge Handover Platform**—a competition-grade transition engine built on zero hallucinations and deterministic provenance.
>
> In Round 3, we built four key innovations:
>
> **First, Multi-Format Provenance Ingestion**: We support TXT, Markdown, PDFs with page numbers, DOCX with paragraph numbers, CSVs with row numbers, and JSON with object paths. Every claim links directly to its verbatim source excerpt.
>
> **Second, Cross-Document Contradiction Detection**: We don't just extract claims; we detect contradictions across disparate documents. If an Architecture Decision Record mandates an API freeze on Nov 10, but a sprint task targets a public release on Nov 15 without buffer, our engine flags this contradiction immediately and requires human engineering resolution.
>
> **Third, Backend-Enforced Role-Based Access Control**: We don't rely on frontend dropdowns. Our FastAPI backend cryptographically validates JWT tokens. Outgoing engineers can draft and ingest; Lead Reviewers can triage and resolve conflicts; and Incoming Successors receive a strictly sanitized, approved-only transition package.
>
> **Fourth, Server-Side Credential Redaction & Persistent Checklist**: Secrets, tokens, and database passwords are redacted on the server before reaching the client or export files. Meanwhile, our 10-point persistent successor checklist tracks Day 1 to 30 continuation in a transactional SQLite database.
>
> 42 automated tests verify every security boundary, citation anchor, and conflict rule. The platform is ready for live evaluation."

---

## 2. 3–5 Minute Live Demonstration Walkthrough

1. **System Health & Overview**:
   - Navigate to `http://localhost:5173`.
   - Observe the live backend status indicator (`// SYS_LIVE_API`) connected to SQLite on Port 8000.
   - Click `[ ⚡ 60s_TOUR ]` in the top navigation bar to begin the guided judge tour.

2. **Claim Provenance & Citation Anchoring**:
   - In Step 1, click `[ VIEW CITATION ]` on Claim 1.
   - Watch the left IDE viewer automatically jump to `architecture_decision_record.md` with the verbatim quote highlighted.
   - Observe the `✓ SUPPORTED (100%)` badge and provenance explanation.

3. **Cross-Document Contradiction Resolution**:
   - In Step 2, observe Claim 3 flagged with the Neon Rose `CONTRADICTION` badge.
   - Click `[ VIEW SIDE-BY-SIDE ]` to open the Contradiction Analyzer.
   - Review the competing claims: ADR-004 (Freeze on Nov 10) vs Sprint Tasks (Launch on Nov 15).
   - Select `Accept Source A (Freeze)`, enter the engineering rationale: *"Product lead confirmed Nov 10 API freeze governs; public beta moved to Nov 22 to permit staging hardening."*
   - Click `Confirm Resolution` and observe the contradiction resolve and write to the audit log.

4. **Role-Based Access Control & Credential Redaction**:
   - In Reviewer mode, locate the staging API key claim (`ghp_mockApexTestStagingToken994821034`).
   - Switch identity in the header to `Successor (Taylor)` via the user menu.
   - Notice the secret is completely masked (`[REDACTED_API_KEY]`) server-side.
   - Attempt to toggle an approval as a successor—the backend enforces `403 Forbidden`.

5. **Day 1–30 Successor Checklist**:
   - In the Successor View, examine the 10-point persistent checklist loaded from SQLite.
   - Check off tasks such as *Review Architecture Records* and *Verify Milestones*.
   - Observe the Cerulean Blue progress bar animate and note that completion timestamps and user emails persist across page reloads.

6. **Multi-Format Document Upload**:
   - Click `[ + INGEST ]` in the header.
   - Select documents from `sample_documents/` (`.md`, `.txt`, `.csv`, `.json`, `.docx`, `.pdf`).
   - Click `[ INGEST & EXTRACT CLAIMS ]` to watch the server parse files, compute SHA-256 hashes, index provenance locations, and recalculate cross-document conflicts in real time.

7. **Production Handover Deliverables**:
   - Click `[ EXPORT (.MD) ]` to download `handover-brief.md`.
   - Click `[ AUDIT (.JSON) ]` to download `handover-audit.json`.
   - Verify that all claims contain provenance citations and zero sensitive secrets are leaked.

---

## 3. Technology Stack & Architecture

- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI 0.141+, Pydantic v2, Uvicorn, PyJWT, pypdf, python-docx parser.
- **Database**: Relational SQLite database with WAL mode and atomic ACID transactions (`backend/data/handover_platform.db`).
- **Test Suite**: Pytest 9.2 with 42 automated tests covering ingestion, evidence, conflicts, RBAC, redaction, and checklist workflows.

---

## 4. Test Verification Summary

```
==================== test session starts ====================
platform win32 -- Python 3.13.15, pytest-9.2.0
collected 42 items

backend/tests/test_auth_rbac.py . . . . . .                   [ 14%]
backend/tests/test_checklist_workflow.py . . . . .            [ 26%]
backend/tests/test_conflicts.py . . . . . . .                 [ 42%]
backend/tests/test_evidence.py . . . . . . . .                [ 61%]
backend/tests/test_ingestion.py . . . . . . . . . .           [ 85%]
backend/tests/test_redaction.py . . . . . .                   [100%]

==================== 42 passed in 5.30s ====================
```

---
*Apex Coders — CodeFrontier Hackathon Round 3 Final Build*
