# Model evaluation results (auto-generated)

> **WARNING - synthetic data.** These numbers come from the generated demo dataset (`resume_dataset_1500_synthetic.csv`). They verify that the pipeline works; they are **not** evidence of real-world accuracy. Re-run training on a real dataset and regenerate this file with `python -m ml.evaluation.make_report`.

- Trained at: 2026-11-21T06:24:13.846253+00:00
- Dataset file: `resume_dataset_1500_synthetic.csv` (rows raw 1500, used 1500 after cleaning/de-duplication)
- Classes: 15 | imbalance ratio (max/min): 1.0
- Split: 80/20 stratified - train 1200, test 300
- Features: TF-IDF, ngram_range=(1,2), sublinear_tf, min_df=2, max_df=0.9, max_features=20000 (6224 features)
- Selected model: **SVM (Linear, calibrated)** (by 5-fold CV macro-F1 on the training split)

## Comparison

| Model | CV F1 macro | Accuracy | Precision (w) | Recall (w) | F1 (w) | F1 (macro) |
|---|---|---|---|---|---|---|
| Logistic Regression | 0.99 ± 0.0042 | 0.9933 | 0.9937 | 0.9933 | 0.9933 | 0.9933 |
| Random Forest | 0.9733 ± 0.0111 | 0.9933 | 0.9937 | 0.9933 | 0.9932 | 0.9932 |
| SVM (Linear, calibrated) **(best)** | 0.9908 ± 0.0041 | 0.9933 | 0.9937 | 0.9933 | 0.9933 | 0.9933 |

## Per-class report - SVM (Linear, calibrated) (test set)

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Backend Developer | 1.000 | 1.000 | 1.000 | 20 |
| Business Analyst | 1.000 | 1.000 | 1.000 | 20 |
| Cloud Engineer | 1.000 | 1.000 | 1.000 | 20 |
| Cybersecurity Analyst | 1.000 | 1.000 | 1.000 | 20 |
| Data Analyst | 1.000 | 1.000 | 1.000 | 20 |
| Data Scientist | 0.952 | 1.000 | 0.976 | 20 |
| Database Administrator | 0.952 | 1.000 | 0.976 | 20 |
| DevOps Engineer | 1.000 | 1.000 | 1.000 | 20 |
| Frontend Developer | 1.000 | 1.000 | 1.000 | 20 |
| Full Stack Developer | 1.000 | 1.000 | 1.000 | 20 |
| Java Developer | 1.000 | 1.000 | 1.000 | 20 |
| Machine Learning Engineer | 1.000 | 0.950 | 0.974 | 20 |
| Python Developer | 1.000 | 1.000 | 1.000 | 20 |
| Software Engineer | 1.000 | 1.000 | 1.000 | 20 |
| Web Developer | 1.000 | 0.950 | 0.974 | 20 |

Confusion matrices for every model are stored in `ml/artifacts/metrics.json` and rendered in the app (ML Model page).
