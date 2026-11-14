"""Pydantic v2 schemas for Apex Knowledge Handover Platform."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ClaimCategory(str, Enum):
    # Round 3 categories
    project_dates_milestones = "project_dates_milestones"
    task_status = "task_status"
    task_ownership = "task_ownership"
    decisions = "decisions"
    risks_blockers = "risks_blockers"
    technical_configuration = "technical_configuration"
    dependencies = "dependencies"
    other_facts = "other_facts"

    # Backward compatibility with Round 2
    decision = "decision"
    blocker = "blocker"
    next_action = "next_action"


class ClaimStatus(str, Enum):
    verified = "verified"
    uncertain = "uncertain"
    conflicting = "conflicting"


class ValidationStatus(str, Enum):
    supported = "supported"
    unsupported = "unsupported"
    missing_evidence = "missing_evidence"
    needs_human_review = "needs_human_review"


class ReviewerStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    changes_requested = "changes_requested"


class UserRole(str, Enum):
    outgoing_member = "outgoing_member"
    project_reviewer = "project_reviewer"
    incoming_successor = "incoming_successor"


class ProjectStatus(str, Enum):
    draft = "draft"
    in_review = "in_review"
    changes_requested = "changes_requested"
    approved = "approved"


class Evidence(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    source_name: str
    source_doc_id: Optional[str] = None
    snippet: str
    line_or_section: Optional[str] = None
    location_type: Optional[str] = "line"  # page, paragraph, line, row, json_path


class ClaimItem(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    project_id: Optional[str] = None
    category: str
    statement: str
    status: str = "verified"  # verified, uncertain, conflicting
    validation_status: str = "supported"  # supported, unsupported, missing_evidence, needs_human_review
    reviewer_status: str = "approved"  # pending, approved, rejected, changes_requested
    confidence: float = 1.0  # 0.0 - 1.0
    evidence: Optional[Evidence] = None
    source_doc_id: Optional[str] = None
    source_filename: Optional[str] = None
    source_location: Optional[str] = None
    exact_source_excerpt: Optional[str] = None
    extraction_method: str = "deterministic_heuristic"  # deterministic_heuristic, rule_engine, ai_gemini, manual
    explanation: Optional[str] = None
    conflict_notes: Optional[str] = None
    is_sensitive: bool = False
    is_approved: bool = True
    version: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ConflictItem(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    project_id: str
    conflict_type: str  # dates_deadlines, task_status, task_ownership, decisions, technical_config
    claim_id_1: str
    claim_id_2: str
    claim_1: Optional[ClaimItem] = None
    claim_2: Optional[ClaimItem] = None
    explanation: str
    status: str = "unresolved"  # unresolved, resolved, not_a_conflict
    resolution_choice: Optional[str] = None
    rationale: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None
    created_at: Optional[str] = None


class ChecklistItem(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    project_id: str
    task_key: str
    title: str
    description: str
    category: str
    status: str = "pending"  # pending, completed
    completed_by: Optional[str] = None
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    sort_order: int = 0
    created_at: Optional[str] = None


class ChecklistUpdatePayload(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    status: str  # pending, completed
    notes: Optional[str] = None


class ConflictResolutionPayload(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    status: str = "resolved"  # resolved, not_a_conflict, unresolved
    resolution_choice: Optional[str] = None  # accept_claim_1, accept_claim_2, override, both_valid
    rationale: str


class DocumentMetadata(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    project_id: str
    filename: str
    file_type: str
    file_size: int
    content_hash: str
    created_at: str
    sections_count: int = 0


class DocumentDetail(DocumentMetadata):
    raw_text: str
    sections: List[Dict[str, Any]] = Field(default_factory=list)


class HandoverProject(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    project_id: str
    project_name: str
    outgoing_member: str
    intended_role: str
    summary: str
    status: str = "draft"  # draft, in_review, changes_requested, approved
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    raw_sources: List[Dict[str, Any]] = Field(default_factory=list)
    claims: List[ClaimItem] = Field(default_factory=list)
    conflicts: List[ConflictItem] = Field(default_factory=list)
    checklist: List[ChecklistItem] = Field(default_factory=list)
    redactions_count: int = 0


class IngestPayload(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    project_name: str = "Apex Handover Project"
    outgoing_member: str = "Departing Engineer"
    intended_role: str = "Successor Engineer"
    raw_text: str
    filename: Optional[str] = "handover_notes.md"


class HandoverSnapshot(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    project_id: str
    project_name: str
    outgoing_member: str
    intended_role: str
    summary: str
    status: str = "draft"
    updated_at: str
    claims_count: int
    conflicts_count: int
    unresolved_conflicts_count: int = 0
    checklist_progress_pct: int = 0


class ClaimStatusUpdatePayload(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    statement: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    validation_status: Optional[str] = None
    reviewer_status: Optional[str] = None
    is_approved: Optional[bool] = None
    is_sensitive: Optional[bool] = None
    conflict_notes: Optional[str] = None
    explanation: Optional[str] = None


class UserProfile(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    email: str
    full_name: str
    role: str
    created_at: str


class LoginPayload(BaseModel):
    email: str
    password: str


class DemoLoginPayload(BaseModel):
    role: str  # outgoing_member, project_reviewer, incoming_successor


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class HandoverApprovePayload(BaseModel):
    status: str = "approved"  # in_review, approved, changes_requested
    notes: Optional[str] = None
