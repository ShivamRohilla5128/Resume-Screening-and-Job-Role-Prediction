# Model evaluation results (auto-generated)

> **WARNING - synthetic data.** These numbers come from the generated demo dataset (`resume_dataset_synthetic.csv`). They verify that the pipeline works; they are **not** evidence of real-world accuracy. Re-run training on a real dataset and regenerate this file with `python -m ml.evaluation.make_report`.

- Trained at: 2026-11-18T05:08:12.458180+00:00
- Dataset file: `resume_dataset_synthetic.csv` (rows raw 750, used 750 after cleaning/de-duplication)
- Classes: 15 | imbalance ratio (max/min): 1.0
- Split: 80/20 stratified - train 600, test 150
- Features: TF-IDF, ngram_range=(1,2), sublinear_tf, min_df=2, max_df=0.9, max_features=20000 (4236 features)
- Selected model: **SVM (Linear, calibrated)** (by 5-fold CV macro-F1 on the training split)

## Comparison

| Model | CV F1 macro | Accuracy | Precision (w) | Recall (w) | F1 (w) | F1 (macro) |
|---|---|---|---|---|---|---|
| Logistic Regression | 0.9732 ± 0.0124 | 0.9733 | 0.9758 | 0.9733 | 0.9733 | 0.9733 |
| Random Forest | 0.9564 ± 0.0162 | 0.96 | 0.9627 | 0.96 | 0.9595 | 0.9595 |
| SVM (Linear, calibrated) **(best)** | 0.9765 ± 0.01 | 0.9733 | 0.9752 | 0.9733 | 0.9729 | 0.9729 |

## Per-class report - SVM (Linear, calibrated) (test set)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Backend Developer | 1.000 | 1.000 | 1.000 | 10 |
| Business Analyst | 1.000 | 1.000 | 1.000 | 10 |
| Cloud Engineer | 1.000 | 0.800 | 0.889 | 10 |
| Cybersecurity Analyst | 0.909 | 1.000 | 0.952 | 10 |
| Data Analyst | 1.000 | 1.000 | 1.000 | 10 |
| Data Scientist | 0.909 | 1.000 | 0.952 | 10 |
| Database Administrator | 1.000 | 1.000 | 1.000 | 10 |
| DevOps Engineer | 0.909 | 1.000 | 0.952 | 10 |
| Frontend Developer | 1.000 | 1.000 | 1.000 | 10 |
| Full Stack Developer | 1.000 | 1.000 | 1.000 | 10 |
| Java Developer | 0.900 | 0.900 | 0.900 | 10 |
| Machine Learning Engineer | 1.000 | 0.900 | 0.947 | 10 |
| Python Developer | 1.000 | 1.000 | 1.000 | 10 |
| Software Engineer | 1.000 | 1.000 | 1.000 | 10 |
| Web Developer | 1.000 | 1.000 | 1.000 | 10 |

Confusion matrices for every model are stored in `ml/artifacts/metrics.json` and rendered in the app (ML Model page).
