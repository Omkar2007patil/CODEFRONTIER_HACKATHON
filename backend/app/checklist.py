"""Persistent successor transition checklist engine for Apex Handover Platform.
Maintains project-specific onboarding checklists in SQLite with timestamped progress tracking.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.db import get_db_connection
from app.schemas import ChecklistItem

DEFAULT_CHECKLIST_TEMPLATE = [
    {
        "task_key": "review_overview",
        "title": "Review Project Overview & Executive Summary",
        "description": "Understand core domain, business context, departing architect handover notes, and intended successor scope.",
        "category": "orientation",
        "sort_order": 1,
    },
    {
        "task_key": "review_architecture",
        "title": "Review Architecture Decision Records (ADRs)",
        "description": "Examine accepted architectural decisions (e.g., PostgreSQL for audit trails, service boundaries, data models).",
        "category": "architecture",
        "sort_order": 2,
    },
    {
        "task_key": "verify_milestones",
        "title": "Review Current Milestones & Reconciled Deadlines",
        "description": "Confirm freeze dates, QA sign-off targets, and reconciled launch milestones without date conflicts.",
        "category": "planning",
        "sort_order": 3,
    },
    {
        "task_key": "understand_ownership",
        "title": "Understand Task Ownership & Active Sprint Backlog",
        "description": "Identify open sprint tasks, unassigned tickets, and key engineering points of contact.",
        "category": "operations",
        "sort_order": 4,
    },
    {
        "task_key": "review_risks",
        "title": "Review Open Blockers, Incidents & Staging Alerts",
        "description": "Review outstanding operational blockers (e.g. Redis timeouts, cache pool sizes, firewall rules) and hypotheses.",
        "category": "operations",
        "sort_order": 5,
    },
    {
        "task_key": "inspect_conflicts",
        "title": "Inspect Resolved Conflicts & Reviewer Rationale",
        "description": "Verify why historical cross-document contradictions were resolved and what decision choices were approved.",
        "category": "compliance",
        "sort_order": 6,
    },
    {
        "task_key": "verify_environment",
        "title": "Verify Environment Configuration (Sanitized)",
        "description": "Confirm required environment variables and staging endpoints exist without exposing private secrets.",
        "category": "security",
        "sort_order": 7,
    },
    {
        "task_key": "confirm_access",
        "title": "Confirm Staging & Repository Access via Approved Procedures",
        "description": "Validate IAM roles, staging VPN access, database read replicas, and CI/CD deployment permissions.",
        "category": "security",
        "sort_order": 8,
    },
    {
        "task_key": "review_documentation",
        "title": "Review Runbooks & Operational Documentation",
        "description": "Walk through deployment procedures, rollback plans, monitoring dashboards, and disaster recovery runbooks.",
        "category": "documentation",
        "sort_order": 9,
    },
    {
        "task_key": "confirm_handover",
        "title": "Confirm Handover Completion with Engineering Lead",
        "description": "Conduct final handover sync with Lead Reviewer, record sign-off, and transition primary on-call rotation.",
        "category": "signoff",
        "sort_order": 10,
    },
]


def initialize_project_checklist(project_id: str):
    """Seeds the 10-point default successor checklist for a project if not already present."""
    conn = get_db_connection()
    cur = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()

    for item in DEFAULT_CHECKLIST_TEMPLATE:
        cur.execute(
            "SELECT id FROM checklist_items WHERE project_id = ? AND task_key = ?",
            (project_id, item["task_key"]),
        )
        if not cur.fetchone():
            cid = f"chk-{uuid.uuid4().hex[:6]}"
            cur.execute(
                """
                INSERT INTO checklist_items (
                    id, project_id, task_key, title, description, category,
                    status, completed_by, completed_at, notes, sort_order, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?)
                """,
                (
                    cid,
                    project_id,
                    item["task_key"],
                    item["title"],
                    item["description"],
                    item["category"],
                    item["sort_order"],
                    now_str,
                ),
            )

    conn.commit()
    conn.close()


def get_project_checklist(project_id: str) -> List[ChecklistItem]:
    """Retrieves all checklist items for a project sorted by sort_order."""
    initialize_project_checklist(project_id)
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, project_id, task_key, title, description, category,
               status, completed_by, completed_at, notes, sort_order, created_at
        FROM checklist_items
        WHERE project_id = ?
        ORDER BY sort_order ASC
        """,
        (project_id,),
    )
    rows = cur.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append(
            ChecklistItem(
                id=r["id"],
                project_id=r["project_id"],
                task_key=r["task_key"],
                title=r["title"],
                description=r["description"],
                category=r["category"],
                status=r["status"],
                completed_by=r["completed_by"],
                completed_at=r["completed_at"],
                notes=r["notes"],
                sort_order=r["sort_order"],
                created_at=r["created_at"],
            )
        )
    return items


def update_checklist_task_status(
    project_id: str,
    task_key: str,
    status: str,
    user_email: str,
    notes: Optional[str] = None,
) -> Optional[ChecklistItem]:
    """Updates a checklist task status and records completion metadata."""
    conn = get_db_connection()
    cur = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat() if status == "completed" else None
    completed_by = user_email if status == "completed" else None

    cur.execute(
        """
        UPDATE checklist_items
        SET status = ?, completed_by = ?, completed_at = ?, notes = COALESCE(?, notes)
        WHERE project_id = ? AND task_key = ?
        """,
        (status, completed_by, now_str, notes, project_id, task_key),
    )
    conn.commit()

    cur.execute(
        """
        SELECT id, project_id, task_key, title, description, category,
               status, completed_by, completed_at, notes, sort_order, created_at
        FROM checklist_items
        WHERE project_id = ? AND task_key = ?
        """,
        (project_id, task_key),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    return ChecklistItem(
        id=row["id"],
        project_id=row["project_id"],
        task_key=row["task_key"],
        title=row["title"],
        description=row["description"],
        category=row["category"],
        status=row["status"],
        completed_by=row["completed_by"],
        completed_at=row["completed_at"],
        notes=row["notes"],
        sort_order=row["sort_order"],
        created_at=row["created_at"],
    )
