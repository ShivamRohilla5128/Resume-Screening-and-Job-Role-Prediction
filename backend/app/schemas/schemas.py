"""Pydantic request/response schemas."""
from typing import List, Optional

from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$"


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False


class ForgotIn(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, max_length=254)


class ResetIn(BaseModel):
    token: str = Field(min_length=10, max_length=2000)
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    id: str
    name: str
    email: str


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ResumeRef(BaseModel):
    resume_id: str = Field(min_length=12, max_length=40)
    job_role: Optional[str] = Field(default=None, max_length=80)


class MatchIn(BaseModel):
    resume_id: str = Field(min_length=12, max_length=40)
    job_role: str = Field(default="", max_length=80)
    job_description: str = Field(default="", max_length=20000)
    required_skills: List[str] = Field(default_factory=list, max_length=60)


class GapIn(BaseModel):
    resume_id: str = Field(min_length=12, max_length=40)
    job_role: str = Field(min_length=2, max_length=80)
