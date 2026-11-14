"""Multi-format document ingestion engine for Apex Handover Platform.
Supports TXT, Markdown, PDF, DOCX, CSV, and JSON with real file validation,
path traversal prevention, provenance tracking (page, para, line, row, json_path),
and duplicate detection.
"""

import os
import re
import csv
import json
import io
import uuid
import hashlib
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

import pypdf

# Upload and processing constraints
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_EXTRACTED_CHARS = 1_500_000         # 1.5M characters
ALLOWED_EXTENSIONS = {".txt", ".md", ".markdown", ".pdf", ".docx", ".csv", ".json"}


class ParsedSection:
    def __init__(
        self,
        section_id: str,
        filename: str,
        heading: str,
        content: str,
        location_type: str,
        location_ref: str,
        start_index: int,
        end_index: int,
    ):
        self.section_id = section_id
        self.filename = filename
        self.heading = heading
        self.content = content
        self.location_type = location_type  # page, paragraph, line, row, json_path
        self.location_ref = location_ref    # e.g., "Page 1", "Para 3", "Line 14-20", "Row 5"
        self.start_index = start_index
        self.end_index = end_index

    def to_dict(self) -> Dict[str, Any]:
        return {
            "section_id": self.section_id,
            "filename": self.filename,
            "heading": self.heading,
            "content": self.content,
            "location_type": self.location_type,
            "location_ref": self.location_ref,
            "start_index": self.start_index,
            "end_index": self.end_index,
        }


def sanitize_filename(filename: str) -> str:
    """Prevents directory traversal, stripping dangerous path separators and control characters."""
    base = os.path.basename(filename)
    # Strip null bytes and non-printable characters
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", base)
    # Strip dangerous path traversal symbols
    cleaned = cleaned.replace("..", "").replace("/", "").replace("\\", "").strip()
    if not cleaned:
        cleaned = f"upload_{uuid.uuid4().hex[:6]}.txt"
    return cleaned


def compute_sha256(data: bytes) -> str:
    """Computes SHA-256 cryptographic hash of byte stream."""
    return hashlib.sha256(data).hexdigest()


def detect_text_encoding(data: bytes) -> str:
    """Safely decodes raw bytes into text using robust fallbacks."""
    for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def parse_pdf_document(data: bytes, filename: str) -> Tuple[str, List[ParsedSection]]:
    """Extracts text from PDF retaining explicit page numbers."""
    if not data.startswith(b"%PDF-"):
        raise ValueError(f"File '{filename}' does not contain a valid PDF header (%PDF-).")

    stream = io.BytesIO(data)
    try:
        reader = pypdf.PdfReader(stream)
    except Exception as e:
        raise ValueError(f"Corrupt or unreadable PDF document '{filename}': {str(e)}")

    if reader.is_encrypted:
        try:
            # Attempt empty password decryption
            decrypted = reader.decrypt("")
            if not decrypted:
                raise ValueError(f"PDF document '{filename}' is password-encrypted.")
        except Exception:
            raise ValueError(f"PDF document '{filename}' is encrypted and cannot be parsed without password.")

    full_text_parts: List[str] = []
    sections: List[ParsedSection] = []

    for page_idx, page in enumerate(reader.pages):
        page_num = page_idx + 1
        page_text = page.extract_text() or ""
        clean_page_text = page_text.strip()
        if clean_page_text:
            full_text_parts.append(f"--- [Page {page_num}] ---\n{clean_page_text}")
            sections.append(
                ParsedSection(
                    section_id=f"sec-pdf-p{page_num}",
                    filename=filename,
                    heading=f"Page {page_num}",
                    content=clean_page_text,
                    location_type="page",
                    location_ref=f"Page {page_num}",
                    start_index=page_num,
                    end_index=page_num,
                )
            )

    full_text = "\n\n".join(full_text_parts)
    if not full_text.strip():
        raise ValueError(f"PDF document '{filename}' contains no extractable text (image-only or blank).")

    return full_text, sections


def parse_docx_document(data: bytes, filename: str) -> Tuple[str, List[ParsedSection]]:
    """Extracts text from DOCX (OpenXML) preserving paragraph indices and heading styles."""
    if not data.startswith(b"PK\x03\x04"):
        raise ValueError(f"File '{filename}' is not a valid OpenXML DOCX archive.")

    try:
        stream = io.BytesIO(data)
        with zipfile.ZipFile(stream) as z:
            if "word/document.xml" not in z.namelist():
                raise ValueError(f"DOCX archive '{filename}' lacks word/document.xml.")
            xml_content = z.read("word/document.xml")
    except Exception as e:
        raise ValueError(f"Corrupt DOCX archive '{filename}': {str(e)}")

    root = ET.fromstring(xml_content)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

    paragraphs: List[Tuple[str, str, int]] = []  # (style, text, para_num)
    para_counter = 0

    for p in root.iter(f"{{{ns['w']}}}p"):
        p_text = "".join(node.text for node in p.iter(f"{{{ns['w']}}}t") if node.text).strip()
        if not p_text:
            continue

        para_counter += 1
        # Style check (e.g., Heading1, Heading2, Title)
        style = "Normal"
        p_pr = p.find(f"{{{ns['w']}}}pPr")
        if p_pr is not None:
            p_style = p_pr.find(f"{{{ns['w']}}}pStyle")
            if p_style is not None:
                style = p_style.attrib.get(f"{{{ns['w']}}}val", "Normal")

        paragraphs.append((style, p_text, para_counter))

    if not paragraphs:
        raise ValueError(f"DOCX document '{filename}' contains no text.")

    sections: List[ParsedSection] = []
    full_text_parts: List[str] = []
    current_heading = "Document Header"

    for style, text, para_num in paragraphs:
        if "heading" in style.lower() or "title" in style.lower():
            current_heading = text

        full_text_parts.append(text)
        sections.append(
            ParsedSection(
                section_id=f"sec-docx-p{para_num}",
                filename=filename,
                heading=current_heading,
                content=text,
                location_type="paragraph",
                location_ref=f"Para {para_num} ({current_heading})",
                start_index=para_num,
                end_index=para_num,
            )
        )

    return "\n\n".join(full_text_parts), sections


def parse_csv_document(data: bytes, filename: str) -> Tuple[str, List[ParsedSection]]:
    """Extracts CSV records preserving column headers and row numbers."""
    text = detect_text_encoding(data)
    stream = io.StringIO(text)

    try:
        reader = list(csv.reader(stream))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file '{filename}': {str(e)}")

    if not reader:
        raise ValueError(f"CSV file '{filename}' is empty.")

    header = reader[0]
    sections: List[ParsedSection] = []
    full_text_lines: List[str] = [f"Header: {', '.join(header)}"]

    for row_idx, row in enumerate(reader[1:], start=2):
        if not any(cell.strip() for cell in row):
            continue
        record_desc = ", ".join(f"{h}: {v}" for h, v in zip(header, row) if v.strip())
        full_text_lines.append(f"Row {row_idx}: {record_desc}")
        sections.append(
            ParsedSection(
                section_id=f"sec-csv-r{row_idx}",
                filename=filename,
                heading=f"Row {row_idx}",
                content=record_desc,
                location_type="row",
                location_ref=f"Row {row_idx}",
                start_index=row_idx,
                end_index=row_idx,
            )
        )

    return "\n".join(full_text_lines), sections


def parse_json_document(data: bytes, filename: str) -> Tuple[str, List[ParsedSection]]:
    """Extracts JSON structure preserving object hierarchy and JSON paths."""
    text = detect_text_encoding(data)
    try:
        obj = json.loads(text)
    except Exception as e:
        raise ValueError(f"Invalid JSON in file '{filename}': {str(e)}")

    sections: List[ParsedSection] = []
    full_text_lines: List[str] = []

    def walk(val: Any, path: str):
        if isinstance(val, dict):
            for k, v in val.items():
                walk(v, f"{path}.{k}" if path else f"$.{k}")
        elif isinstance(val, list):
            for idx, item in enumerate(val):
                walk(item, f"{path}[{idx}]")
        else:
            val_str = str(val).strip()
            if val_str:
                entry = f"{path}: {val_str}"
                full_text_lines.append(entry)
                sections.append(
                    ParsedSection(
                        section_id=f"sec-json-{len(sections) + 1}",
                        filename=filename,
                        heading=path,
                        content=entry,
                        location_type="json_path",
                        location_ref=path,
                        start_index=len(sections) + 1,
                        end_index=len(sections) + 1,
                    )
                )

    walk(obj, "$")
    if not sections:
        raise ValueError(f"JSON document '{filename}' contains empty data.")

    return "\n".join(full_text_lines), sections


def parse_text_or_markdown(data: bytes, filename: str) -> Tuple[str, List[ParsedSection]]:
    """Extracts plain text or markdown preserving section headers and line ranges."""
    text = detect_text_encoding(data)
    lines = text.splitlines()
    if not any(l.strip() for l in lines):
        raise ValueError(f"Document '{filename}' is empty or whitespace only.")

    sections: List[ParsedSection] = []
    current_heading = "Overview / Notes"
    current_lines: List[str] = []
    start_line = 1

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        is_heading = stripped.startswith("#") or bool(re.match(r"^\[.+\]$", stripped))

        if is_heading:
            if current_lines:
                sec_text = "\n".join(current_lines).strip()
                if sec_text:
                    sections.append(
                        ParsedSection(
                            section_id=f"sec-txt-l{start_line}",
                            filename=filename,
                            heading=current_heading,
                            content=sec_text,
                            location_type="line",
                            location_ref=f"Line {start_line}-{idx - 1} ({current_heading})",
                            start_index=start_line,
                            end_index=idx - 1,
                        )
                    )
            current_heading = stripped.lstrip("#").strip("[] ")
            current_lines = [line]
            start_line = idx
        else:
            current_lines.append(line)

    if current_lines:
        sec_text = "\n".join(current_lines).strip()
        if sec_text:
            sections.append(
                ParsedSection(
                    section_id=f"sec-txt-l{start_line}",
                    filename=filename,
                    heading=current_heading,
                    content=sec_text,
                    location_type="line",
                    location_ref=f"Line {start_line}-{len(lines)} ({current_heading})",
                    start_index=start_line,
                    end_index=len(lines),
                )
            )

    return text, sections


def process_uploaded_file(raw_bytes: bytes, original_filename: str) -> Tuple[str, str, str, List[ParsedSection]]:
    """Validates, identifies format, extracts content, and returns (file_type, clean_filename, full_text, sections)."""
    clean_name = sanitize_filename(original_filename)
    size = len(raw_bytes)

    if size == 0:
        raise ValueError(f"Uploaded file '{clean_name}' is empty (0 bytes).")
    if size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"Uploaded file '{clean_name}' exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB "
            f"(received {size // (1024 * 1024)}MB)."
        )

    ext = os.path.splitext(clean_name)[1].lower()

    # Content-based format dispatch with extension fallback
    if raw_bytes.startswith(b"%PDF-") or ext == ".pdf":
        file_type = "pdf"
        full_text, sections = parse_pdf_document(raw_bytes, clean_name)
    elif raw_bytes.startswith(b"PK\x03\x04") or ext == ".docx":
        file_type = "docx"
        full_text, sections = parse_docx_document(raw_bytes, clean_name)
    elif ext == ".json":
        file_type = "json"
        full_text, sections = parse_json_document(raw_bytes, clean_name)
    elif ext == ".csv":
        file_type = "csv"
        full_text, sections = parse_csv_document(raw_bytes, clean_name)
    elif ext in [".md", ".markdown", ".txt"] or not ext:
        file_type = "markdown" if ext in [".md", ".markdown"] else "text"
        full_text, sections = parse_text_or_markdown(raw_bytes, clean_name)
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Supported formats: TXT, MD, PDF, DOCX, CSV, JSON.")

    if len(full_text) > MAX_EXTRACTED_CHARS:
        full_text = full_text[:MAX_EXTRACTED_CHARS]

    return file_type, clean_name, full_text, sections


# Backward compatibility helper for extractor.py
def parse_document_sections(filename: str, content: str) -> List[ParsedSection]:
    """Helper for legacy callers passing raw string content."""
    _, sections = parse_text_or_markdown(content.encode("utf-8"), filename)
    return sections
