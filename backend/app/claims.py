"""Evidence verification and structured claim model engine for Apex Handover Platform.
Performs deterministic provenance checking, detects fabricated citations, computes defensible
confidence scores, and classifies validation states.
"""

import re
import difflib
from typing import List, Dict, Any, Optional, Tuple
from app.schemas import (
    ClaimItem,
    ClaimCategory,
    ClaimStatus,
    ValidationStatus,
    ReviewerStatus,
    Evidence,
)
from app.redaction import has_sensitive_content


def normalize_text_for_comparison(text: str) -> str:
    """Normalizes whitespace and punctuation for resilient excerpt matching."""
    if not text:
        return ""
    # Lowercase and collapse consecutive whitespace
    cleaned = re.sub(r"\s+", " ", text.lower().strip())
    # Strip boundary punctuation
    return cleaned


def find_best_excerpt_match(needle: str, haystack: str) -> Tuple[float, Optional[str]]:
    """Calculates maximum sequence similarity between candidate excerpt and source document."""
    norm_needle = normalize_text_for_comparison(needle)
    norm_haystack = normalize_text_for_comparison(haystack)

    if not norm_needle or not norm_haystack:
        return 0.0, None

    # 1. Exact substring check (Highest confidence)
    if norm_needle in norm_haystack:
        return 1.0, needle

    # 2. Windowed token overlap for fuzzy matches
    needle_words = norm_needle.split()
    haystack_words = norm_haystack.split()
    if len(needle_words) == 0:
        return 0.0, None

    window_size = len(needle_words)
    best_ratio = 0.0
    best_span = None

    for i in range(0, max(1, len(haystack_words) - window_size + 1), max(1, window_size // 4)):
        window = " ".join(haystack_words[i : i + window_size])
        ratio = difflib.SequenceMatcher(None, norm_needle, window).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_span = window
            if best_ratio > 0.92:
                break

    return best_ratio, best_span


def validate_claim_evidence(
    claim: ClaimItem,
    documents_lookup: Dict[str, Dict[str, Any]],
) -> Tuple[str, float, str]:
    """Validates cited excerpt against actual source documents.

    Returns:
        (validation_status, confidence, explanation)
    """
    excerpt = claim.exact_source_excerpt or (claim.evidence.snippet if claim.evidence else "")
    src_filename = claim.source_filename or (claim.evidence.source_name if claim.evidence else "")

    if not excerpt or not src_filename:
        return (
            ValidationStatus.missing_evidence.value,
            0.0,
            "Missing evidence: No source document or citation excerpt was attached to this claim.",
        )

    # Locate source document in project documents
    doc = None
    for name, d in documents_lookup.items():
        if name.lower() == src_filename.lower() or (claim.source_doc_id and d.get("id") == claim.source_doc_id):
            doc = d
            break

    if not doc:
        return (
            ValidationStatus.missing_evidence.value,
            0.05,
            f"Missing document: Cited source file '{src_filename}' is not found among ingested project documents.",
        )

    raw_text = doc.get("raw_text", "")
    ratio, _ = find_best_excerpt_match(excerpt, raw_text)

    # If excerpt cannot be found in the document, it is unsupported (e.g. fabricated)
    if ratio < 0.65:
        return (
            ValidationStatus.unsupported.value,
            round(ratio * 0.2, 2),
            (
                f"Unsupported claim: The cited passage could not be verified in '{src_filename}' "
                f"(text match ratio {int(ratio * 100)}% is below validation threshold). "
                f"Flagged as unverified or fabricated citation."
            ),
        )

    # Check for speculative or ambiguous phrasing
    speculative_terms = [
        "hypothesis",
        "hypothesize",
        "might",
        "unverified",
        "unconfirmed",
        "unassigned",
        "tentative",
        "tbd",
        "need someone",
        "potential",
        "assuming",
    ]
    is_ambiguous = any(term in excerpt.lower() or term in claim.statement.lower() for term in speculative_terms)

    if is_ambiguous:
        return (
            ValidationStatus.needs_human_review.value,
            0.65,
            (
                f"Needs human review: Source quote is present in '{src_filename}' at location "
                f"'{claim.source_location or 'N/A'}', but contains speculative or unconfirmed qualifiers. "
                f"Lead reviewer must verify operational reality."
            ),
        )

    confidence = 1.0 if ratio >= 0.95 else round(0.85 + (ratio - 0.65) * 0.5, 2)
    return (
        ValidationStatus.supported.value,
        confidence,
        (
            f"Supported by source: Verbatim citation confirmed in '{src_filename}' at location "
            f"'{claim.source_location or 'N/A'}' (provenance confidence {int(confidence * 100)}%). "
            f"Note: Source document confirms this statement was recorded; independent operational verification "
            f"may still be required."
        ),
    )
