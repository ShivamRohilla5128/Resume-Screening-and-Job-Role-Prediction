"""Skills reference dataset (Job_Role, Required_Skills, Optional_Skills)."""
import csv
from functools import lru_cache

from app.config import ROOT_DIR

CSV_PATH = ROOT_DIR / "ml" / "datasets" / "skills_reference.csv"


@lru_cache(maxsize=1)
def load_reference():
    out = {}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            out[r["Job_Role"].strip()] = {
                "required": [s.strip() for s in r["Required_Skills"].split(",") if s.strip()],
                "optional": [s.strip() for s in r["Optional_Skills"].split(",") if s.strip()],
            }
    return out


def get_role(role):
    ref = load_reference()
    if not role:
        return None
    for k, v in ref.items():
        if k.lower() == role.strip().lower():
            return {"role": k, **v}
    return None


def list_roles():
    return [{"role": k, **v} for k, v in load_reference().items()]
