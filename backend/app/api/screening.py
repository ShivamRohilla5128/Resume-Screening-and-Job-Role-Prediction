"""Multi-resume ranking. Ranking uses ONLY job-related criteria (skills, text similarity, experience evidence, education relevance)."""
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app import config
from app.api.common import create_analysis_doc, ml_or_503
from app.api.deps import current_user
from app.database.mongo import get_db
from app.services import matching, parser
from app.services.analysis import build_analysis
from app.utils.helpers import expires, now

router = APIRouter(prefix="/screening", tags=["screening"])
FAIRNESS = ("Candidates are ranked only by job-related criteria: required-skill coverage, TF-IDF text similarity, experience evidence and "
            "education relevance. Age, gender, religion, caste, photographs, disability and other protected characteristics are never extracted or used. "
            "Rankings support, and never replace, human review.")


@router.post("/rank")
def rank(files: List[UploadFile] = File(...), job_description: str = Form(""), required_skills: str = Form(""), job_role: str = Form(""),
         user=Depends(current_user)):
    ml = ml_or_503()
    if len(files) > config.MAX_FILES_PER_REQUEST:
        raise HTTPException(413, f"At most {config.MAX_FILES_PER_REQUEST} files per request")
    if len(job_description) > 20000:
        raise HTTPException(413, "Job description is too long")
    skills = [s for s in (x.strip() for x in required_skills.split(",")) if s][:60]
    max_bytes = config.MAX_UPLOAD_MB * 1024 * 1024
    db = get_db()
    session_id = db.screening_sessions.insert_one({"user_id": user["_id"], "job_role": job_role, "job_description": job_description,
                                                   "required_skills": skills, "results": [], "created_at": now()}).inserted_id
    rows, failed = [], []
    for f in files:
        name = parser.safe_filename(f.filename)
        try:
            data = f.file.read(max_bytes + 1)
            text = parser.extract_text(name, data, max_bytes)
            built = build_analysis(text, ml, job_role or None)
            result = matching.match_resume(text, built["info"], job_role, job_description, skills, ml)
        except (parser.ParseError, ValueError) as e:
            failed.append({"filename": name, "status": "failed", "error": str(e)}); continue
        resume = {"user_id": user["_id"], "filename": name, "size": len(data), "raw_text": text, "char_count": len(text),
                  "created_at": now(), "expires_at": expires(config.RESUME_RETENTION_DAYS)}
        resume["_id"] = db.resumes.insert_one(resume).inserted_id
        a = create_analysis_doc(user, resume, built, kind="screening", screening_id=session_id)
        db.analysis_results.update_one({"_id": a["_id"]}, {"$set": {"match": result}})
        info, pred = built["info"], built["prediction"]
        rows.append({"analysis_id": str(a["_id"]), "resume_id": str(resume["_id"]), "filename": name, "name": info["name"] or name,
                     "name_detected": bool(info["name"]), "predicted_role": pred["primary"]["role"], "probability": pred["primary"]["probability"],
                     "skills": info["skills"], "years_experience": info["years_experience"], "match_score": result["overall_score"],
                     "matched_skills": result["matched_skills"], "missing_skills": result["missing_skills"], "status": "analyzed"})
    rows.sort(key=lambda r: (-r["match_score"], -len(r["matched_skills"]), r["filename"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    db.screening_sessions.update_one({"_id": session_id}, {"$set": {"results": [{k: r[k] for k in ("analysis_id", "name", "match_score", "rank")} for r in rows]}})
    return {"session_id": str(session_id), "ranked": rows, "failed": failed, "fairness_note": FAIRNESS}
