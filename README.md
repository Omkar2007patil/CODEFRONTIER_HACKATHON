# Apex Coders Knowledge Handover Platform
### CodeFrontier Hackathon — Round 3 Final Build Dossier

**Team APEX CODERS (VIT Pune)**
- **Aayush Patil** — Team Lead & Full-Stack Architect
- **Omkar Patil** — Backend, Data & Security Lead

---

## 1. Problem Statement & Core Value Proposition

Engineering transitions are notoriously brittle: when an engineer departs, institutional memory vanishes into undocumented slack threads, fragmented meeting notes, and unverified assumptions. Existing AI summarization tools hallucinate unsupported claims without citations, creating technical debt and shipping breaking deadlines.

**The Apex Coders Knowledge Handover Platform** introduces a **deterministic, evidence-backed knowledge transfer engine**:
1. **Multi-Format Ingestion**: Ingests TXT, Markdown, PDF (with page tracking), DOCX (with paragraph & heading tracking), CSV (with row numbers), and JSON (with JSON paths). Rejects corrupt, empty, and path-traversal files safely.
2. **Evidence Validation & Provenance**: Reconstructs structured claims across 8 categories with immutable anchors to exact source excerpts. Validates citations against source text, flags missing evidence, detects fabricated citations, and flags speculative claims as `NEEDS_HUMAN_REVIEW`.
3. **Cross-Document Conflict Detection**: Cross-references claims across documents to detect contradictions in dates/deadlines, task status, task ownership, and decisions. Displays competing statements side-by-side and enforces human reviewer resolution with compliance rationales.
4. **Backend-Enforced Role-Based Access Control (RBAC)**: Validates identity with JWT Bearer tokens. Enforces role permissions for **Lead Reviewer**, **Incoming Successor**, and **Outgoing Member**. Prohibits successors from modifying claims, resolving conflicts, or viewing unapproved packages (403 Forbidden).
5. **Server-Side Secret Redaction**: Automatically detects API keys, tokens, connection strings, and passwords. Strips secrets server-side before delivering data to successors or exports (`[REDACTED_...]`). Zero plaintext credentials in audit logs.
6. **Persistent Successor Transition Checklist**: Tracks Day 1–30 onboarding in SQLite with responsible user identity, completion timestamps, and live progress bars.
7. **Dual Deliverables**: Generates sanitized transition markdown (`handover-brief.md`) and machine-readable audit logs (`handover-audit.json`).

---

## 2. System Architecture & Data Flow

```mermaid
flowchart TD
    A["Raw Sources\n(PDF, DOCX, TXT, MD, CSV, JSON)"] --> B["Multi-Format Ingestion & Section Parser\n(Magic Bytes, Traversal Guard, Provenance Index)"]
    B --> C["Deterministic Claim Extractor & Evidence Validator\n(Exact Substring, Fuzzy Match, Speculative Qualifier Check)"]
    C --> D["Cross-Document Contradiction Engine\n(Timeline, Task Status, Ownership, Decision Conflicts)"]
    D --> E["SQLite Relational Database & Repository\n(WAL Mode, Atomic Transactions, Foreign Keys)"]
    E --> F["Reviewer Triage Studio\n(JWT RBAC, Side-by-Side Resolver, Secret Redaction)"]
    F --> G["Handover Approval Gate\n(Unresolved Conflict Check & Immutability)"]
    G --> H["Sanitized Successor Experience\n(Persistent Checklist, Zero Secret Leaks, Evidence Links)"]
    H --> I["Export Engine\n(handover-brief.md & handover-audit.json)"]
```

---

## 3. Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons.
- **Design System**: Active Theory Cybernetic Laboratory aesthetic (True Jet Black `#000000`, Cerulean Blue `#00F0FF`, Neon Rose `#FF007F`, hairline wireframe borders).
- **Backend**: FastAPI 0.141+, Pydantic v2 schemas (`use_enum_values=True`), Uvicorn ASGI server, PyJWT, pypdf, python-docx parser.
- **Persistence**: Relational SQLite database with WAL mode, parameterized queries, and ACID transactions (`backend/data/handover_platform.db`).
- **Security**: JWT HMAC-SHA256 tokens, PBKDF2-SHA256 password hashing with salt, server-side regex secret redaction.

---

## 4. Permission Matrix (RBAC Enforcement)

| Operation | Outgoing Member | Project Reviewer | Incoming Successor | Unauthenticated |
|---|:---:|:---:|:---:|:---:|
| **Upload Documents** | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| **Edit Claim Statement** | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| **Toggle Claim Approval** | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| **Redact Sensitive Content** | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| **Resolve Conflicts** | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| **Approve Handover Package** | ❌ 403 Forbidden | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 Unauthorized |
| **View Unapproved Project** | ✅ (Draft) | ✅ Allowed | ❌ 403 Forbidden | ❌ 401 / Sanitized |
| **View Approved Handover** | ✅ Allowed | ✅ Allowed | ✅ Sanitized | ✅ Sanitized |
| **Update Checklist Tasks** | ❌ 403 Forbidden | ✅ Allowed | ✅ Allowed | ❌ 401 Unauthorized |

---

## 5. Seeded Demo Accounts (for Evaluators)

| Role | Email | Password | Pre-configured Responsibilities |
|---|---|---|---|
| **Project Reviewer** | `reviewer@apex.dev` | `apexReviewer2026!` | Lead reviewer: full triage, resolution, redaction, and lock authority |
| **Incoming Successor** | `successor@apex.dev` | `apexSuccessor2026!` | Successor: sanitized transition package, checklist tracking |
| **Outgoing Member** | `outgoing@apex.dev` | `apexOutgoing2026!` | Departing engineer: upload documents and contribute draft claims |

*Note: For instant evaluation, use the one-click identity selector in the top-right header.*

---

## 6. Quickstart Guide (Execution & Testing)

### Automated Windows Launcher:
Double-click `run_app.bat` in the project root.

### Manual Launch Commands:

**1. Run the Backend Automated Test Suite (42 Tests):**
```powershell
python -m pytest backend/tests/ -v
```

**2. Start the FastAPI Backend:**
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Check: `http://127.0.0.1:8000/api/health`
- Swagger OpenAPI Docs: `http://127.0.0.1:8000/docs`

**3. Build & Run the React Frontend:**
```powershell
cd frontend
npm.cmd run build
npm.cmd run dev
```
- Web Application: `http://localhost:5173`

---

## 7. How Judges Can Evaluate the Platform in 3 Minutes

1. **Open `http://localhost:5173`**:
   - Inspect the **Landing & Team Dossier Showcase** explaining the institutional knowledge problem.
   - Click **[ ⚡ Try Live Demo ]** or click **[ ⚡ 60s_TOUR ]** in the top navigation bar.

2. **Step 1: Provenance & Evidence Verification**:
   - Click **[ VIEW CITATION ]** on Claim 1.
   - Notice the source document loads automatically with exact line/heading highlighting in the left IDE panel.
   - Observe the **✓ SUPPORTED (100%)** badge with provenance explanation.

3. **Step 2: Cross-Document Contradiction & Side-by-Side Resolution**:
   - Inspect the **Neon Rose CONTRADICTION** badge on Claim 3.
   - Click **[ VIEW SIDE-BY-SIDE ]** to open the Contradiction Analyzer modal.
   - Notice Document A specifies API Freeze on Nov 10, whereas Document B plans launch on Nov 15 with insufficient buffer.
   - Enter a reviewer rationale (e.g., *"Product team confirmed Nov 10 freeze governs; launch scheduled for Nov 22"*), select *"Accept Source A"*, and click **[ Confirm Resolution ]**.
   - Notice the conflict resolves and records an audit log.

4. **Step 3: Server-Side Secret Redaction**:
   - In Reviewer mode, locate the staging API key claim (`ghp_mockApexTestStagingToken994821034`).
   - Switch identity in the top header to **Successor (Taylor)**.
   - Notice the secret is completely masked (`[REDACTED_API_KEY]`) on the server before reaching the browser.

5. **Step 4: Persistent Successor Checklist**:
   - Switch to **SUCCESSOR** view.
   - Notice the 10-point persistent onboarding checklist loaded from the SQLite database.
   - Check off tasks (e.g., *Review Overview*, *Verify Milestones*).
   - Notice the Cerulean Blue progress bar animates, and the backend records completion timestamps and user email.

6. **Step 5: Multi-Format Document Ingestion**:
   - Click **[ + INGEST ]** in the top header.
   - Drag or pick any file from the included `sample_documents/` folder (`.md`, `.txt`, `.csv`, `.json`, `.docx`, `.pdf`).
   - Click **[ INGEST & EXTRACT CLAIMS ]** to observe live multi-file parsing with page, paragraph, row, or line provenance extraction.

7. **Step 6: Deliverable Exports**:
   - Click **[ EXPORT (.MD) ]** and **[ AUDIT (.JSON) ]** to download sanitized production handover deliverables.

---

## 8. Verified Features & Limitations

### Verified Features:
- 100% automated test suite passing (42 out of 42 tests).
- Real parsing of TXT, Markdown, PDF, DOCX, CSV, and JSON with page, paragraph, line, and row location provenance.
- Path traversal prevention, duplicate hash rejection, and size limit enforcement.
- Cross-document conflict detection for dates, task statuses, task owners, and architectural decisions.
- Backend JWT authentication with 401/403 role-based enforcement and seeded demo accounts.
- Server-side secret redaction preventing plaintext credential leakage in API payloads, exports, and audit logs.
- SQLite relational database with WAL mode and atomic transactions surviving application restarts.
- 10-point persistent successor checklist with completion tracking.

### Residual Limitations:
- Automated credential detection uses conservative regex heuristics; proprietary organizational secret formats require custom rules.
- Remote Vercel deployment requires environment variable `ALLOWED_ORIGINS` to be updated if pointing to a remote production backend URL instead of local backend.

---
*Team APEX CODERS — CodeFrontier Hackathon Round 3 Final Build*
