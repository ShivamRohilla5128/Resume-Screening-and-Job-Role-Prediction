"""FastAPI entry point.   Run from the backend folder:   uvicorn app.main:app --reload --port 8000"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.api import analysis, auth, history, meta, screening
from app.database.mongo import init_db
from app.services.ml_service import get_ml

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app):
    init_db()
    ml = get_ml()                       # artifacts are loaded once; nothing is retrained at request time
    logging.getLogger("resume-ai").info("ML model ready: %s", ml.info if ml.ok else ml.error)
    yield


app = FastAPI(title="AI Resume Screening & Job Role Prediction API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def security_headers(request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Cache-Control", "no-store")
    return resp


for r in (auth.router, analysis.router, screening.router, history.router, meta.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health")
def health():
    ml = get_ml()
    return {"status": "ok", "model_loaded": ml.ok, "model": ml.info if ml.ok else None}
