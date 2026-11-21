"""PDF report generation with ReportLab."""
import io
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

NAVY, BLUE = colors.HexColor("#14213D"), colors.HexColor("#2563EB")


def _t(v):
    s = "Not detected" if v in (None, "", []) else str(v)
    return escape(s.encode("latin-1", "replace").decode("latin-1"))


def _l(lst):
    return _t(", ".join(lst) if lst else "None")


def build_pdf(doc):
    buf = io.BytesIO()
    pdf = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm, title="Resume Analysis Report")
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=ss["Title"], textColor=NAVY, fontSize=20, alignment=0)
    h2 = ParagraphStyle("h2", parent=ss["Heading2"], textColor=BLUE, fontSize=13, spaceBefore=10)
    body = ParagraphStyle("b", parent=ss["BodyText"], fontSize=9.5, leading=13, textColor=colors.HexColor("#1E293B"))
    small = ParagraphStyle("s", parent=body, fontSize=8, textColor=colors.HexColor("#64748B"))
    P = lambda t, st=body: Paragraph(t, st)
    info, pred, rev = doc.get("info", {}), doc.get("prediction", {}), doc.get("review", {})
    out = [P("AI Resume Screening &amp; Job Role Prediction - Analysis Report", h1),
           P(f"File: {_t(doc.get('filename'))} &nbsp;|&nbsp; Generated: {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC", small), Spacer(1, 6)]

    out.append(P("Candidate details", h2))
    rows = [["Name", _t(info.get("name"))], ["Email", _t(info.get("email"))], ["Phone", _t(info.get("phone"))],
            ["Education", _t("; ".join(info.get("education", [])[:3]))],
            ["Experience (years)", _t(info.get("years_experience"))], ["Certifications", _t("; ".join(info.get("certifications", [])[:4]))],
            ["Skills", _t(", ".join(info.get("skills", [])))]]
    t = Table([[P(f"<b>{a}</b>"), P(b)] for a, b in rows], colWidths=[38 * mm, 130 * mm])
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), .4, colors.HexColor("#E2E8F0")), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    out.append(t)

    if pred:
        out.append(P("Predicted job role", h2))
        p = pred["primary"]
        out.append(P(f"<b>{_t(p['role'])}</b> - model probability {p['probability'] * 100:.1f}%"))
        out.append(P("Alternatives: " + _t(", ".join(f"{a['role']} ({a['probability'] * 100:.1f}%)" for a in pred.get("alternatives", [])))))
        out.append(P("Supporting skills: " + _l(pred.get("supporting_skills"))))
        out.append(P("Missing role skills: " + _l(pred.get("missing_skills"))))
        if pred.get("model", {}).get("is_synthetic"):
            out.append(P("WARNING: the model was trained on a synthetic demo dataset; treat predictions as a demonstration only.", small))
        out.append(P(_t(pred.get("note")), small))

    m = doc.get("match")
    if m:
        out.append(P("Job description match", h2))
        out.append(P(f"Overall estimated compatibility: <b>{m['overall_score']:.1f}%</b> (role: {_t(m.get('job_role'))})"))
        t = Table([["Component", "Score", "Weight", "Detail"]] + [[P(_t(c["label"])), f"{c['score']:.0f}%", f"{c['weight'] * 100:.0f}%", P(_t(c["detail"]), small)] for c in m["components"]],
                  colWidths=[48 * mm, 18 * mm, 18 * mm, 84 * mm])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), .4, colors.HexColor("#E2E8F0")), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
        out += [t, P("Matched: " + _l(m["matched_skills"])), P("Missing: " + _l(m["missing_skills"])), P(_t(m["disclaimer"]), small)]

    g = doc.get("gap")
    if g:
        out.append(P(f"Skill gap - {_t(g['job_role'])}", h2))
        out.append(P(f"Coverage: required {g['coverage']['required']}%, optional {g['coverage']['optional']}%. Estimated learning time: {g['total_weeks']} weeks."))
        for ph in g["roadmap"]:
            out.append(P(f"<b>{_t(ph['phase'])}</b> ({ph['weeks']} wks): {_t(', '.join(ph['skills']))}"))
        for pj in g["projects"]:
            out.append(P(f"- <b>{_t(pj['title'])}</b>: {_t(pj['description'])} ({_t(', '.join(pj['skills']))})"))

    if rev:
        out.append(P(f"Resume review - overall {rev['overall']:.0f}/100", h2))
        for s in rev["sections"]:
            out.append(P(f"<b>{_t(s['label'])}</b>: {s['score']}/100 - " + _t(" ".join(s["issues"] + s["tips"]) or "No issues found.")))
        out.append(P(_t(rev.get("disclaimer")), small))
    out += [Spacer(1, 8), P("This report supports human decision-making. It does not make hiring decisions and does not use protected characteristics.", small)]
    pdf.build(out)
    return buf.getvalue()
