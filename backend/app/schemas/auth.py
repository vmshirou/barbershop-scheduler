from pydantic import BaseModel
from app.schemas.user import UserRead


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: str | None = None
    rol: str | None = None

class LoginResponse(BaseModel):
    token: Token
    user: UserRead