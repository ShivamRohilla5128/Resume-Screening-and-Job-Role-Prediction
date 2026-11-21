"""Train, compare, evaluate and save the resume classifier.

Usage (from the project root):
    python -m ml.datasets.generate_synthetic_dataset      # SYNTHETIC smoke-test data only
    python -m ml.training.train                            # trains on the synthetic CSV
    python -m ml.training.train --data path/to/UpdatedResumeDataSet.csv --map-to-supported   # real Kaggle data

Leakage control: preprocessing is stateless (ml.preprocessing.text); TF-IDF lives *inside* each sklearn Pipeline, so it is
re-fitted on the training portion of every CV fold and never sees validation/test text. The model is chosen by CV macro-F1
on the training split only; the 20% test split is used once, for reporting.
"""
import argparse, json, os, sys, time
from collections import Counter
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import LinearSVC

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, ROOT)
from ml.evaluation.metrics import evaluate  # noqa: E402
from ml.preprocessing.skills_vocab import SKILLS  # noqa: E402
from ml.preprocessing.text import clean_text  # noqa: E402

TEXT_COLS = ["Resume_Text", "Resume_str", "Resume", "resume_text", "resume", "Text"]
CAT_COLS = ["Category", "category", "Job_Role", "Label"]
# Category names seen in public Kaggle resume datasets -> this app's supported roles (verify against your CSV!)
SUPPORTED_MAP = {"data science": "Data Scientist", "data scientist": "Data Scientist", "java developer": "Java Developer",
                 "python developer": "Python Developer", "devops engineer": "DevOps Engineer", "business analyst": "Business Analyst",
                 "database": "Database Administrator", "network security engineer": "Cybersecurity Analyst", "web designing": "Web Developer",
                 "information-technology": "Software Engineer"}


def load_dataset(path, map_to_supported):
    df = pd.read_csv(path)
    tcol = next((c for c in TEXT_COLS if c in df.columns), None)
    ccol = next((c for c in CAT_COLS if c in df.columns), None)
    if not tcol or not ccol:
        raise SystemExit(f"Could not find text/category columns in {list(df.columns)}. Expected one of {TEXT_COLS} and {CAT_COLS}.")
    df = df[[tcol, ccol]].rename(columns={tcol: "text", ccol: "category"})
    info = {"rows_raw": int(len(df))}
    df = df.dropna()
    info["rows_after_dropna"] = int(len(df))
    if map_to_supported:
        df["category"] = df["category"].astype(str).str.strip().str.lower().map(SUPPORTED_MAP)
        df = df.dropna()
    df["category"] = df["category"].astype(str).str.strip()
    df["clean"] = df["text"].astype(str).map(clean_text)
    df = df[df["clean"].str.len() > 20]
    df = df.drop_duplicates(subset="clean")                       # duplicates would leak across the split
    info["rows_after_dedup"] = int(len(df))
    return df.reset_index(drop=True), info


def build_models(seed):
    def tfidf():
        return TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=2, max_df=0.9, max_features=20000)
    return {
        "Logistic Regression": Pipeline([("tfidf", tfidf()), ("clf", LogisticRegression(max_iter=2000, C=10, class_weight="balanced"))]),
        "Random Forest": Pipeline([("tfidf", tfidf()), ("clf", RandomForestClassifier(n_estimators=300, class_weight="balanced", n_jobs=-1, random_state=seed))]),
        "SVM (Linear, calibrated)": Pipeline([("tfidf", tfidf()), ("clf", CalibratedClassifierCV(LinearSVC(C=1.0, class_weight="balanced"), cv=3))]),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.join(ROOT, "ml", "datasets", "resume_dataset_synthetic.csv"))
    ap.add_argument("--out", default=os.path.join(ROOT, "ml", "artifacts"))
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--min-class-size", type=int, default=10)
    ap.add_argument("--map-to-supported", action="store_true", help="map public-dataset categories to the 15 supported roles and drop the rest")
    ap.add_argument("--synthetic", choices=["auto", "yes", "no"], default="auto")
    a = ap.parse_args()

    is_synth = ("synthetic" in os.path.basename(a.data).lower()) if a.synthetic == "auto" else a.synthetic == "yes"
    df, info = load_dataset(a.data, a.map_to_supported)
    counts = Counter(df["category"])
    small = [c for c, n in counts.items() if n < a.min_class_size]
    if small:
        print(f"Dropping classes with < {a.min_class_size} samples: {small}")
        df = df[~df["category"].isin(small)].reset_index(drop=True)
        counts = Counter(df["category"])
    print(f"{len(df)} resumes, {len(counts)} classes  (synthetic={is_synth})")

    le = LabelEncoder()
    y = le.fit_transform(df["category"])
    X_tr, X_te, y_tr, y_te = train_test_split(df["clean"], y, test_size=0.2, stratify=y, random_state=a.seed)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=a.seed)

    results, fitted = {}, {}
    for name, pipe in build_models(a.seed).items():
        t0 = time.time()
        cv_f1 = cross_val_score(pipe, X_tr, y_tr, cv=cv, scoring="f1_macro", n_jobs=1)
        pipe.fit(X_tr, y_tr)
        m = evaluate(y_te, pipe.predict(X_te), list(le.classes_))
        m.update(cv_f1_macro_mean=round(float(cv_f1.mean()), 4), cv_f1_macro_std=round(float(cv_f1.std()), 4), train_seconds=round(time.time() - t0, 1))
        results[name], fitted[name] = m, pipe
        print(f"{name:28s} CV-F1={m['cv_f1_macro_mean']:.3f}  test acc={m['accuracy']:.3f}  test macro-F1={m['f1_macro']:.3f}")

    best = max(results, key=lambda n: results[n]["cv_f1_macro_mean"])      # selection uses validation folds only
    pipe = fitted[best]
    print("Best model (by CV macro-F1):", best)

    os.makedirs(a.out, exist_ok=True)
    joblib.dump(pipe.named_steps["clf"], os.path.join(a.out, "resume_classifier.pkl"))
    joblib.dump(pipe.named_steps["tfidf"], os.path.join(a.out, "tfidf_vectorizer.pkl"))
    joblib.dump(le, os.path.join(a.out, "label_encoder.pkl"))
    joblib.dump({n: {"aliases": d["aliases"], "level": d["level"], "category": d["category"]} for n, d in SKILLS.items()},
                os.path.join(a.out, "skill_extractor.pkl"))
    metrics = {
        "trained_at": datetime.now(timezone.utc).isoformat(), "best_model": best, "selection_metric": "5-fold CV macro-F1 on the training split",
        "dataset": {"file": os.path.basename(a.data), "is_synthetic": is_synth, **info, "rows_used": int(len(df)),
                    "n_classes": len(counts), "class_distribution": dict(sorted(counts.items(), key=lambda kv: -kv[1])),
                    "imbalance_ratio_max_over_min": round(max(counts.values()) / min(counts.values()), 2),
                    "train_size": int(len(X_tr)), "test_size": int(len(X_te)), "split": "80/20 stratified"},
        "features": {"vectorizer": "TF-IDF, ngram_range=(1,2), sublinear_tf, min_df=2, max_df=0.9, max_features=20000",
                     "n_features": int(len(pipe.named_steps["tfidf"].vocabulary_))},
        "classes": list(le.classes_), "models": results,
    }
    with open(os.path.join(a.out, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print("Saved artifacts to", a.out)


if __name__ == "__main__":
    main()
