# Datasets

| File | What it is | Real? |
|---|---|---|
| `skills_reference.csv` | Job_Role / Required_Skills / Optional_Skills for the 15 supported roles (hand-written reference used for skill-gap and matching; **not** training data) | curated reference |
| `generate_synthetic_dataset.py` -> `resume_dataset_synthetic.csv` | 750 **synthetic** resumes (50 per role) generated from templates, for smoke-testing the pipeline | **SYNTHETIC** |
| `resume_dataset_1500_synthetic.csv` | 1,500 template-generated resumes (100 per supported role), provided in the resume training pack | **SYNTHETIC** |

Train with the included 1,500-resume dataset:

```
python -m ml.training.train --data ml/datasets/resume_dataset_1500_synthetic.csv --synthetic yes
```

These are synthetic resumes, so the resulting metrics are for demonstration only and do not represent real-world performance.

## Training on a real dataset (required for a meaningful lab result)

This project was built in an offline environment, so no real dataset was downloaded or bundled. Download one yourself:

1. Kaggle - *Resume Dataset* (snehaanbhawal): https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset  (`Resume/Resume.csv`, columns `Resume_str`, `Category`)
2. Kaggle - *Updated Resume Dataset* (gauravduttakiit): https://www.kaggle.com/datasets/gauravduttakiit/resume-dataset  (`UpdatedResumeDataSet.csv`, columns `Category`, `Resume`)
3. Hugging Face datasets: https://huggingface.co/datasets (search "resume")

Check each dataset page for its **licence and attribution requirements** and cite it in your report. Verify the column names and category labels before training.

```
python -m ml.training.train --data path\to\Resume.csv
python -m ml.training.train --data path\to\UpdatedResumeDataSet.csv --map-to-supported
```

* Without `--map-to-supported` the model learns whatever categories the CSV contains (e.g. HR, Teacher, ...). Skill-gap/matching only work for roles present in `skills_reference.csv`; other labels still get predictions but no skill-gap data.
* With `--map-to-supported` categories are mapped to this app's roles through the `SUPPORTED_MAP` dict in `ml/training/train.py` (check it against your CSV's real labels) and all other categories are dropped. Public datasets will not cover all 15 roles.
* Accepted text columns: `Resume_Text`, `Resume_str`, `Resume`; category columns: `Category`, `Job_Role`.
* Afterwards run `python -m ml.evaluation.make_report` to refresh `docs/ML_RESULTS.md`, and restart the backend.
