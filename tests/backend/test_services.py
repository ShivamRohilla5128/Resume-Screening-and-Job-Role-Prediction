"""Service-level tests (no web server / database needed).  Run from the project root:  python -m unittest discover -s tests -v"""
import io, os, sys, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path[:0] = [ROOT, os.path.join(ROOT, "backend")]

from app.services import parser, extractor, matching, gap, improvement, report  # noqa: E402
from app.services.analysis import build_analysis  # noqa: E402
from app.services.ml_service import MLService  # noqa: E402

RESUME = """Jane Doe
jane.doe@example.com | +91 98765 43210

PROFESSIONAL SUMMARY
Data analyst with 3 years of experience using Python, SQL and Power BI to turn data into decisions.

SKILLS
Technical Skills: Python, SQL, Excel, Power BI, Pandas, Data Visualization

EXPERIENCE
Data Analyst - Acme Corp (2021 - 2024)
- Built Power BI dashboards that cut reporting time by 40%
- Responsible for weekly SQL reports
- Automated data cleaning with Pandas

EDUCATION
B.Sc in Statistics, City University, 2020

PROJECTS
- Sales dashboard: Power BI and SQL
- Churn analysis with Python and Pandas

CERTIFICATIONS
- Google Data Analytics Certificate
"""


def make_docx(text):
    import docx
    d = docx.Document()
    for line in text.splitlines():
        d.add_paragraph(line)
    b = io.BytesIO(); d.save(b)
    return b.getvalue()


class ParserTests(unittest.TestCase):
    def test_docx_roundtrip(self):
        txt = parser.extract_text("cv.docx", make_docx(RESUME), 5 * 1024 * 1024)
        self.assertIn("Jane Doe", txt)

    def test_rejects_bad_files(self):
        for name, data in [("a.exe", b"MZ" + b"0" * 100), ("a.pdf", b"not a pdf" * 20), ("a.docx", b"not zip" * 20), ("a.pdf", b"")]:
            with self.assertRaises(parser.ParseError):
                parser.extract_text(name, data, 1024 * 1024)
        with self.assertRaises(parser.ParseError):
            parser.extract_text("a.docx", make_docx(RESUME), 100)    # too large

    def test_safe_filename(self):
        self.assertEqual(parser.safe_filename("../../etc/pa<ss>wd.pdf"), "pa_ss_wd.pdf")


class ExtractorTests(unittest.TestCase):
    def setUp(self):
        self.info = extractor.extract_info(RESUME)

    def test_fields(self):
        i = self.info
        self.assertEqual(i["name"], "Jane Doe")
        self.assertEqual(i["email"], "jane.doe@example.com")
        self.assertIn("98765", i["phone"])
        self.assertEqual(i["education_level_label"], "Bachelor's")
        self.assertEqual(i["years_experience"], 3.0)
        self.assertTrue({"Python", "SQL", "Power BI", "Excel", "Pandas"} <= set(i["skills"]))
        self.assertEqual(len(i["projects"]), 2)
        self.assertEqual(len(i["certifications"]), 1)

    def test_missing_fields_are_not_invented(self):
        i = extractor.extract_info("Some text about nothing in particular, with no structure at all. " * 3)
        self.assertIsNone(i["name"]); self.assertIsNone(i["email"]); self.assertIsNone(i["phone"])
        self.assertEqual(i["skills"], []); self.assertIsNone(i["years_experience"])


class GapAndImproveTests(unittest.TestCase):
    def setUp(self):
        self.info = extractor.extract_info(RESUME)

    def test_gap_is_dynamic(self):
        g1 = gap.gap_analysis(self.info, "Data Analyst")
        g2 = gap.gap_analysis({**self.info, "skills": []}, "Data Analyst")
        self.assertEqual(g1["coverage"]["required"], 100)
        self.assertEqual(g2["coverage"]["required"], 0)
        self.assertNotEqual(g1["roadmap"], g2["roadmap"])
        self.assertTrue(g2["projects"])

    def test_review_flags_weak_phrase(self):
        r = improvement.review(RESUME, self.info, "Data Analyst")
        self.assertTrue(any("Responsible for" in w["original"] for w in r["wording_examples"]))
        self.assertTrue(0 <= r["overall"] <= 100)


class MatchingTests(unittest.TestCase):
    def test_score_orders_sensibly(self):
        info = extractor.extract_info(RESUME)
        jd_good = "We need a data analyst with Python, SQL and Power BI experience. 2+ years experience. Bachelor's degree required. " * 2
        jd_bad = "We need a Kubernetes and Terraform platform engineer with AWS, Docker and Jenkins. 5+ years experience. " * 2
        good = matching.match_resume(RESUME, info, "Data Analyst", jd_good, [])
        bad = matching.match_resume(RESUME, info, "DevOps Engineer", jd_bad, [])
        self.assertGreater(good["overall_score"], bad["overall_score"] + 30)
        self.assertIn("Kubernetes", bad["missing_skills"])
        self.assertAlmostEqual(sum(c["weight"] for c in good["components"]), 1.0, places=2)
        self.assertIn("not a hiring decision", good["disclaimer"])

    def test_custom_required_skills_and_error(self):
        info = extractor.extract_info(RESUME)
        r = matching.match_resume(RESUME, info, "", "", ["python", "COBOL"])
        self.assertEqual(r["matched_skills"], ["Python"]); self.assertEqual(r["missing_skills"], ["COBOL"])
        with self.assertRaises(ValueError):
            matching.match_resume(RESUME, info, "", "", [])


@unittest.skipUnless(os.path.exists(os.path.join(ROOT, "ml", "artifacts", "resume_classifier.pkl")), "train the model first")
class MLAndReportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ml = MLService()

    def test_prediction_shape(self):
        a = build_analysis(RESUME, self.ml)
        p = a["prediction"]
        self.assertTrue(self.ml.ok)
        self.assertEqual(len(p["alternatives"]), 3)
        self.assertLessEqual(p["primary"]["probability"], 1.0)
        self.assertIn("NOT a hiring", p["note"])
        self.assertTrue(p["top_terms"])

    def test_pdf_report(self):
        a = build_analysis(RESUME, self.ml)
        info = a["info"]
        doc = {**a, "filename": "cv.docx", "match": matching.match_resume(RESUME, info, "Data Analyst", "", [], self.ml),
               "gap": gap.gap_analysis(info, "Data Scientist")}
        pdf = report.build_pdf(doc)
        self.assertTrue(pdf.startswith(b"%PDF") and len(pdf) > 2000)


if __name__ == "__main__":
    unittest.main()
