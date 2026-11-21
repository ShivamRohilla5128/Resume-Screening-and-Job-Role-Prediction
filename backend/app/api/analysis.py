"""Upload, analyze, predict, match, gap-analysis and improvement endpoints."""
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app import config
from app.api.common import get_or_create_analysis, load_resume, ml_or_503
from app.api.deps import current_user
from app.database.mongo import get_db
from app.schemas.schemas import GapIn, MatchIn, ResumeRef
from app.services import gap as gap_service
from app.services import improvement, matching, parser
from app.services.extractor import extract_info
from app.services.reference import get_role
from app.utils.helpers import expires, now, ser

router = APIRouter(tags=["analysis"])


@router.post("/resume/upload")
def upload(files: List[UploadFile] = File(...), user=Depends(current_user)):
    if len(files) > config.MAX_FILES_PER_REQUEST:
        raise HTTPException(413, f"At most {config.MAX_FILES_PER_REQUEST} files per request")
    max_bytes = config.MAX_UPLOAD_MB * 1024 * 1024
    resumes, errors = [], []
    for f in files:
        name = parser.safe_filename(f.filename)
        try:
            data = f.file.read(max_bytes + 1)
            text = parser.extract_text(name, data, max_bytes)
        except parser.ParseError as e:
            errors.append({"filename": name, "error": str(e)}); continue
        doc = {"user_id": user["_id"], "filename": name, "size": len(data), "raw_text": text, "char_count": len(text),
               "created_at": now(), "expires_at": expires(config.RESUME_RETENTION_DAYS)}
        rid = get_db().resumes.insert_one(doc).inserted_id
        resumes.append({"resume_id": str(rid), "filename": name, "size": len(data), "char_count": len(text),
                        "text_preview": text[:3000], "info": extract_info(text)})
    if not resumes and errors:
        raise HTTPException(422, "; ".join(f"{e['filename']}: {e['error']}" for e in errors))
    return {"resumes": resumes, "errors": errors}


@router.post("/resume/analyze")
def analyze(body: ResumeRef, user=Depends(current_user)):
    resume = load_resume(user, body.resume_id)
    return ser(get_or_create_analysis(user, resume, refresh=True, target_role=body.job_role))


@router.post("/predict/job-role")
def predict(body: ResumeRef, user=Depends(current_user)):
    a = get_or_create_analysis(user, load_resume(user, body.resume_id))
    return {"analysis_id": str(a["_id"]), "prediction": ser(a["prediction"])}


@router.post("/match/job-description")
def match(body: MatchIn, user=Depends(current_user)):
    resume = load_resume(user, body.resume_id)
    a = get_or_create_analysis(user, resume)
    try:
        result = matching.match_resume(resume["raw_text"], a["info"], body.job_role, body.job_description, body.required_skills, ml_or_503())
    except ValueError as e:
        raise HTTPException(422, str(e))
    db = get_db()
    db.analysis_results.update_one({"_id": a["_id"]}, {"$set": {"match": result}})
    if body.job_description.strip():
        db.job_descriptions.insert_one({"user_id": user["_id"], "job_role": body.job_role, "text": body.job_description, "required_skills": body.required_skills, "created_at": now()})
    return {"analysis_id": str(a["_id"]), "match": result}


@router.post("/skills/gap-analysis")
def gap(body: GapIn, user=Depends(current_user)):
    a = get_or_create_analysis(user, load_resume(user, body.resume_id))
    if not get_role(body.job_role):
        raise HTTPException(422, f"Unknown job role '{body.job_role}'")
    result = gap_service.gap_analysis(a["info"], body.job_role)
    get_db().analysis_results.update_one({"_id": a["_id"]}, {"$set": {"gap": result}})
    return {"analysis_id": str(a["_id"]), "gap": result}


@router.post("/resume/improve")
def improve(body: ResumeRef, user=Depends(current_user)):
    resume = load_resume(user, body.resume_id)
    a = get_or_create_analysis(user, resume)
    role = body.job_role or a["prediction"]["primary"]["role"]
    rev = improvement.review(resume["raw_text"], a["info"], role)
    get_db().analysis_results.update_one({"_id": a["_id"]}, {"$set": {"review": rev}})
    return {"analysis_id": str(a["_id"]), "review": rev, "target_role": role}
