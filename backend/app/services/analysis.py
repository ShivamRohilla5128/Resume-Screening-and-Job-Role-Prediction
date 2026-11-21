"""Orchestrates extraction -> prediction -> review for one resume."""
from app.services.extractor import extract_info
from app.services.improvement import review


def build_analysis(text, ml, target_role=None):
    info = extract_info(text)
    prediction = ml.predict(text, detected_skills=info["skills"])
    role = target_role or prediction["primary"]["role"]
    return {"info": info, "prediction": prediction, "review": review(text, info, role)}
