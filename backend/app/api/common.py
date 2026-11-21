"""Shared helpers for analysis-style endpoints."""
from fastapi import HTTPException

from app import config
from app.database.mongo import get_db
from app.services.analysis import build_analysis
from app.services.ml_service import get_ml
from app.utils.helpers import expires, now, oid


def ml_or_503():
    ml = get_ml()
    if not ml.ok:
        raise HTTPException(503, ml.error)
    return ml


def load_resume(user, resume_id):
    r = get_db().resumes.find_one({"_id": oid(resume_id, "resume id"), "user_id": user["_id"]})
    if not r:
        raise HTTPException(404, "Resume not found. It may have been deleted or its retention period expired - please upload it again.")
    return r


def create_analysis_doc(user, resume, built, **extra):
    doc = {"user_id": user["_id"], "resume_id": resume["_id"], "filename": resume["filename"], **built, "match": None, "gap": None,
           "kind": "single", "created_at": now(), "expires_at": expires(config.ANALYSIS_RETENTION_DAYS), **extra}
    doc["_id"] = get_db().analysis_results.insert_one(doc).inserted_id
    return doc


def get_or_create_analysis(user, resume, refresh=False, target_role=None):
    ml = ml_or_503()
    col = get_db().analysis_results
    existing = col.find_one({"user_id": user["_id"], "resume_id": resume["_id"]}, sort=[("created_at", -1)])
    if existing and not refresh:
        return existing
    built = build_analysis(resume["raw_text"], ml, target_role)
    if existing:
        col.update_one({"_id": existing["_id"]}, {"$set": built})
        existing.update(built)
        return existing
    return create_analysis_doc(user, resume, built)
