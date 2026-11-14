"""Sensitive text detection and server-side redaction engine for Apex Handover Platform.
Ensures zero leakage of credentials, tokens, and private connection strings to unauthorized consumers.
"""

import re
from typing import List, Dict, Any, Optional
from app.schemas import ClaimItem, HandoverProject

# Sensitive pattern definitions
SENSITIVE_PATTERNS = [
    ("api_key", r"(?i)(api[_-]?key)\s*[:=]\s*['\"][A-Za-z0-9_\-\.]{8,}['\"]", "[REDACTED_API_KEY]"),
    ("github_token", r"(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})", "[REDACTED_GITHUB_TOKEN]"),
    ("aws_key", r"(AKIA[0-9A-Z]{16})", "[REDACTED_AWS_KEY]"),
    ("bearer_token", r"(?i)(bearer)\s+[A-Za-z0-9_\-\.]{20,}", "[REDACTED_BEARER_TOKEN]"),
    ("jwt_token", r"(ey[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,})", "[REDACTED_JWT_TOKEN]"),
    ("connection_string", r"(?i)(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis)://[^\s:]+:[^\s@]+@[^\s/]+/[^\s]*", "[REDACTED_CONNECTION_STRING]"),
    ("password", r"(?i)(password|passwd|secret)\s*[:=]\s*['\"][^'\"]{4,}['\"]", "[REDACTED_PASSWORD]"),
    ("private_key", r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----", "[REDACTED_PRIVATE_KEY]"),
]


def detect_sensitive_spans(text: str) -> List[Dict[str, Any]]:
    """Identifies sensitive patterns within text without logging the plaintext values."""
    matches = []
    if not text:
        return matches

    for secret_type, pattern, replacement in SENSITIVE_PATTERNS:
        for m in re.finditer(pattern, text):
            matches.append({
                "secret_type": secret_type,
                "start": m.start(),
                "end": m.end(),
                "replacement": replacement,
            })
    return matches


def has_sensitive_content(text: str) -> bool:
    """Returns True if any sensitive credential pattern matches."""
    if not text:
        return False
    for _, pattern, _ in SENSITIVE_PATTERNS:
        if re.search(pattern, text):
            return True
    return False


def mask_sensitive_text(text: str) -> str:
    """Replaces all matched sensitive credentials with secure redaction placeholders."""
    if not text:
        return text
    sanitized = text
    for _, pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized)
    return sanitized


def sanitize_claim_for_role(claim: ClaimItem, user_role: Optional[str]) -> ClaimItem:
    """Sanitizes claim statement, excerpt, and evidence for non-reviewer roles."""
    # Project reviewers can inspect raw evidence and manage redactions
    if user_role == "project_reviewer":
        return claim

    # Successors and unauthorized viewers must never see plaintext secrets
    sanitized_claim = claim.model_copy(deep=True)
    if sanitized_claim.is_sensitive or has_sensitive_content(sanitized_claim.statement):
        sanitized_claim.statement = mask_sensitive_text(sanitized_claim.statement)
        sanitized_claim.is_sensitive = True

    if sanitized_claim.exact_source_excerpt:
        sanitized_claim.exact_source_excerpt = mask_sensitive_text(sanitized_claim.exact_source_excerpt)

    if sanitized_claim.evidence:
        sanitized_claim.evidence.snippet = mask_sensitive_text(sanitized_claim.evidence.snippet)

    if sanitized_claim.conflict_notes:
        sanitized_claim.conflict_notes = mask_sensitive_text(sanitized_claim.conflict_notes)

    return sanitized_claim


def sanitize_project_for_successor(project: HandoverProject) -> HandoverProject:
    """Prepares successor package: excludes unapproved claims and masks all credentials."""
    sanitized = project.model_copy(deep=True)

    # 1. Only include approved claims for successor
    sanitized_claims = []
    for c in sanitized.claims:
        if c.is_approved:
            sanitized_claims.append(sanitize_claim_for_role(c, user_role="incoming_successor"))
    sanitized.claims = sanitized_claims

    # 2. Mask any raw sources if present
    for src in sanitized.raw_sources:
        if "content" in src:
            src["content"] = mask_sensitive_text(src["content"])

    # 3. Mask conflict notes
    for conf in sanitized.conflicts:
        if conf.claim_1:
            conf.claim_1 = sanitize_claim_for_role(conf.claim_1, user_role="incoming_successor")
        if conf.claim_2:
            conf.claim_2 = sanitize_claim_for_role(conf.claim_2, user_role="incoming_successor")
        conf.explanation = mask_sensitive_text(conf.explanation)
        if conf.rationale:
            conf.rationale = mask_sensitive_text(conf.rationale)

    return sanitized
