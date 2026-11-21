"""Transparent resume <-> job description matching (TF-IDF cosine + skill overlap + evidence + education)."""
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.extractor import LEVELS, split_sections
from app.services.reference import get_role
from ml.preprocessing.skills_vocab import extract_skills, normalize_skill
from ml.preprocessing.text import clean_text

BASE_WEIGHTS = {"skills": 0.50, "similarity": 0.20, "experience": 0.20, "education": 0.10}
FULL_SIM_COSINE = 0.35        # heuristic: resume<->JD cosine >= 0.35 is treated as "full" text similarity
FIELD_RE = re.compile(r"computer|information technology|software|data|statistic|mathemat|engineering|electronic|informatics|\bit\b|business|commerce", re.I)
DISCLAIMER = ("The match score is an estimated, text-based compatibility measure built from the transparent components shown. "
              "It is not a hiring decision and does not assess ability, potential or fit; a human should review every candidate.")


def parse_skill_list(items):
    out, seen = [], set()
    for raw in items or []:
        s = raw.strip()
        if not s:
            continue
        canon = normalize_skill(s) or s
        if canon.lower() not in seen:
            seen.add(canon.lower()); out.append(canon)
    return out


def _has(skill, resume_skills, text):
    if skill in resume_skills:
        return True
    if normalize_skill(skill):
        return False
    return bool(re.search(r"(?<![A-Za-z0-9+#])" + re.escape(skill) + r"(?![A-Za-z0-9+#])", text, re.I))


def _required_level(jd):
    found = [lvl for lvl, _, pat in LEVELS if lvl >= 3 and pat.search(jd)]
    return min(found) if found else None


def _cosine(ml, a, b):
    if ml is not None and getattr(ml, "ok", False):
        m = ml.vec.transform([clean_text(a), clean_text(b)])
    else:
        m = TfidfVectorizer(sublinear_tf=True).fit_transform([clean_text(a), clean_text(b)])
    return float(cosine_similarity(m[0], m[1])[0, 0])


def match_resume(text, info, job_role, job_description, required_skills, ml=None):
    jd = (job_description or "").strip()
    has_jd = len(jd.split()) >= 15
    role = get_role(job_role)
    user_req = parse_skill_list(required_skills)
    jd_skills = extract_skills(jd) if jd else []
    required = user_req or jd_skills or (role["required"] if role else [])
    if not required:
        raise ValueError("Provide a job description, required skills or a job role so there is something to match against.")
    resume_skills = set(info["skills"])
    matched = [s for s in required if _has(s, resume_skills, text)]
    missing = [s for s in required if s not in matched]
    bonus_pool = [s for s in ((role["optional"] if role else []) + jd_skills) if s not in required]
    bonus = list(dict.fromkeys(s for s in bonus_pool if s in resume_skills))

    sec = split_sections(text)
    evidence_text = " ".join(sec.get("experience", []) + sec.get("projects", []))
    evid_hits = sum(1 for s in matched if _has(s, set(extract_skills(evidence_text)), evidence_text))
    evidence = evid_hits / len(matched) if matched and evidence_text else 0.0
    years_m = re.search(r"(\d{1,2})\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?)", jd, re.I) if jd else None
    req_years, cand_years = (int(years_m.group(1)) if years_m else None), info.get("years_experience")
    if req_years:
        exp_score = 0.5 * min(1.0, (cand_years or 0) / req_years) + 0.5 * evidence
        exp_detail = f"Required about {req_years} yr(s); detected {cand_years:g} yr(s)." if cand_years is not None else f"Required about {req_years} yr(s); candidate experience not detected."
    else:
        exp_score, exp_detail = evidence, f"{evid_hits}/{len(matched)} matched skills are backed by experience/project text." if matched else "No matched skills to verify."

    comps = {"skills": (len(matched) / len(required), f"{len(matched)} of {len(required)} required skills found.")}
    cos = None
    if has_jd:
        cos = _cosine(ml, text, jd)
        comps["similarity"] = (min(1.0, cos / FULL_SIM_COSINE), f"TF-IDF cosine similarity = {cos:.2f}.")
    comps["experience"] = (exp_score, exp_detail)
    req_level = _required_level(jd) if jd else None
    if req_level:
        lvl = min(1.0, (info.get("education_level") or 0) / req_level)
        field = 1.0 if FIELD_RE.search(" ".join(info["education"])) else 0.0
        comps["education"] = (0.7 * lvl + 0.3 * field, f"Job asks for level {req_level}/5; detected {info.get('education_level_label') or 'none'}; field {'relevant' if field else 'not clearly relevant'}.")
    wsum = sum(BASE_WEIGHTS[k] for k in comps)
    overall = 100 * sum(BASE_WEIGHTS[k] * v[0] for k, v in comps.items()) / wsum
    labels = {"skills": "Skills match", "similarity": "Keyword similarity (TF-IDF)", "experience": "Relevant experience", "education": "Education relevance"}
    components = [{"key": k, "label": labels[k], "score": round(100 * v[0], 1), "weight": round(BASE_WEIGHTS[k] / wsum, 3), "detail": v[1]} for k, v in comps.items()]

    sugg = [f"Consider building and showcasing {s} (add it to your resume only once you have real experience)." for s in missing[:5]]
    if has_jd and comps["similarity"][0] < .4: sugg.append("Where it is truthful, mirror the job description's terminology when describing your work.")
    if matched and evidence < .5: sugg.append("Show matched skills inside experience or project bullets, not only in the skills list.")
    if req_years and (cand_years or 0) < req_years: sugg.append("Highlight relevant internships, freelance work or projects to offset the shorter experience.")
    return {"job_role": role["role"] if role else (job_role or None), "overall_score": round(overall, 1), "components": components,
            "required_skills": required, "matched_skills": matched, "missing_skills": missing, "bonus_matched": bonus,
            "keyword_similarity": round(cos * 100, 1) if cos is not None else None, "required_years": req_years, "candidate_years": cand_years,
            "suggestions": sugg, "disclaimer": DISCLAIMER}
