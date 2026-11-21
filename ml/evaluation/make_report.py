"""Render docs/ML_RESULTS.md from ml/artifacts/metrics.json (so reported numbers always come from an actual training run)."""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
m = json.load(open(os.path.join(ROOT, "ml", "artifacts", "metrics.json"), encoding="utf-8"))
d = m["dataset"]
L = ["# Model evaluation results (auto-generated)", ""]
if d["is_synthetic"]:
    L += ["> **WARNING - synthetic data.** These numbers come from the generated demo dataset (`%s`). They verify that the pipeline works; they are **not** evidence of real-world accuracy. Re-run training on a real dataset and regenerate this file with `python -m ml.evaluation.make_report`." % d["file"], ""]
L += [f"- Trained at: {m['trained_at']}", f"- Dataset file: `{d['file']}` (rows raw {d['rows_raw']}, used {d['rows_used']} after cleaning/de-duplication)",
      f"- Classes: {d['n_classes']} | imbalance ratio (max/min): {d['imbalance_ratio_max_over_min']}", f"- Split: {d['split']} - train {d['train_size']}, test {d['test_size']}",
      f"- Features: {m['features']['vectorizer']} ({m['features']['n_features']} features)", f"- Selected model: **{m['best_model']}** (by {m['selection_metric']})", "",
      "## Comparison", "", "| Model | CV F1 macro | Accuracy | Precision (w) | Recall (w) | F1 (w) | F1 (macro) |", "|---|---|---|---|---|---|---|"]
for n, r in m["models"].items():
    L.append(f"| {n}{' **(best)**' if n == m['best_model'] else ''} | {r['cv_f1_macro_mean']} ± {r['cv_f1_macro_std']} | {r['accuracy']} | {r['precision_weighted']} | {r['recall_weighted']} | {r['f1_weighted']} | {r['f1_macro']} |")
L += ["", f"## Per-class report - {m['best_model']} (test set)", "", "| Class | Precision | Recall | F1 | Support |", "|---|---|---|---|---|"]
rep = m["models"][m["best_model"]]["classification_report"]
for c in m["classes"]:
    x = rep[c]; L.append(f"| {c} | {x['precision']:.3f} | {x['recall']:.3f} | {x['f1-score']:.3f} | {int(x['support'])} |")
L += ["", "Confusion matrices for every model are stored in `ml/artifacts/metrics.json` and rendered in the app (ML Model page)."]
out = os.path.join(ROOT, "docs", "ML_RESULTS.md")
open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("Wrote", out)
