from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ClaimCategory(str, Enum):
    decision = "decision"
    blocker = "blocker"
    next_action = "next_action"


class ClaimStatus(str, Enum):
    verified = "verified"
    uncertain = "uncertain"
    conflicting = "conflicting"


class Evidence(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    source_name: str
    snippet: str
    line_or_section: Optional[str] = None


class ClaimItem(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    id: str
    category: str
    statement: str
    status: str
    evidence: Optional[Evidence] = None
    conflict_notes: Optional[str] = None
    is_sensitive: bool = False
    is_approved: bool = True


class HandoverProject(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    project_id: str
    project_name: str
    outgoing_member: str
    intended_role: str
    summary: str
    raw_sources: List[Dict[str, Any]] = Field(default_factory=list)
    claims: List[ClaimItem] = Field(default_factory=list)


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
    updated_at: str
    claims_count: int
    conflicts_count: int


class ClaimStatusUpdatePayload(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    statement: Optional[str] = None
    status: Optional[str] = None
    is_approved: Optional[bool] = None
    is_sensitive: Optional[bool] = None
    conflict_notes: Optional[str] = None
