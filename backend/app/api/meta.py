from fastapi import APIRouter, HTTPException

from app.services.ml_service import get_ml
from app.services.reference import list_roles

router = APIRouter(tags=["meta"])


@router.get("/meta/roles")
def roles():
    return {"roles": list_roles()}


@router.get("/ml/metrics")
def metrics():
    ml = get_ml()
    if not ml.ok:
        raise HTTPException(503, ml.error)
    return ml.metrics
