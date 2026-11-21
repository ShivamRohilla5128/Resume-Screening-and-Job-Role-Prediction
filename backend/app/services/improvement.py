"""Rule-based resume review. Produces scores, issues and tips - it never invents experience, metrics or certifications."""
import re

from app.services.extractor import is_bullet, split_sections, strip_bullet
from app.services.reference import get_role
from ml.preprocessing.skills_vocab import SKILLS, extract_skills

ACTION_VERBS = set("""achieved analysed analyzed architected automated built collaborated configured created delivered deployed
designed developed engineered enhanced executed implemented improved integrated launched led maintained managed migrated monitored
optimised optimized orchestrated presented reduced refactored resolved scaled streamlined tested trained wrote documented facilitated
gathered investigated administered provisioned secured tuned""".split())
WEAK = [(r"responsible for", "Replace 'responsible for X' with a verb that shows what you did, e.g. 'Managed X' / 'Built X'."),
        (r"worked on", "Replace 'worked on X' with the specific action you took, e.g. 'Implemented X using <tool>'."),
        (r"helped (?:with|to)", "Say what your contribution was instead of 'helped with'."),
        (r"duties included", "List outcomes, not duties: start with an action verb."),
        (r"involved in", "State your own role: 'Led/Built/Tested ...' instead of 'involved in'.")]
WEIGHTS = {"summary": .15, "skills": .20, "education": .10, "projects": .15, "experience": .20, "certifications": .05, "formatting": .15}
LABELS = {"summary": "Professional summary", "skills": "Technical skills", "education": "Education", "projects": "Projects",
          "experience": "Experience", "certifications": "Certifications", "formatting": "Formatting & readability"}


def _status(score):
    return "good" if score >= 75 else "needs_work" if score >= 40 else "weak"


def _item(key, score, issues, tips):
    score = max(0, min(100, round(score)))
    return {"key": key, "label": LABELS[key], "score": score, "status": _status(score), "issues": issues, "tips": tips}


def review(text, info, target_role=None):
    sec = split_sections(text)
    items = []

    # summary
    s = info.get("summary")
    if not s:
        items.append(_item("summary", 0, ["No professional summary detected."],
                           ["Add 2-3 sentences: your target role, years of experience (or field of study) and the 2-3 skills you genuinely rely on most."]))
    else:
        score, issues, tips, w = 100, [], [], len(s.split())
        if w < 20: score -= 40; issues.append(f"Summary is very short ({w} words)."); tips.append("Expand to 30-70 words covering role, experience level and key strengths.")
        if w > 90: score -= 30; issues.append(f"Summary is long ({w} words)."); tips.append("Trim to 3 concise sentences.")
        if re.search(r"\b(i am|i'm|my)\b", s, re.I): score -= 10; issues.append("First-person phrasing."); tips.append("Write without 'I'/'my', e.g. 'Backend developer with 2 years of ...'.")
        if not extract_skills(s): score -= 20; issues.append("No concrete skill mentioned in the summary."); tips.append("Name 2-3 real skills or tools that match your target role.")
        items.append(_item("summary", score, issues, tips))

    # skills
    n = len(info["skills"]); issues, tips = [], []
    cats = {SKILLS[k]["category"] for k in info["skills"] if k in SKILLS}
    score = 0 if n == 0 else 40 if n < 5 else 70 if n < 8 else 90 + (10 if len(cats) >= 2 else 0)
    if n == 0: issues.append("No recognised technical skills found."); tips.append("Add a 'Skills' section listing tools, languages and frameworks you have actually used.")
    elif n < 5: issues.append(f"Only {n} recognised skills.")
    if n > 25: score -= 15; issues.append("Very long skill list."); tips.append("Prioritise the skills most relevant to the job you want.")
    role = get_role(target_role) if target_role else None
    if role:
        miss = [x for x in role["required"] if x not in info["skills"]]
        required_count = len(role["required"])
        matched_count = required_count - len(miss)
        role_coverage = matched_count / required_count if required_count else 0
        score = (score + role_coverage * 100) / 2
        if miss:
            issues.append(f"{matched_count} of {required_count} required skills detected for {role['role']}.")
            tips.append(f"Skills commonly expected for {role['role']} that were not detected: {', '.join(miss)}. Add them only if you genuinely have them.")
    items.append(_item("skills", score, issues, tips))

    # education
    if info["education"]:
        score, issues, tips = 100, [], []
        if not re.search(r"(?:19|20)\d{2}", " ".join(info["education"])): score -= 15; issues.append("No graduation year detected."); tips.append("Add the year of completion (or expected year).")
        items.append(_item("education", score, issues, tips))
    else:
        items.append(_item("education", 0, ["No education details detected."], ["Add degree, institution and year under an 'Education' heading."]))

    # projects
    pr = info["projects"]
    if not pr:
        items.append(_item("projects", 0, ["No projects detected."], ["Add 2-3 projects with the problem, tools used and outcome - especially if you have limited work experience."]))
    else:
        score, issues, tips = (60 if len(pr) == 1 else 90), [], []
        with_tools = sum(1 for p in pr if extract_skills(p))
        if with_tools / len(pr) < .5: score -= 15; issues.append("Most project entries do not name the technologies used."); tips.append("State the tools for each project, e.g. 'Built X using <tool>'.")
        items.append(_item("projects", score, issues, tips))

    # experience
    lines = sec.get("experience", [])
    bullets = [strip_bullet(l) for l in lines if is_bullet(l)] or [l for l in lines if len(l.split()) >= 6]
    weak_hits = []
    if not lines:
        items.append(_item("experience", 0, ["No work experience section detected."],
                           ["If you are a fresher, add internships, training or substantial projects. Do not list roles you did not hold."]))
    else:
        verb = sum(1 for b in bullets if b.split() and b.split()[0].lower().strip(",.") in ACTION_VERBS) / max(1, len(bullets))
        quant = sum(1 for b in bullets if re.search(r"\d|%", b)) / max(1, len(bullets))
        issues, tips = [], []
        for b in bullets:
            for pat, adv in WEAK:
                if re.search(pat, b, re.I): weak_hits.append({"original": b, "suggestion": adv})
        if verb < .6: issues.append(f"Only {round(verb * 100)}% of bullets start with an action verb."); tips.append("Start each bullet with a verb such as Built, Led, Automated, Reduced.")
        if quant < .3: issues.append("Few bullets include measurable results."); tips.append("Where true, add numbers (users, %, time or cost saved). Skip the number if you cannot verify it.")
        if weak_hits: issues.append("Weak phrases found (e.g. 'responsible for').")
        items.append(_item("experience", 30 + 35 * verb + 35 * quant - (10 if weak_hits else 0), issues, tips))

    # certifications (optional)
    if info["certifications"]:
        items.append(_item("certifications", 100, [], []))
    else:
        items.append(_item("certifications", 40, ["No certifications detected (optional)."], ["List relevant certifications you have actually completed; leave the section out if you have none."]))

    # formatting
    wc = info["word_count"]
    checks = [("Email address", bool(info["email"]), "Add a professional email address."),
              ("Phone number", bool(info["phone"]), "Add a phone number."),
              ("Clear section headings", len(info["sections_found"]) >= 4, "Use standard headings: Summary, Skills, Experience, Education, Projects."),
              ("Bullet points", any(is_bullet(l.strip()) for l in text.splitlines()), "Use bullet points for achievements to improve scanability."),
              ("Length", 150 <= wc <= 900, "Aim for roughly 300-700 words (1-2 pages)." if wc > 900 else "The resume looks very short; add detail.")]
    failed = [c for c in checks if not c[1]]
    items.append(_item("formatting", 100 * (len(checks) - len(failed)) / len(checks), [f"Missing/weak: {c[0]}." for c in failed], [c[2] for c in failed]))

    overall = round(sum(WEIGHTS[i["key"]] * i["score"] for i in items), 1)
    strengths = [f"{i['label']}: looks solid ({i['score']}/100)." for i in items if i["score"] >= 80 and i["key"] != "certifications"]
    weaknesses = [f"{i['label']}: {i['issues'][0]}" for i in items if i["score"] < 60 and i["issues"] and i["key"] != "certifications"]
    if info.get("years_experience"): strengths.append(f"About {info['years_experience']:g} year(s) of experience detected.")
    return {"overall": overall, "sections": items, "strengths": strengths, "weaknesses": weaknesses,
            "wording_examples": weak_hits[:5],
            "disclaimer": "Suggestions are rule-based. Only add content that is true; do not invent roles, achievements or certifications."}
