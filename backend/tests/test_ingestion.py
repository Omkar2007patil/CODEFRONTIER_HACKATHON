"""Automated tests for Multi-Format Document Ingestion (Outcome A)."""

import os
import io
import pytest
import zipfile
import xml.etree.ElementTree as ET
from fastapi.testclient import TestClient

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.main import app
from app.ingest import (
    process_uploaded_file,
    sanitize_filename,
    compute_sha256,
    MAX_FILE_SIZE_BYTES,
)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def reviewer_token(client):
    res = client.post("/api/auth/demo-login", json={"role": "project_reviewer"})
    assert res.status_code == 200
    return res.json()["access_token"]


def create_minimal_pdf_bytes() -> bytes:
    """Generates valid minimal PDF byte stream."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        b"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
        b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <<>>>> endobj\n"
        b"4 0 obj <</Length 44>> stream\n"
        b"BT /F1 12 Tf 72 712 Td (Apex PDF Page 1) Tj ET\n"
        b"endstream\n"
        b"endobj\n"
        b"xref\n"
        b"0 5\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000216 00000 n \n"
        b"trailer <</Size 5 /Root 1 0 R>>\n"
        b"startxref\n"
        b"310\n"
        b"%%EOF\n"
    )


def create_minimal_docx_bytes() -> bytes:
    """Generates valid minimal OpenXML DOCX archive in memory."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        content_types = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '</Types>'
        )
        z.writestr("[Content_Types].xml", content_types)
        doc_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '<w:body>'
            '<w:p><w:r><w:t>Architecture Decision: Postgres strictly utilized.</w:t></w:r></w:p>'
            '<w:p><w:r><w:t>Sprint Task: Verify migration on staging cluster.</w:t></w:r></w:p>'
            '</w:body>'
            '</w:document>'
        )
        z.writestr("word/document.xml", doc_xml)
    return buf.getvalue()


class TestIngestionEngine:
    def test_sanitize_filename_prevents_traversal(self):
        assert sanitize_filename("../../../etc/passwd") == "passwd"
        assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
        assert sanitize_filename("report.docx") == "report.docx"

    def test_txt_and_markdown_parsing(self):
        raw = b"# Section 1\nDatabase decision: SQLite for test.\n\n# Section 2\nLaunch date: Nov 20, 2026."
        ftype, clean_name, full_text, sections = process_uploaded_file(raw, "handover.md")
        assert ftype == "markdown"
        assert len(sections) == 2
        assert sections[0].location_type == "line"
        assert "Section 1" in sections[0].heading

    def test_csv_parsing_preserves_rows(self):
        csv_data = b"ID,Task,Owner,Status\nAPEX-1,Auth Gateway,Jordan,Completed\nAPEX-2,Redis Staging,Alex,Blocked"
        ftype, clean_name, full_text, sections = process_uploaded_file(csv_data, "tasks.csv")
        assert ftype == "csv"
        assert len(sections) == 2
        assert sections[0].location_ref == "Row 2"
        assert "APEX-1" in sections[0].content

    def test_json_parsing_preserves_json_paths(self):
        json_data = b'{"cluster": {"host": "internal.db", "port": 5432}, "auth": "jwt_ed25519"}'
        ftype, clean_name, full_text, sections = process_uploaded_file(json_data, "cluster.json")
        assert ftype == "json"
        assert len(sections) >= 2
        refs = [s.location_ref for s in sections]
        assert "$.cluster.host" in refs
        assert "$.cluster.port" in refs

    def test_docx_parsing_preserves_paragraphs(self):
        docx_bytes = create_minimal_docx_bytes()
        ftype, clean_name, full_text, sections = process_uploaded_file(docx_bytes, "architecture.docx")
        assert ftype == "docx"
        assert len(sections) == 2
        assert sections[0].location_type == "paragraph"
        assert "Postgres strictly utilized" in sections[0].content

    def test_reject_empty_file(self):
        with pytest.raises(ValueError, match="empty"):
            process_uploaded_file(b"", "empty.txt")

    def test_reject_unsupported_file_extension(self):
        with pytest.raises(ValueError, match="Unsupported file format"):
            process_uploaded_file(b"some content", "binary.exe")

    def test_reject_oversized_file(self):
        oversized = b"A" * (MAX_FILE_SIZE_BYTES + 1024)
        with pytest.raises(ValueError, match="exceeds maximum limit"):
            process_uploaded_file(oversized, "huge.txt")

    def test_multi_file_upload_api_endpoint(self, client, reviewer_token):
        import uuid
        uid = uuid.uuid4().hex[:6]
        files = [
            ("files", (f"notes_{uid}.txt", f"Decision: Kafka selected for streaming events {uid}.".encode("utf-8"), "text/plain")),
            ("files", (f"tasks_{uid}.csv", f"Task,Status\nAPEX-{uid},Completed".encode("utf-8"), "text/csv")),
        ]
        res = client.post(
            "/api/projects/apex-core-2026/documents/upload",
            files=files,
            headers={"Authorization": f"Bearer {reviewer_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["results"]) == 2
        assert data["results"][0]["status"] == "success"

    def test_duplicate_file_upload_handled_gracefully(self, client, reviewer_token):
        content = b"Special unique content for duplicate test: 9948271."
        files1 = [("files", ("dup_test.txt", content, "text/plain"))]
        res1 = client.post(
            "/api/projects/apex-core-2026/documents/upload",
            files=files1,
            headers={"Authorization": f"Bearer {reviewer_token}"},
        )
        assert res1.status_code == 200

        # Upload exact same file again
        files2 = [("files", ("dup_test.txt", content, "text/plain"))]
        res2 = client.post(
            "/api/projects/apex-core-2026/documents/upload",
            files=files2,
            headers={"Authorization": f"Bearer {reviewer_token}"},
        )
        assert res2.status_code == 200
        results2 = res2.json()["results"]
        assert results2[0]["status"] == "skipped"
        assert "Duplicate document skipped" in results2[0]["message"]
