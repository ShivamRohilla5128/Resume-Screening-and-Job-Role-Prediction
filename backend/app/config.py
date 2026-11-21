"""Central configuration (environment variables; see .env.example)."""
import os, secrets, sys, logging
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))          # lets the backend import the shared `ml` package

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env")
except ImportError:                              # python-dotenv is optional
    pass

log = logging.getLogger("resume-ai")


def _int(name, default):
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")   # use "mongomock" for a zero-install demo DB
MONGO_DB = os.getenv("MONGO_DB", "resume_screening")
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(48)
    log.warning("SECRET_KEY not set - using an ephemeral key; logins will be invalidated on restart. Set it in .env")
TOKEN_HOURS = _int("TOKEN_HOURS", 8)
TOKEN_HOURS_REMEMBER = _int("TOKEN_HOURS_REMEMBER", 24 * 14)
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
MAX_UPLOAD_MB = _int("MAX_UPLOAD_MB", 5)
MAX_FILES_PER_REQUEST = _int("MAX_FILES_PER_REQUEST", 25)
RESUME_RETENTION_DAYS = _int("RESUME_RETENTION_DAYS", 30)       # raw resume text auto-deleted after this
ANALYSIS_RETENTION_DAYS = _int("ANALYSIS_RETENTION_DAYS", 180)  # analysis results auto-deleted after this
ARTIFACT_DIR = Path(os.getenv("ARTIFACT_DIR", ROOT_DIR / "ml" / "artifacts"))
