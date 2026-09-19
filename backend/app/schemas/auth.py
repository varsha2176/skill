from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    name: str
    is_sme: bool = False
    user_code: str | None = None


class TokenData(BaseModel):
    user_id: int | None = None


class LoginRequest(BaseModel):
    email: str
    password: str
