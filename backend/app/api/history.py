"""History, dashboard statistics and PDF reports (all computed from stored analysis records)."""
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.api.deps import current_user
from app.database.mongo import get_db
from app.services.ml_service import get_ml
from app.services.report import build_pdf
from app.utils.helpers import iso, oid, ser

router = APIRouter(tags=["history"])
BUCKETS = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 101)]


def _summary(d):
    return {"id": str(d["_id"]), "resume_id": str(d["resume_id"]), "filename": d.get("filename"), "kind": d.get("kind", "single"),
            "candidate_name": (d.get("info") or {}).get("name"), "predicted_role": d["prediction"]["primary"]["role"],
            "probability": d["prediction"]["primary"]["probability"], "match_score": (d.get("match") or {}).get("overall_score"),
            "review_score": (d.get("review") or {}).get("overall"), "created_at": iso(d["created_at"])}


def _own(user, analysis_id):
    d = get_db().analysis_results.find_one({"_id": oid(analysis_id, "analysis id"), "user_id": user["_id"]})
    if not d:
        raise HTTPException(404, "Analysis not found")
    return d


@router.get("/history")
def history(user=Depends(current_user)):
    docs = get_db().analysis_results.find({"user_id": user["_id"]}).sort("created_at", -1).limit(200)
    return {"items": [_summary(d) for d in docs]}


@router.get("/history/{analysis_id}")
def history_item(analysis_id: str, user=Depends(current_user)):
    d = _own(user, analysis_id)
    resume = get_db().resumes.find_one({"_id": d["resume_id"], "user_id": user["_id"]})
    out = ser(d)
    out["resume_available"] = bool(resume)
    out["text_preview"] = resume["raw_text"][:3000] if resume else None
    return out


@router.delete("/history/{analysis_id}")
def delete_history(analysis_id: str, user=Depends(current_user)):
    d = _own(user, analysis_id)
    db = get_db()
    db.analysis_results.delete_one({"_id": d["_id"]})
    if db.analysis_results.count_documents({"resume_id": d["resume_id"]}) == 0:
        db.resumes.delete_one({"_id": d["resume_id"], "user_id": user["_id"]})       # raw resume text is removed with its last analysis
    return {"deleted": True}


@router.get("/report/{analysis_id}")
def report(analysis_id: str, user=Depends(current_user)):
    d = ser(_own(user, analysis_id))
    pdf = build_pdf(d)
    safe = "".join(c for c in (d.get("filename") or "resume") if c.isalnum() or c in "._-")[:60]
    return Response(pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="analysis_{safe}.pdf"'})


@router.get("/dashboard/stats")
def stats(user=Depends(current_user)):
    db = get_db()
    docs = list(db.analysis_results.find({"user_id": user["_id"]}).sort("created_at", -1).limit(1000))
    roles = Counter(d["prediction"]["primary"]["role"] for d in docs)
    scores = [d["match"]["overall_score"] for d in docs if d.get("match")]
    skills = Counter(s for d in docs for s in d["info"]["skills"])
    activity = [{"type": "analysis", "label": f"Analyzed {d.get('filename')}", "at": d["created_at"]} for d in docs[:10]]
    for s in db.screening_sessions.find({"user_id": user["_id"]}).sort("created_at", -1).limit(5):
        activity.append({"type": "screening", "label": f"Ranked {len(s.get('results', []))} resumes", "at": s["created_at"]})
    activity.sort(key=lambda a: a["at"], reverse=True)
    ml = get_ml()
    return {
        "total_resumes": len(docs),
        "average_match_score": round(sum(scores) / len(scores), 1) if scores else None,
        "matches_computed": len(scores),
        "most_predicted_role": roles.most_common(1)[0][0] if roles else None,
        "total_job_categories": len(ml.classes),
        "recent": [_summary(d) for d in docs[:6]],
        "role_distribution": [{"role": r, "count": c} for r, c in roles.most_common()],
        "score_distribution": [{"range": f"{lo}-{min(hi, 100)}", "count": sum(1 for s in scores if lo <= s < hi)} for lo, hi in BUCKETS],
        "skills_frequency": [{"skill": s, "count": c} for s, c in skills.most_common(12)],
        "activity": [{**a, "at": iso(a["at"])} for a in activity[:10]],
        "model": ml.info if ml.ok else None,
    }
