"""Document Ingestion & Section Parsing Engine for Apex Handover Platform."""

import re
from typing import List, Dict, Any, Optional


class DocumentSection:
    def __init__(self, filename: str, heading: str, content: str, start_line: int, end_line: int):
        self.filename = filename
        self.heading = heading
        self.content = content
        self.start_line = start_line
        self.end_line = end_line

    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "heading": self.heading,
            "content": self.content,
            "start_line": self.start_line,
            "end_line": self.end_line,
        }


def parse_document_sections(filename: str, content: str) -> List[DocumentSection]:
    """Splits a markdown or text document into structured sections based on headings or structural breaks."""
    lines = content.splitlines()
    sections: List[DocumentSection] = []
    
    current_heading = "Header / Introduction"
    current_lines: List[str] = []
    start_line = 1

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        # Markdown headings (e.g. ## Title) or Bracketed headings (e.g. [Incidents & Blockers])
        is_md_heading = stripped.startswith("#")
        is_bracket_heading = bool(re.match(r"^\[.+\]$", stripped))
        
        if (is_md_heading or is_bracket_heading) and current_lines:
            section_content = "\n".join(current_lines).strip()
            if section_content:
                sections.append(
                    DocumentSection(
                        filename=filename,
                        heading=current_heading,
                        content=section_content,
                        start_line=start_line,
                        end_line=idx - 1,
                    )
                )
            current_heading = stripped.lstrip("#").strip("[] ")
            current_lines = [line]
            start_line = idx
        else:
            current_lines.append(line)

    if current_lines:
        section_content = "\n".join(current_lines).strip()
        if section_content:
            sections.append(
                DocumentSection(
                    filename=filename,
                    heading=current_heading,
                    content=section_content,
                    start_line=start_line,
                    end_line=len(lines),
                )
            )

    return sections


def find_quote_anchor(content: str, snippet: str) -> Optional[str]:
    """Finds line number or section context for an extracted snippet inside the document."""
    lines = content.splitlines()
    snippet_cleaned = snippet.strip()
    for idx, line in enumerate(lines, start=1):
        if snippet_cleaned in line or line.strip() in snippet_cleaned:
            return f"Line {idx}"
    return None

