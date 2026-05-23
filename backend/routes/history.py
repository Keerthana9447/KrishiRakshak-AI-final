"""Scan history endpoint (SQLite-backed)."""
import logging
import json
import sqlite3
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

log = logging.getLogger("krishirakshak.history")
router = APIRouter()

DB_PATH = Path(__file__).parent.parent / "krishirakshak.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            crop       TEXT,
            disease    TEXT,
            disease_te TEXT,
            severity   TEXT,
            confidence REAL,
            raw_label  TEXT,
            result_json TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    return conn


class ScanRecord(BaseModel):
    crop: str
    disease: str
    disease_te: Optional[str] = ""
    severity: str
    confidence: float
    raw_label: Optional[str] = ""
    result_json: Optional[dict] = None


@router.post("/history")
async def save_scan(record: ScanRecord):
    """Save a scan result to history."""
    conn = _get_conn()
    conn.execute(
        "INSERT INTO scans (crop, disease, disease_te, severity, confidence, raw_label, result_json) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            record.crop, record.disease, record.disease_te,
            record.severity, record.confidence, record.raw_label,
            json.dumps(record.result_json) if record.result_json else None,
        )
    )
    conn.commit()
    conn.close()
    return {"status": "saved"}


@router.get("/history")
async def get_history(limit: int = 50):
    """Return recent scan history."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT id, crop, disease, disease_te, severity, confidence, created_at "
        "FROM scans ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.delete("/history/{scan_id}")
async def delete_scan(scan_id: int):
    conn = _get_conn()
    conn.execute("DELETE FROM scans WHERE id = ?", (scan_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": scan_id}
