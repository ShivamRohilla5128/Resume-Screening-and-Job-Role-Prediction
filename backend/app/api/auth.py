import logging, time
from collections import defaultdict

import jwt
from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from app import config
from app.api.deps import current_user
from app.database.mongo import get_db
from app.schemas.schemas import AuthOut, ForgotIn, LoginIn, RegisterIn, ResetIn, UserOut
from app.utils.helpers import now, oid
from app.utils.security import create_token, decode_token, fingerprint, hash_password, validate_password, verify_password

log = logging.getLogger("resume-ai")
router = APIRouter(prefix="/auth", tags=["auth"])
_FAILS = defaultdict(list)           # simple in-memory brute-force throttle: 5 failures / 5 minutes per e-mail
LOCK_SECONDS, MAX_FAILS = 300, 5


def _user_out(u):
    return UserOut(id=str(u["_id"]), name=u["name"], email=u["email"])


@router.post("/register", response_model=AuthOut, status_code=201)
def register(body: RegisterIn):
    try:
        validate_password(body.password)
    except ValueError as e:
        raise HTTPException(422, str(e))
    doc = {"name": body.name.strip(), "email": body.email.lower(), "password_hash": hash_password(body.password), "created_at": now()}
    try:
        res = get_db().users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "An account with this e-mail already exists")
    doc["_id"] = res.inserted_id
    return AuthOut(access_token=create_token(str(res.inserted_id), config.TOKEN_HOURS), user=_user_out(doc))


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn):
    email = body.email.lower()
    recent = [t for t in _FAILS[email] if time.time() - t < LOCK_SECONDS]
    _FAILS[email] = recent
    if len(recent) >= MAX_FAILS:
        raise HTTPException(429, "Too many failed attempts. Try again in a few minutes.")
    user = get_db().users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        _FAILS[email].append(time.time())
        raise HTTPException(401, "Incorrect e-mail or password")
    _FAILS.pop(email, None)
    hours = config.TOKEN_HOURS_REMEMBER if body.remember else config.TOKEN_HOURS
    return AuthOut(access_token=create_token(str(user["_id"]), hours), user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(user=Depends(current_user)):
    return _user_out(user)


@router.post("/forgot-password")
def forgot(body: ForgotIn):
    """No SMTP server is bundled: the reset link is written to the server log (development mode)."""
    user = get_db().users.find_one({"email": body.email.lower()})
    if user:
        token = create_token(str(user["_id"]), 0.5, typ="reset", extra={"fp": fingerprint(user["password_hash"])})
        log.warning("PASSWORD RESET LINK (dev mode, would be e-mailed): %s/reset-password?token=%s", config.CORS_ORIGINS[0], token)
    return {"message": "If an account exists for that e-mail, a reset link has been generated. In this build it is printed in the backend console."}


@router.post("/reset-password")
def reset(body: ResetIn):
    try:
        validate_password(body.password)
        payload = decode_token(body.token, typ="reset")
    except ValueError as e:
        raise HTTPException(422, str(e))
    except jwt.PyJWTError:
        raise HTTPException(400, "Reset link is invalid or has expired")
    db = get_db()
    user = db.users.find_one({"_id": oid(payload["sub"])})
    if not user or fingerprint(user["password_hash"]) != payload.get("fp"):
        raise HTTPException(400, "Reset link is invalid or has already been used")
    db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(body.password)}})
    return {"message": "Password updated. You can now log in."}
