import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database.mongo import get_db
from app.utils.helpers import oid
from app.utils.security import decode_token

bearer = HTTPBearer(auto_error=False)


def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    if not cred:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(cred.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired - please log in again")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_db().users.find_one({"_id": oid(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user
