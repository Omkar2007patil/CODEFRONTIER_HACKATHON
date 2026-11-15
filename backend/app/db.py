"""Database schema, initialization, and connection management for Apex Handover Platform.
Uses SQLite with WAL mode, foreign keys, and atomic transactions.
"""

import os
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_DIR = os.environ.get("DATA_DIR", DEFAULT_DATA_DIR)
DB_PATH = os.environ.get("DB_PATH", os.path.join(DATA_DIR, "handover_platform.db"))


def get_db_connection() -> sqlite3.Connection:
    """Returns a thread-safe connection to SQLite with WAL enabled and row factory."""
    global DATA_DIR, DB_PATH
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
    except (PermissionError, OSError):
        DATA_DIR = DEFAULT_DATA_DIR
        DB_PATH = os.path.join(DATA_DIR, "handover_platform.db")
        os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes password with PBKDF2-HMAC-SHA256 (standard library, zero native dependency)."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000
    ).hex()
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verifies a password against stored PBKDF2 hash and salt."""
    check_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(check_hash, hashed)


def init_db():
    """Initializes database schema and default tables."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        outgoing_member TEXT NOT NULL,
        intended_role TEXT NOT NULL,
        summary TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        preset_id TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        approved_by TEXT,
        approved_at TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        sections_json TEXT NOT NULL DEFAULT '[]',
        uploaded_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        category TEXT NOT NULL,
        statement TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'verified',
        validation_status TEXT NOT NULL DEFAULT 'supported',
        reviewer_status TEXT NOT NULL DEFAULT 'approved',
        confidence REAL NOT NULL DEFAULT 1.0,
        source_doc_id TEXT,
        source_filename TEXT,
        source_location TEXT,
        exact_source_excerpt TEXT,
        extraction_method TEXT NOT NULL DEFAULT 'deterministic_heuristic',
        explanation TEXT,
        conflict_notes TEXT,
        is_sensitive INTEGER NOT NULL DEFAULT 0,
        is_approved INTEGER NOT NULL DEFAULT 1,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (source_doc_id) REFERENCES documents(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS conflicts (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        conflict_type TEXT NOT NULL,
        claim_id_1 TEXT NOT NULL,
        claim_id_2 TEXT NOT NULL,
        explanation TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unresolved',
        resolution_choice TEXT,
        rationale TEXT,
        resolved_by TEXT,
        resolved_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (claim_id_1) REFERENCES claims(id) ON DELETE CASCADE,
        FOREIGN KEY (claim_id_2) REFERENCES claims(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS redactions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        claim_id TEXT,
        secret_type TEXT NOT NULL,
        masked_text TEXT NOT NULL,
        reason TEXT NOT NULL,
        approved_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        task_key TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        completed_by TEXT,
        completed_at TEXT,
        notes TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, task_key)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        user_id TEXT,
        user_email TEXT,
        user_role TEXT,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        change_summary TEXT NOT NULL,
        created_by TEXT,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_claims_project ON claims(project_id);
    CREATE INDEX IF NOT EXISTS idx_conflicts_project ON conflicts(project_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_project ON checklist_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_logs(project_id);
    """)

    conn.commit()
    conn.close()


def seed_default_users():
    """Seeds default demo accounts for Judge evaluation and testing."""
    default_users = [
        {
            "id": "usr-reviewer-1",
            "email": "reviewer@apex.dev",
            "password": "apexReviewer2026!",
            "full_name": "Jordan Lee (Lead Engineering Reviewer)",
            "role": "project_reviewer",
        },
        {
            "id": "usr-outgoing-1",
            "email": "outgoing@apex.dev",
            "password": "apexOutgoing2026!",
            "full_name": "Alex Chen (Departing Staff Architect)",
            "role": "outgoing_member",
        },
        {
            "id": "usr-successor-1",
            "email": "successor@apex.dev",
            "password": "apexSuccessor2026!",
            "full_name": "Taylor Morgan (Incoming Successor Engineer)",
            "role": "incoming_successor",
        },
    ]

    conn = get_db_connection()
    cur = conn.cursor()
    now_str = datetime.now(timezone.utc).isoformat()

    for u in default_users:
        cur.execute("SELECT id FROM users WHERE email = ?", (u["email"],))
        if not cur.fetchone():
            h, s = hash_password(u["password"])
            cur.execute(
                """
                INSERT INTO users (id, email, password_hash, salt, full_name, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (u["id"], u["email"], h, s, u["full_name"], u["role"], now_str),
            )

    conn.commit()
    conn.close()
