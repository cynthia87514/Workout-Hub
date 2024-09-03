from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int

class UserInResponse(UserInDB):
    profile_image_url: Optional[str] = None
    is_token_valid: bool

class UserLogin(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    status: str