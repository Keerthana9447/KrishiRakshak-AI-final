"""Dashboard analytics endpoint."""
import logging
import sqlite3
from pathlib import Path
from fastapi import APIRouter

log = logging.getLogger("krishirakshak.dashboard")
router = APIRouter()

DB_PATH = Path(__file__).parent.parent / "krishirakshak.db"


def _conn():
    if not DB_PATH.exists():
        return None
    c = sqlite3.connect(str(DB_PATH))
    c.row_factory = sqlite3.Row
    return c


@router.get("/dashboard")
async def get_dashboard():
    """Return aggregate stats for the dashboard."""
    c = _conn()
    if c is None:
        # Return mock data when DB not initialised yet
        return _mock_dashboard()

    try:
        total = c.execute("SELECT COUNT(*) FROM scans").fetchone()[0]
        healthy = c.execute("SELECT COUNT(*) FROM scans WHERE severity='none'").fetchone()[0]
        diseased = total - healthy
        critical = c.execute("SELECT COUNT(*) FROM scans WHERE severity='critical'").fetchone()[0]

        recent = c.execute(
            "SELECT crop, disease, severity, confidence, created_at "
            "FROM scans ORDER BY id DESC LIMIT 5"
        ).fetchall()

        by_disease = c.execute(
            "SELECT disease, COUNT(*) AS cnt FROM scans "
            "WHERE severity != 'none' GROUP BY disease ORDER BY cnt DESC LIMIT 6"
        ).fetchall()

        c.close()
        return {
            "total_scans": total,
            "healthy_scans": healthy,
            "diseased_scans": diseased,
            "critical_cases": critical,
            "health_rate": round((healthy / total * 100), 1) if total else 0,
            "recent_scans": [dict(r) for r in recent],
            "disease_breakdown": [{"disease": r["disease"], "count": r["cnt"]} for r in by_disease],
        }
    except Exception:
        c.close()
        return _mock_dashboard()


def _mock_dashboard() -> dict:
    return {
        "total_scans": 47,
        "healthy_scans": 35,
        "diseased_scans": 12,
        "critical_cases": 2,
        "health_rate": 74.5,
        "recent_scans": [
            {"crop": "Tomato", "disease": "Late Blight", "severity": "high",     "confidence": 94.2, "created_at": "2024-05-18"},
            {"crop": "Potato", "disease": "Early Blight","severity": "medium",   "confidence": 88.7, "created_at": "2024-05-15"},
            {"crop": "Rice",   "disease": "Healthy",     "severity": "none",     "confidence": 97.1, "created_at": "2024-05-12"},
            {"crop": "Corn",   "disease": "Common Rust", "severity": "medium",   "confidence": 91.3, "created_at": "2024-05-10"},
            {"crop": "Tomato", "disease": "Bacterial Spot","severity": "medium", "confidence": 89.5, "created_at": "2024-05-08"},
        ],
        "disease_breakdown": [
            {"disease": "Late Blight",    "count": 5},
            {"disease": "Early Blight",   "count": 3},
            {"disease": "Bacterial Spot", "count": 2},
            {"disease": "Common Rust",    "count": 1},
            {"disease": "Leaf Mold",      "count": 1},
        ],
    }
