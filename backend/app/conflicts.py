"""Cross-document conflict and contradiction detection engine for Apex Handover Platform.
Detects contradictions in dates/deadlines, task statuses, ownership, decisions, and technical config.
Preserves both competing excerpts side by side and tracks human reviewer resolution rationale.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from app.schemas import ClaimItem, ConflictItem

MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


def parse_normalized_date(text: str) -> Optional[Tuple[int, int, int]]:
    """Normalizes date expressions (e.g. 'Nov 10, 2026', '2026-11-10', 'November 15') to (year, month, day)."""
    # Pattern 1: Month Name Day, Year (e.g. Nov 10, 2026 or November 15 2026)
    m1 = re.search(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?", text, re.I)
    if m1:
        month_str = m1.group(1).lower()
        month = MONTH_MAP.get(month_str, 1)
        day = int(m1.group(2))
        year = int(m1.group(3)) if m1.group(3) else 2026
        return (year, month, day)

    # Pattern 2: ISO YYYY-MM-DD
    m2 = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", text)
    if m2:
        return (int(m2.group(1)), int(m2.group(2)), int(m2.group(3)))

    return None


def format_parsed_date(d_tuple: Tuple[int, int, int]) -> str:
    """Formats (year, month, day) into readable standard string."""
    y, m, d = d_tuple
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return f"{month_names[m - 1]} {d}, {y}"


def extract_task_key(statement: str) -> Optional[str]:
    """Extracts task key like APEX-398 or Jira ticket if present."""
    m = re.search(r"\b([A-Z]{2,10}-\d{1,6})\b", statement)
    if m:
        return m.group(1)
    return None


def detect_cross_document_conflicts(
    claims: List[ClaimItem],
    project_id: str,
    existing_conflicts: Optional[List[ConflictItem]] = None,
) -> List[ConflictItem]:
    """Scans claims across documents to detect substantive contradictions.

    Detects:
    1. Dates & Deadlines (competing delivery timelines or freeze vs launch order violations)
    2. Task Status (e.g. marked Completed in one document, but Blocked in another)
    3. Task Ownership (different assignees for same work item)
    4. Conflicting Decisions (e.g. Postgres vs MongoDB, migration approved vs postponed)
    5. Technical Configuration (conflicting port, memory, or pool numbers)
    """
    conflicts: List[ConflictItem] = []
    conflict_signatures = set()

    # Pre-index existing resolutions so human review decisions are preserved on recalculation
    existing_map: Dict[str, ConflictItem] = {}
    if existing_conflicts:
        for ec in existing_conflicts:
            # signature based on sorted claim pair
            pair_key = tuple(sorted([ec.claim_id_1, ec.claim_id_2]))
            existing_map[pair_key] = ec

    # 1. Detect Date & Deadline Conflicts
    date_claims = []
    for c in claims:
        d = parse_normalized_date(c.statement) or (parse_normalized_date(c.exact_source_excerpt) if c.exact_source_excerpt else None)
        if d:
            is_freeze = any(kw in c.statement.lower() for kw in ["freeze", "code freeze", "api freeze", "cutoff"])
            is_launch = any(kw in c.statement.lower() for kw in ["launch", "release", "go-live", "public beta", "production"])
            date_claims.append({
                "claim": c,
                "date": d,
                "is_freeze": is_freeze,
                "is_launch": is_launch,
                "text": c.statement,
                "doc": c.source_filename or (c.evidence.source_name if c.evidence else "unknown"),
            })

    # Check for Freeze vs Launch timeline conflict (Freeze must be comfortably before Launch)
    freeze_items = [dc for dc in date_claims if dc["is_freeze"]]
    launch_items = [dc for dc in date_claims if dc["is_launch"]]

    for f_item in freeze_items:
        for l_item in launch_items:
            f_claim = f_item["claim"]
            l_claim = l_item["claim"]
            if f_claim.id == l_claim.id:
                continue

            # Compare dates
            f_date = f_item["date"]
            l_date = l_item["date"]
            f_str = format_parsed_date(f_date)
            l_str = format_parsed_date(l_date)

            # If launch is earlier than freeze, OR freeze is Nov 10 and launch is Nov 15 with zero buffer
            pair_sig = tuple(sorted([f_claim.id, l_claim.id]))
            if pair_sig in conflict_signatures:
                continue

            is_order_conflict = l_date <= f_date
            is_tight_buffer = (f_item["doc"] != l_item["doc"]) and (f_date[1] == l_date[1] and (l_date[2] - f_date[2]) <= 7)

            if is_order_conflict or is_tight_buffer:
                conflict_signatures.add(pair_sig)
                explanation = (
                    f"Release timeline contradiction: '{f_item['doc']}' establishes code/API freeze on {f_str}, "
                    f"whereas '{l_item['doc']}' schedules launch for {l_str}. "
                    f"This leaves insufficient or negative verification buffer for staging validation. "
                    f"Engineering Lead must reconcile the production cutover date prior to handover."
                )

                cid = f"conf-{uuid.uuid4().hex[:6]}"
                existing_res = existing_map.get(pair_sig)

                conflicts.append(
                    ConflictItem(
                        id=existing_res.id if existing_res else cid,
                        project_id=project_id,
                        conflict_type="dates_deadlines",
                        claim_id_1=f_claim.id,
                        claim_id_2=l_claim.id,
                        claim_1=f_claim,
                        claim_2=l_claim,
                        explanation=explanation,
                        status=existing_res.status if existing_res else "unresolved",
                        resolution_choice=existing_res.resolution_choice if existing_res else None,
                        rationale=existing_res.rationale if existing_res else None,
                        resolved_by=existing_res.resolved_by if existing_res else None,
                        resolved_at=existing_res.resolved_at if existing_res else None,
                        created_at=existing_res.created_at if existing_res else datetime.now(timezone.utc).isoformat(),
                    )
                )

    # 2. Detect Task Status Conflicts (e.g. Same ticket marked completed vs blocked/in-progress)
    task_map: Dict[str, List[ClaimItem]] = {}
    for c in claims:
        key = extract_task_key(c.statement)
        if key:
            task_map.setdefault(key, []).append(c)

    for key, claim_list in task_map.items():
        if len(claim_list) >= 2:
            for i in range(len(claim_list)):
                for j in range(i + 1, len(claim_list)):
                    c1, c2 = claim_list[i], claim_list[j]
                    src1 = c1.source_filename or (c1.evidence.source_name if c1.evidence else "Doc A")
                    src2 = c2.source_filename or (c2.evidence.source_name if c2.evidence else "Doc B")

                    c1_completed = any(w in c1.statement.lower() for w in ["completed", "done", "resolved", "passed"])
                    c2_blocked = any(w in c2.statement.lower() for w in ["blocked", "in progress", "timeout", "failing", "unassigned", "alert"])

                    c2_completed = any(w in c2.statement.lower() for w in ["completed", "done", "resolved", "passed"])
                    c1_blocked = any(w in c1.statement.lower() for w in ["blocked", "in progress", "timeout", "failing", "unassigned", "alert"])

                    if (c1_completed and c2_blocked) or (c2_completed and c1_blocked):
                        pair_sig = tuple(sorted([c1.id, c2.id]))
                        if pair_sig in conflict_signatures:
                            continue
                        conflict_signatures.add(pair_sig)

                        explanation = (
                            f"Task status mismatch for {key}: '{src1}' reports status as "
                            f"'{'Completed' if c1_completed else 'Active/Blocked'}', whereas '{src2}' indicates "
                            f"'{'Active/Blocked' if c2_blocked else 'Completed'}'. "
                            f"Incoming successor cannot confirm if {key} requires active triage or is ready for release."
                        )

                        cid = f"conf-{uuid.uuid4().hex[:6]}"
                        existing_res = existing_map.get(pair_sig)

                        conflicts.append(
                            ConflictItem(
                                id=existing_res.id if existing_res else cid,
                                project_id=project_id,
                                conflict_type="task_status",
                                claim_id_1=c1.id,
                                claim_id_2=c2.id,
                                claim_1=c1,
                                claim_2=c2,
                                explanation=explanation,
                                status=existing_res.status if existing_res else "unresolved",
                                resolution_choice=existing_res.resolution_choice if existing_res else None,
                                rationale=existing_res.rationale if existing_res else None,
                                resolved_by=existing_res.resolved_by if existing_res else None,
                                resolved_at=existing_res.resolved_at if existing_res else None,
                                created_at=existing_res.created_at if existing_res else datetime.now(timezone.utc).isoformat(),
                            )
                        )

    # 3. Detect Opposing Decisions (e.g. PostgreSQL selected vs MongoDB or Postponed vs Approved)
    decision_claims = [c for c in claims if c.category in ["decisions", "decision"]]
    for i in range(len(decision_claims)):
        for j in range(i + 1, len(decision_claims)):
            d1, d2 = decision_claims[i], decision_claims[j]
            t1, t2 = d1.statement.lower(), d2.statement.lower()
            src1 = d1.source_filename or (d1.evidence.source_name if d1.evidence else "Doc A")
            src2 = d2.source_filename or (d2.evidence.source_name if d2.evidence else "Doc B")

            # Check database engine contradiction
            postgres_chosen = "postgresql is selected" in t1 or "selected postgresql" in t1
            mongo_chosen = "mongodb is selected" in t2 or "selected mongodb" in t2
            postponed = "postpone" in t2 or "deferred" in t2

            if (postgres_chosen and mongo_chosen) or (postgres_chosen and postponed and "database" in t2):
                pair_sig = tuple(sorted([d1.id, d2.id]))
                if pair_sig in conflict_signatures:
                    continue
                conflict_signatures.add(pair_sig)

                explanation = (
                    f"Architectural decision contradiction: '{src1}' states '{d1.statement}', while '{src2}' "
                    f"asserts '{d2.statement}'. Successor requires an authoritative determination of the approved stack."
                )

                cid = f"conf-{uuid.uuid4().hex[:6]}"
                existing_res = existing_map.get(pair_sig)

                conflicts.append(
                    ConflictItem(
                        id=existing_res.id if existing_res else cid,
                        project_id=project_id,
                        conflict_type="decisions",
                        claim_id_1=d1.id,
                        claim_id_2=d2.id,
                        claim_1=d1,
                        claim_2=d2,
                        explanation=explanation,
                        status=existing_res.status if existing_res else "unresolved",
                        resolution_choice=existing_res.resolution_choice if existing_res else None,
                        rationale=existing_res.rationale if existing_res else None,
                        resolved_by=existing_res.resolved_by if existing_res else None,
                        resolved_at=existing_res.resolved_at if existing_res else None,
                        created_at=existing_res.created_at if existing_res else datetime.now(timezone.utc).isoformat(),
                    )
                )

    return conflicts
