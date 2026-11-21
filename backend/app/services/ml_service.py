"""Loads the trained artifacts once and serves predictions + explanations. Never retrains."""
import json, logging
import joblib
import numpy as np

from app.config import ARTIFACT_DIR
from app.services.reference import get_role
from ml.preprocessing.skills_vocab import extract_skills
from ml.preprocessing.text import clean_text

log = logging.getLogger("resume-ai")
NOTE = ("This is the classifier's estimated probability that the resume text resembles training resumes labelled with this role. "
        "It is NOT a hiring, employability or interview probability.")


def _linear_weights(clf):
    if hasattr(clf, "coef_"):
        return clf.coef_
    cals = getattr(clf, "calibrated_classifiers_", None)
    if cals:
        ws = []
        for c in cals:
            est = getattr(c, "estimator", None) or getattr(c, "base_estimator", None)
            if est is not None and hasattr(est, "coef_"):
                ws.append(est.coef_)
        if ws:
            return np.mean(ws, axis=0)
    return None


class MLService:
    def __init__(self, art_dir=ARTIFACT_DIR):
        self.ok, self.error, self.metrics = False, None, {}
        try:
            self.clf = joblib.load(art_dir / "resume_classifier.pkl")
            self.vec = joblib.load(art_dir / "tfidf_vectorizer.pkl")
            self.le = joblib.load(art_dir / "label_encoder.pkl")
            self.features = self.vec.get_feature_names_out()
            self.weights = _linear_weights(self.clf)
            self.importances = getattr(self.clf, "feature_importances_", None)
            mp = art_dir / "metrics.json"
            self.metrics = json.loads(mp.read_text(encoding="utf-8")) if mp.exists() else {}
            self.ok = True
        except Exception as e:  # noqa: BLE001
            self.error = ("Trained model artifacts not found. Run  python -m ml.training.train  from the project root "
                          f"(details: {e})")
            log.error(self.error)

    @property
    def classes(self):
        return list(self.le.classes_) if self.ok else []

    @property
    def info(self):
        d = self.metrics.get("dataset", {})
        return {"name": self.metrics.get("best_model"), "is_synthetic": d.get("is_synthetic"), "dataset": d.get("file"), "n_classes": len(self.classes)}

    def _explain(self, X, class_idx, top=8):
        row = X.tocsr()
        idx, vals = row.indices, row.data
        if idx.size == 0:
            return []
        if self.weights is not None and self.weights.shape[0] > class_idx:
            contrib = self.weights[class_idx, idx] * vals
        elif self.importances is not None:
            contrib = self.importances[idx] * vals
        else:
            return []
        order = np.argsort(-contrib)[:top]
        return [{"term": str(self.features[idx[i]]), "weight": round(float(contrib[i]), 4)} for i in order if contrib[i] > 0]

    def predict(self, text, detected_skills=None, top_k=3):
        if not self.ok:
            raise RuntimeError(self.error)
        X = self.vec.transform([clean_text(text)])
        proba = self.clf.predict_proba(X)[0]
        order = np.argsort(-proba)
        classes = self.le.classes_
        best = int(order[0])
        role = str(classes[best])
        skills = detected_skills if detected_skills is not None else extract_skills(text)
        ref = get_role(role)
        supporting, missing = [], []
        if ref:
            rel = set(ref["required"]) | set(ref["optional"])
            supporting = [s for s in skills if s in rel]
            missing = [s for s in ref["required"] if s not in skills]
        return {
            "primary": {"role": role, "probability": round(float(proba[best]), 4)},
            "alternatives": [{"role": str(classes[i]), "probability": round(float(proba[i]), 4)} for i in order[1:1 + top_k]],
            "supporting_skills": supporting,
            "missing_skills": missing,
            "top_terms": self._explain(X, best),
            "low_signal": bool(X.nnz < 5),
            "note": NOTE,
            "model": self.info,
        }


_service = None


def get_ml():
    global _service
    if _service is None:
        _service = MLService()
    return _service
