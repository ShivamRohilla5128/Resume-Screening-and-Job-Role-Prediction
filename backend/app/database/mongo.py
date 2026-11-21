"""MongoDB connection (PyMongo). MONGO_URI=mongomock gives an in-memory database for demos/tests."""
import logging
from datetime import datetime, timezone

from app import config
from app.services.reference import load_reference

log = logging.getLogger("resume-ai")
_db = None


def get_db():
    global _db
    if _db is None:
        if config.MONGO_URI == "mongomock":
            import mongomock
            client = mongomock.MongoClient()
            log.warning("Using in-memory mongomock database - data is lost on restart")
        else:
            from pymongo import MongoClient
            client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=4000)
        _db = client[config.MONGO_DB]
    return _db


def init_db():
    """Create indexes (TTL indexes implement the retention policy) and seed the job_roles collection."""
    db = get_db()
    try:
        db.users.create_index("email", unique=True)
        db.resumes.create_index("expires_at", expireAfterSeconds=0)
        db.analysis_results.create_index("expires_at", expireAfterSeconds=0)
        db.analysis_results.create_index([("user_id", 1), ("created_at", -1)])
        db.screening_sessions.create_index([("user_id", 1), ("created_at", -1)])
    except Exception as e:  # noqa: BLE001
        log.warning("Index creation issue: %s", e)
    for role, v in load_reference().items():
        db.job_roles.update_one({"role": role}, {"$set": {"role": role, **v, "updated_at": datetime.now(timezone.utc)}}, upsert=True)
    log.info("Database ready (%s)", config.MONGO_DB)
