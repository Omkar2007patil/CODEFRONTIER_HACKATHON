"""Golden handover dataset for Apex Coders Handover Platform.
Provides realistic engineering transition scenarios for Judge demonstration.
"""

from app.schemas import (
    HandoverProject,
    ClaimItem,
    Evidence,
    ValidationStatus,
    ReviewerStatus,
)

RAW_ADR_CONTENT = """# Architecture Decision Records (ADR) - Apex Core Platform
Project: Apex Enterprise Gateway
Last Updated: 2026-10-28
Author: Alex Chen (Lead Backend Architect)

## ADR-001: Persistent Audit Trail and Compliance Store
### Status
Accepted
### Context
We evaluated MongoDB vs PostgreSQL for compliance event streaming, user audit trails, and version immutability.
### Decision
PostgreSQL is selected for audit trail storage due to its ACID guarantees, robust JSONB support, and mature row-level security. SQLite will be used for rapid local test prototypes, but production and staging strictly utilize PostgreSQL.

---

## ADR-004: Release Timeline & API Freeze
### Status
Active
### Decision
All breaking API changes must cease by the API freeze milestone on November 10, 2026. The staging verification window closes Nov 12, prior to staging hardening.
"""

RAW_RETRO_CONTENT = """Team Retro & Operations Log - Nov 4, 2026
Facilitator: Alex Chen | Attendees: Core Backend Team

[Incidents & Blockers]
- STAGING ALERT: Redis cache cluster in staging times out under sustained load (connection timeout after 5000ms during mock stress test).
- Owner: UNASSIGNED. Alex logged the Jira ticket (APEX-412) but is transitioning off next week.
- Root Cause Hypothesis: Connection pool max_connections set too low (default 10) or keepalive packets being dropped by AWS VPC security group.
- STAGING ACCESS KEY (DEMO TEST ONLY): api_key = "ghp_mockApexTestStagingToken994821034" (DO NOT COMMIT TO PRODUCTION).

[Action items]
- Need incoming backend successor to profile connection pool and increase pool size.
- Audit staging Redis security group egress rules.
"""

RAW_SPRINT_CONTENT = """Sprint 44 Task Board & Milestones
Sprint Cycle: Oct 30 - Nov 15
Target Milestone: Phase 2 Public Beta Launch

Tasks:
- [IN PROGRESS] Database migration scripts execution (APEX-398)
  - Verify PostgreSQL schema matches migration scripts on staging instance.
- [BLOCKED] Staging cache timeout debugging (APEX-412) - Unassigned
- [PLANNED] Launch Schedule:
  - Sprint review & final QA sign-off: Nov 14, 2026.
  - Production Launch scheduled for Nov 15, 2026 (Note: Team lead announced public launch on Nov 15, despite API freeze target in ADR-004).
"""


def get_sample_handover_data() -> HandoverProject:
    """Returns Preset 1: Enterprise Gateway with cross-document release conflict and sensitive token."""
    return HandoverProject(
        project_id="apex-core-2026",
        project_name="Apex Core Enterprise Gateway",
        outgoing_member="Alex Chen (Lead Backend Architect)",
        intended_role="Senior Full-Stack / Backend Engineer (Successor)",
        summary=(
            "Alex Chen is departing the Apex Core Platform team. The backend is migrating to "
            "PostgreSQL for compliance-grade audit logging. A critical staging blocker in Redis "
            "caching requires immediate ownership, and a conflicting release schedule between "
            "ADR-004 and Sprint 44 must be reconciled before deployment."
        ),
        status="in_review",
        raw_sources=[
            {
                "filename": "architecture_decision_record.md",
                "file_type": "markdown",
                "content": RAW_ADR_CONTENT.strip(),
            },
            {
                "filename": "retro_notes_nov.txt",
                "file_type": "text",
                "content": RAW_RETRO_CONTENT.strip(),
            },
            {
                "filename": "sprint_tasks.txt",
                "file_type": "text",
                "content": RAW_SPRINT_CONTENT.strip(),
            },
        ],
        claims=[
            ClaimItem(
                id="claim-1",
                project_id="apex-core-2026",
                category="decisions",
                statement="PostgreSQL selected for audit trail storage due to ACID compliance and relational integrity.",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="architecture_decision_record.md",
                source_location="ADR-001: Persistent Audit Trail and Compliance Store",
                exact_source_excerpt="PostgreSQL is selected for audit trail storage due to its ACID guarantees, robust JSONB support, and mature row-level security.",
                extraction_method="deterministic_heuristic",
                explanation="Supported by source: Verbatim citation confirmed in 'architecture_decision_record.md' at ADR-001. Relational compliance store decision approved.",
                evidence=Evidence(
                    source_name="architecture_decision_record.md",
                    snippet="PostgreSQL is selected for audit trail storage due to its ACID guarantees, robust JSONB support, and mature row-level security.",
                    line_or_section="ADR-001: Persistent Audit Trail and Compliance Store",
                    location_type="heading",
                ),
                conflict_notes=None,
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
            ClaimItem(
                id="claim-2",
                project_id="apex-core-2026",
                category="risks_blockers",
                statement="Redis cache cluster in staging times out under sustained load; ticket APEX-412 has unassigned ownership.",
                status="uncertain",
                validation_status="needs_human_review",
                reviewer_status="approved",
                confidence=0.65,
                source_filename="retro_notes_nov.txt",
                source_location="Incidents & Blockers (Line 3)",
                exact_source_excerpt="STAGING ALERT: Redis cache cluster in staging times out under sustained load (connection timeout after 5000ms during mock stress test). Owner: UNASSIGNED.",
                extraction_method="deterministic_heuristic",
                explanation="Needs human review: Operational incident confirmed in 'retro_notes_nov.txt', but owner is UNASSIGNED and root cause hypothesis is unconfirmed.",
                evidence=Evidence(
                    source_name="retro_notes_nov.txt",
                    snippet="STAGING ALERT: Redis cache cluster in staging times out under sustained load (connection timeout after 5000ms during mock stress test). Owner: UNASSIGNED.",
                    line_or_section="Incidents & Blockers",
                    location_type="line",
                ),
                conflict_notes="Missing owner: Outgoing engineer logged APEX-412 but departing before assignment. Potential VPC or pool starvation.",
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
            ClaimItem(
                id="claim-3",
                project_id="apex-core-2026",
                category="project_dates_milestones",
                statement="All breaking API changes must cease by the API freeze milestone on November 10, 2026.",
                status="conflicting",
                validation_status="supported",
                reviewer_status="pending",
                confidence=0.92,
                source_filename="architecture_decision_record.md",
                source_location="ADR-004: Release Timeline & API Freeze",
                exact_source_excerpt="All breaking API changes must cease by the API freeze milestone on November 10, 2026.",
                extraction_method="deterministic_heuristic",
                explanation="Cross-document contradiction: ADR-004 establishes freeze on Nov 10, while sprint_tasks.txt targets public release Nov 15 with QA signoff Nov 14.",
                evidence=Evidence(
                    source_name="architecture_decision_record.md",
                    snippet="All breaking API changes must cease by the API freeze milestone on November 10, 2026.",
                    line_or_section="ADR-004: Release Timeline & API Freeze",
                    location_type="heading",
                ),
                conflict_notes=(
                    "Release date conflict: architecture_decision_record.md specifies API freeze on Nov 10, "
                    "whereas sprint_tasks.txt schedules launch for Nov 15 with QA sign-off on Nov 14. "
                    "Clarification needed from Product Lead before shipping."
                ),
                is_sensitive=False,
                is_approved=False,
                version=1,
            ),
            ClaimItem(
                id="claim-3b",
                project_id="apex-core-2026",
                category="project_dates_milestones",
                statement="Production Launch scheduled for Nov 15, 2026 with final QA sign-off on Nov 14.",
                status="conflicting",
                validation_status="supported",
                reviewer_status="pending",
                confidence=0.92,
                source_filename="sprint_tasks.txt",
                source_location="Sprint 44 Task Board & Milestones",
                exact_source_excerpt="Production Launch scheduled for Nov 15, 2026 (Note: Team lead announced public launch on Nov 15, despite API freeze target in ADR-004).",
                extraction_method="deterministic_heuristic",
                explanation="Contradicts ADR-004 freeze milestone: Launch scheduled without sufficient staging verification buffer.",
                evidence=Evidence(
                    source_name="sprint_tasks.txt",
                    snippet="Production Launch scheduled for Nov 15, 2026 (Note: Team lead announced public launch on Nov 15, despite API freeze target in ADR-004).",
                    line_or_section="Sprint 44 Task Board & Milestones",
                    location_type="line",
                ),
                conflict_notes="Contradicts ADR-004 freeze deadline of Nov 10.",
                is_sensitive=False,
                is_approved=False,
                version=1,
            ),
            ClaimItem(
                id="claim-4",
                project_id="apex-core-2026",
                category="next_action",
                statement="Step 1: Run migrations and verify the DB schema against the staging instance.",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="sprint_tasks.txt",
                source_location="Sprint 44 Task Board (APEX-398)",
                exact_source_excerpt="Verify PostgreSQL schema matches migration scripts on staging instance.",
                extraction_method="deterministic_heuristic",
                explanation="Supported by source: Action item verified from Sprint 44 active task backlog.",
                evidence=Evidence(
                    source_name="sprint_tasks.txt",
                    snippet="Verify PostgreSQL schema matches migration scripts on staging instance.",
                    line_or_section="Sprint 44 Task Board (APEX-398)",
                    location_type="line",
                ),
                conflict_notes=None,
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
            ClaimItem(
                id="claim-5",
                project_id="apex-core-2026",
                category="technical_configuration",
                statement="Staging test credential logged in operations retro: api_key = 'ghp_mockApexTestStagingToken994821034'",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="retro_notes_nov.txt",
                source_location="Incidents & Blockers (Line 6)",
                exact_source_excerpt='api_key = "ghp_mockApexTestStagingToken994821034"',
                extraction_method="deterministic_heuristic",
                explanation="Sensitive credential detected: GitHub PAT format matched. Server-side redaction required before successor handoff.",
                evidence=Evidence(
                    source_name="retro_notes_nov.txt",
                    snippet='api_key = "ghp_mockApexTestStagingToken994821034"',
                    line_or_section="Incidents & Blockers",
                    location_type="line",
                ),
                conflict_notes="Sensitive token flagged: Must be redacted from successor view and exports.",
                is_sensitive=True,
                is_approved=True,
                version=1,
            ),
        ],
    )


RAW_AUTH_ADR = """# ADR-009: Centralized JWT Signing Algorithm Migration
Project: Apex Central Auth & Identity Gateway
Author: Sarah Lin (Staff Security Architect)
Status: Accepted & Fully Verified

### Context
Legacy RS256 token signing incurred noticeable CPU overhead on high-throughput microservice verification hops.
### Decision
Migrated token signing from RS256 to Ed25519 (EdDSA over Curve25519) across all production OAuth2 token issuers. Benchmarking reveals a 4.2x speedup in token validation latency with reduced public key footprint (32 bytes).
"""

RAW_AUTH_OPS = """Identity Service Operations Brief & Staging Health
Review Date: 2026-11-08
Lead: Sarah Lin | Successor: Devika Nair

[Cluster Health]
- Staging and Canary clusters report 100% healthy health-checks across all pods. Zero open P0/P1 incidents.
- Session invalidation backend: Distributed Redis session store configured with active dual-region replication. Verified zero dropped sessions during failover test.

[Day-1 Transition Checklist]
- Rotate external identity provider client secrets in AWS Secrets Manager prior to Q1 rollout.
- Inspect Grafana telemetry board for /oauth/token p99 latency curve after traffic switch.
"""


def get_clean_auth_handover_data() -> HandoverProject:
    """Returns Preset 2: Clean, verified Auth microservice handoff (all-green, ready for lock)."""
    return HandoverProject(
        project_id="apex-auth-clean",
        project_name="Apex Auth & Identity Microservice",
        outgoing_member="Sarah Lin (Staff Security Architect)",
        intended_role="Devika Nair (Incoming Identity Lead)",
        summary=(
            "Sarah Lin is handing over the Apex Central Auth & Identity microservice to Devika Nair. "
            "All architectural decisions are benchmarked, JWT token signing is verified, zero blocking "
            "incidents exist on staging, and day-one continuation tasks are fully scoped."
        ),
        status="approved",
        raw_sources=[
            {
                "filename": "adr_009_ed25519_jwt.md",
                "file_type": "markdown",
                "content": RAW_AUTH_ADR.strip(),
            },
            {
                "filename": "auth_ops_brief.txt",
                "file_type": "text",
                "content": RAW_AUTH_OPS.strip(),
            },
        ],
        claims=[
            ClaimItem(
                id="auth-claim-1",
                project_id="apex-auth-clean",
                category="decisions",
                statement="Token signing migrated from RS256 to Ed25519 for low-latency elliptic curve cryptographic validation.",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="adr_009_ed25519_jwt.md",
                source_location="ADR-009: Centralized JWT Signing Algorithm Migration",
                exact_source_excerpt="Migrated token signing from RS256 to Ed25519 (EdDSA over Curve25519) across all production OAuth2 token issuers.",
                extraction_method="deterministic_heuristic",
                explanation="Supported by source: Benchmarked architecture decision recorded in ADR-009.",
                evidence=Evidence(
                    source_name="adr_009_ed25519_jwt.md",
                    snippet="Migrated token signing from RS256 to Ed25519 (EdDSA over Curve25519) across all production OAuth2 token issuers.",
                    line_or_section="ADR-009: Centralized JWT Signing Algorithm Migration",
                    location_type="heading",
                ),
                conflict_notes=None,
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
            ClaimItem(
                id="auth-claim-2",
                project_id="apex-auth-clean",
                category="technical_configuration",
                statement="Distributed Redis session invalidation backend configured with verified dual-region replication.",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="auth_ops_brief.txt",
                source_location="Cluster Health",
                exact_source_excerpt="Session invalidation backend: Distributed Redis session store configured with active dual-region replication. Verified zero dropped sessions during failover test.",
                extraction_method="deterministic_heuristic",
                explanation="Supported by source: Operational brief confirms 100% pod health and zero failover session drops.",
                evidence=Evidence(
                    source_name="auth_ops_brief.txt",
                    snippet="Session invalidation backend: Distributed Redis session store configured with active dual-region replication. Verified zero dropped sessions during failover test.",
                    line_or_section="Cluster Health",
                    location_type="heading",
                ),
                conflict_notes=None,
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
            ClaimItem(
                id="auth-claim-3",
                project_id="apex-auth-clean",
                category="next_action",
                statement="Rotate external identity provider client secrets in AWS Secrets Manager prior to Q1 rollout.",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="auth_ops_brief.txt",
                source_location="Day-1 Transition Checklist",
                exact_source_excerpt="Rotate external identity provider client secrets in AWS Secrets Manager prior to Q1 rollout.",
                extraction_method="deterministic_heuristic",
                explanation="Supported by source: Mandatory credential rotation scheduled prior to production rollout.",
                evidence=Evidence(
                    source_name="auth_ops_brief.txt",
                    snippet="Rotate external identity provider client secrets in AWS Secrets Manager prior to Q1 rollout.",
                    line_or_section="Day-1 Transition Checklist",
                    location_type="heading",
                ),
                conflict_notes=None,
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
            ClaimItem(
                id="auth-claim-4",
                project_id="apex-auth-clean",
                category="next_action",
                statement="Inspect Grafana telemetry board for /oauth/token p99 latency curve after traffic switch.",
                status="verified",
                validation_status="supported",
                reviewer_status="approved",
                confidence=1.0,
                source_filename="auth_ops_brief.txt",
                source_location="Day-1 Transition Checklist",
                exact_source_excerpt="Inspect Grafana telemetry board for /oauth/token p99 latency curve after traffic switch.",
                extraction_method="deterministic_heuristic",
                explanation="Supported by source: Real-time telemetry monitoring action verified from transition brief.",
                evidence=Evidence(
                    source_name="auth_ops_brief.txt",
                    snippet="Inspect Grafana telemetry board for /oauth/token p99 latency curve after traffic switch.",
                    line_or_section="Day-1 Transition Checklist",
                    location_type="heading",
                ),
                conflict_notes=None,
                is_sensitive=False,
                is_approved=True,
                version=1,
            ),
        ],
    )
