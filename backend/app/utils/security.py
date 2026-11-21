"""Password hashing (PBKDF2-SHA256, salted) and signed JWT tokens."""
import hashlib, hmac, os, re
from datetime import datetime, timedelta, timezone

import jwt

from app.config import SECRET_KEY

ITERATIONS = 240_000


def hash_password(password):
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password, stored):
    try:
        _, it, salt, digest = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(it))
        return hmac.compare_digest(dk.hex(), digest)
    except Exception:  # noqa: BLE001
        return False


def validate_password(password):
    if len(password) < 8 or not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise ValueError("Password must be at least 8 characters and contain a letter and a number")


def fingerprint(stored_hash):
    return hashlib.sha256(stored_hash.encode()).hexdigest()[:16]


def create_token(user_id, hours, typ="access", extra=None):
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "typ": typ, "iat": now, "exp": now + timedelta(hours=hours), **(extra or {})}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token, typ="access"):
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    if payload.get("typ") != typ:
        raise jwt.InvalidTokenError("wrong token type")
    return payload
