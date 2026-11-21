"""ML tests. Run from the project root:  python -m unittest discover -s tests -v"""
import json, os, sys, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, ROOT)
from ml.preprocessing.skills_vocab import extract_skills, normalize_skill  # noqa: E402
from ml.preprocessing.text import clean_text  # noqa: E402


class PreprocessTests(unittest.TestCase):
    def test_clean_text_strips_contact_and_stopwords(self):
        out = clean_text("Email me at a@b.com or +91 98765 43210. I built Pandas pipelines and kubernetes clusters.")
        self.assertNotIn("a@b.com", out); self.assertNotIn("98765", out)
        self.assertIn("pandas", out); self.assertIn("kubernetes", out); self.assertNotIn(" and ", f" {out} ")

    def test_skill_boundaries(self):
        self.assertEqual(extract_skills("JavaScript and PostgreSQL"), ["JavaScript", "PostgreSQL"])   # not Java / SQL
        self.assertEqual(normalize_skill("sklearn"), "Scikit-learn")


class ArtifactTests(unittest.TestCase):
    path = os.path.join(ROOT, "ml", "artifacts", "metrics.json")

    @unittest.skipUnless(os.path.exists(path), "train the model first")
    def test_metrics_file(self):
        m = json.load(open(self.path))
        self.assertGreaterEqual(len(m["models"]), 3)
        self.assertEqual(m["dataset"]["split"], "80/20 stratified")
        self.assertEqual(m["dataset"]["train_size"] + m["dataset"]["test_size"], m["dataset"]["rows_used"])
        self.assertIn("is_synthetic", m["dataset"])
        for v in m["models"].values():
            self.assertTrue(0 <= v["accuracy"] <= 1)


if __name__ == "__main__":
    unittest.main()
