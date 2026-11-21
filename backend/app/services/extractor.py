"""Rule-based information extraction (regex + section detection). Missing fields stay None/[] - nothing is invented."""
import re
from datetime import datetime

from ml.preprocessing.skills_vocab import extract_skills

HEADINGS = {
    "summary": {"summary", "professional summary", "profile", "professional profile", "objective", "career objective", "about me", "career summary"},
    "skills": {"skills", "technical skills", "key skills", "core competencies", "skills summary", "technical proficiency", "skill set"},
    "experience": {"experience", "work experience", "professional experience", "employment history", "work history", "internships", "internship experience"},
    "education": {"education", "academic background", "educational qualifications", "academic qualifications", "education and training", "academics"},
    "projects": {"projects", "academic projects", "personal projects", "key projects", "project work"},
    "certifications": {"certifications", "certificates", "licenses", "certifications and courses", "courses", "licenses and certifications"},
}
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONES = [re.compile(r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?!\d)"),
          re.compile(r"(?<!\d)(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)")]
BULLET = re.compile(r"^[\-\u2022\*\u25cf\u25aa\u2013\u2023\u25e6>]+\s*")
LEVELS = [
    (5, "Doctorate", re.compile(r"\bph\.?\s?d\b|\bdoctorate\b", re.I)),
    (4, "Master's", re.compile(r"\bm\.?\s?tech\b|\bm\.?\s?sc\b|\bmca\b|\bmba\b|\bmaster'?s?\b|\bm\.e\b", re.I)),
    (3, "Bachelor's", re.compile(r"\bb\.?\s?tech\b|\bb\.?\s?sc\b|\bbca\b|\bbba\b|\bb\.?\s?com\b|\bbachelor'?s?\b|\bb\.e\b", re.I)),
    (2, "Diploma", re.compile(r"\bdiploma\b|\bassociate degree\b", re.I)),
    (1, "High school", re.compile(r"\bhigh school\b|\b12th\b|\bhsc\b", re.I)),
]
RANGE = re.compile(r"((?:19|20)\d{2})\s*(?:-|\u2013|\u2014|to)\s*((?:19|20)\d{2}|present|current|now|till date|ongoing)", re.I)
EXPLICIT_YEARS = re.compile(r"(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)\b[^.\n]{0,40}experience", re.I)
CERT_LINE = re.compile(r"certified|certification|certificate", re.I)


def strip_bullet(line):
    return BULLET.sub("", line).strip()


def is_bullet(line):
    return bool(BULLET.match(line))


def _heading_key(line):
    l = re.sub(r"\s+", " ", re.sub(r"[:\-\u2013\u2014_|]+$", "", line.lower())).strip()
    if not l or len(l) > 40:
        return None
    for key, names in HEADINGS.items():
        if l in names:
            return key
    return None


def split_sections(text):
    sections, cur = {}, None
    for raw in text.splitlines():
        line = raw.strip()
        key = _heading_key(line)
        if key:
            cur = key
            sections.setdefault(key, [])
        elif cur and line:
            sections[cur].append(line)
    return {k: v for k, v in sections.items() if v}


def _name(lines):
    for ln in lines[:6]:
        s = ln.strip()
        if not s or "@" in s or re.search(r"\d", s) or len(s) > 40 or s.lower() in ("resume", "curriculum vitae", "cv") or _heading_key(s):
            continue
        words = s.replace(",", " ").split()
        if 2 <= len(words) <= 4 and all(re.fullmatch(r"[A-Za-z.'-]+", w) and w[0].isupper() for w in words):
            return " ".join(w.capitalize() if w.isupper() else w for w in words)
    return None


def _phone(text):
    head = text[:700]
    for scope in (head, text):
        for pat in PHONES:
            m = pat.search(scope)
            if m:
                return m.group(0).strip()
    return None


def _education_level(text):
    best = (0, None)
    for lvl, label, pat in LEVELS:
        if pat.search(text) and lvl > best[0]:
            best = (lvl, label)
    return best


def _years_from_ranges(lines):
    now = datetime.now().year
    spans = []
    for m in RANGE.finditer("\n".join(lines)):
        s = int(m.group(1)); e = m.group(2).lower()
        e = now if not e[0].isdigit() else int(e)
        if e >= s:
            spans.append((s, e))
    spans.sort()
    total, cur_s, cur_e = 0, None, None
    for s, e in spans:
        if cur_e is None or s > cur_e:
            if cur_e is not None:
                total += cur_e - cur_s
            cur_s, cur_e = s, e
        else:
            cur_e = max(cur_e, e)
    if cur_e is not None:
        total += cur_e - cur_s
    return float(total) if total > 0 else None


def extract_info(text):
    lines = [l for l in text.splitlines()]
    sec = split_sections(text)
    edu_lines = sec.get("education") or [l.strip() for l in lines if any(p.search(l) for _, _, p in LEVELS) and len(l) < 160]
    edu_text = " ".join(edu_lines)
    lvl, lvl_label = _education_level(edu_text)
    exp_lines = sec.get("experience", [])
    years = _years_from_ranges(exp_lines) if exp_lines else None
    if years is None:
        m = EXPLICIT_YEARS.search(text)
        years = float(m.group(1)) if m else None
    certs = sec.get("certifications") or [l.strip() for l in lines if CERT_LINE.search(l) and len(l) < 120]
    emails = EMAIL.findall(text)
    return {
        "name": _name(lines),
        "email": emails[0] if emails else None,
        "phone": _phone(text),
        "education": [strip_bullet(l)[:200] for l in edu_lines[:6]],
        "education_level": lvl or None,
        "education_level_label": lvl_label,
        "skills": extract_skills(text),
        "experience": [strip_bullet(l)[:200] for l in exp_lines if not is_bullet(l)][:8] or [strip_bullet(l)[:200] for l in exp_lines[:5]],
        "years_experience": years,
        "certifications": [strip_bullet(l)[:200] for l in certs[:8]],
        "projects": [strip_bullet(l)[:220] for l in sec.get("projects", [])[:8]],
        "summary": " ".join(sec["summary"])[:600] if sec.get("summary") else None,
        "sections_found": sorted(sec.keys()),
        "word_count": len(text.split()),
    }
