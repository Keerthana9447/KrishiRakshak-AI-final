"""
KrishiRakshak AI — FastAPI Backend
No API key required. Uses local HuggingFace MobileNetV2 model.
"""
import os, sys, logging
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / ".env")

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.detect    import router as detect_router
from routes.weather   import router as weather_router
from routes.chat      import router as chat_router
from routes.history   import router as history_router
from routes.dashboard import router as dashboard_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-7s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("krishirakshak")

app = FastAPI(title="KrishiRakshak AI API", version="3.1.0", docs_url="/api/docs", redoc_url="/api/redoc")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for r in [detect_router, weather_router, chat_router, history_router, dashboard_router]:
    app.include_router(r, prefix="/api")

MODEL_DIR = ROOT / "ml" / "models"

@app.get("/")
async def root():
    model_ok = (MODEL_DIR / "config.json").exists()
    return {
        "message": "KrishiRakshak AI Backend 🌱",
        "version": "3.1 — Local MobileNetV2 (no API key)",
        "docs": "/api/docs",
        "services": {
            "disease_detection": "✓ MobileNetV2 (95.4% acc, local)" if model_ok
                                 else "⚠ Model not downloaded — run: python ml/download_model.py",
            "weather": "✓ Open-Meteo (free, no API key)" + (
                " + OpenWeatherMap" if os.environ.get("OPENWEATHER_API_KEY") else ""),
        }
    }

(ROOT / "uploads").mkdir(exist_ok=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    model_ok = (MODEL_DIR / "config.json").exists()
    log.info("KrishiRakshak AI v3.1 starting on port %d", port)
    if not model_ok:
        log.warning("=" * 55)
        log.warning("⚠  Model not downloaded yet!")
        log.warning("   Run once:  python ml/download_model.py")
        log.warning("=" * 55)
    else:
        log.info("✓ Model found at %s", MODEL_DIR)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
