"""End-to-end API test: register -> login -> upload -> analyze -> predict -> match -> gap -> improve -> history -> report -> rank -> delete.
Needs: fastapi, httpx, mongomock, pymongo (see requirements.txt) and trained artifacts (python -m ml.training.train).
Run from the project root:  python -m unittest tests.backend.test_api -v
"""
import importlib.util, os, sys, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path[:0] = [ROOT, os.path.join(ROOT, "backend")]
os.environ.update(MONGO_URI="mongomock", SECRET_KEY="test-secret-key-for-unit-tests-only-0123456789")

HAVE = all(importlib.util.find_spec(m) for m in ("fastapi", "httpx", "mongomock", "pymongo", "multipart"))
ART = os.path.exists(os.path.join(ROOT, "ml", "artifacts", "resume_classifier.pkl"))


@unittest.skipUnless(HAVE and ART, "install requirements.txt and train the model first")
class ApiFlow(unittest.TestCase):
    def test_full_flow(self):
        from fastapi.testclient import TestClient
        from app.main import app
        from tests.backend.test_services import RESUME, make_docx

        docx = make_docx(RESUME)
        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        with TestClient(app) as c:
            self.assertEqual(c.get("/api/health").json()["model_loaded"], True)
            self.assertEqual(c.get("/api/history").status_code, 401)                       # protected
            r = c.post("/api/auth/register", json={"name": "T", "email": "t@example.com", "password": "weak"})
            self.assertEqual(r.status_code, 422)
            r = c.post("/api/auth/register", json={"name": "Tester", "email": "t@example.com", "password": "Secret123"})
            self.assertEqual(r.status_code, 201)
            self.assertEqual(c.post("/api/auth/register", json={"name": "T", "email": "t@example.com", "password": "Secret123"}).status_code, 409)
            self.assertEqual(c.post("/api/auth/login", json={"email": "t@example.com", "password": "wrong-pass1"}).status_code, 401)
            tok = c.post("/api/auth/login", json={"email": "t@example.com", "password": "Secret123"}).json()["access_token"]
            H = {"Authorization": f"Bearer {tok}"}

            bad = c.post("/api/resume/upload", files=[("files", ("x.exe", b"MZ" * 50, "application/octet-stream"))], headers=H)
            self.assertEqual(bad.status_code, 422)
            up = c.post("/api/resume/upload", files=[("files", ("jane.docx", docx, mime))], headers=H).json()
            rid = up["resumes"][0]["resume_id"]
            self.assertEqual(up["resumes"][0]["info"]["email"], "jane.doe@example.com")

            a = c.post("/api/resume/analyze", json={"resume_id": rid}, headers=H).json()
            self.assertIn("prediction", a)
            self.assertIn("prediction", c.post("/api/predict/job-role", json={"resume_id": rid}, headers=H).json())
            m = c.post("/api/match/job-description", json={"resume_id": rid, "job_role": "Data Analyst", "job_description": "", "required_skills": ["Python", "SQL"]}, headers=H).json()
            self.assertEqual(m["match"]["overall_score"] > 50, True)
            self.assertIn("coverage", c.post("/api/skills/gap-analysis", json={"resume_id": rid, "job_role": "Data Scientist"}, headers=H).json()["gap"])
            self.assertIn("sections", c.post("/api/resume/improve", json={"resume_id": rid}, headers=H).json()["review"])

            hist = c.get("/api/history", headers=H).json()["items"]
            self.assertEqual(len(hist), 1)
            aid = hist[0]["id"]
            self.assertEqual(c.get(f"/api/history/{aid}", headers=H).json()["match"]["overall_score"], m["match"]["overall_score"])
            pdf = c.get(f"/api/report/{aid}", headers=H)
            self.assertTrue(pdf.content.startswith(b"%PDF"))
            self.assertEqual(c.get("/api/dashboard/stats", headers=H).json()["total_resumes"], 1)

            rk = c.post("/api/screening/rank", headers=H, data={"job_description": "", "required_skills": "Python,SQL,Kubernetes", "job_role": ""},
                        files=[("files", ("a.docx", docx, mime)), ("files", ("b.pdf", b"%PDF-broken", "application/pdf"))]).json()
            self.assertEqual(len(rk["ranked"]), 1); self.assertEqual(len(rk["failed"]), 1)

            # isolation: a second user cannot see the first user's data
            c.post("/api/auth/register", json={"name": "Other", "email": "o@example.com", "password": "Secret123"})
            H2 = {"Authorization": "Bearer " + c.post("/api/auth/login", json={"email": "o@example.com", "password": "Secret123"}).json()["access_token"]}
            self.assertEqual(c.get(f"/api/history/{aid}", headers=H2).status_code, 404)

            self.assertEqual(c.delete(f"/api/history/{aid}", headers=H).status_code, 200)
            self.assertEqual(c.get(f"/api/history/{aid}", headers=H).status_code, 404)
            self.assertEqual(c.post("/api/resume/analyze", json={"resume_id": rid}, headers=H).status_code, 404)  # raw text removed with last analysis


if __name__ == "__main__":
    unittest.main()
