from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def now():
    return datetime.now(timezone.utc)


def iso(dt):
    """ISO string with an explicit UTC offset (PyMongo returns naive UTC datetimes)."""
    return (dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt).isoformat()


def expires(days):
    return now() + timedelta(days=days)


def oid(value, what="id"):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {what}")


def ser(obj):
    """Make Mongo documents JSON-safe: _id -> id, ObjectId -> str, datetime -> ISO; strip internal fields."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("user_id", "expires_at", "password_hash"):
                continue
            out["id" if k == "_id" else k] = ser(v)
        return out
    if isinstance(obj, list):
        return [ser(v) for v in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return iso(obj)
    return obj
