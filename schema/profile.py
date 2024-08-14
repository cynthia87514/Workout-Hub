from pydantic import BaseModel, Field

class EmailCheckRequest(BaseModel):
    email: str
    
class PasswordVerifyRequest(BaseModel):
    currentPassword: str
    
class UpdateUserInfoRequest(BaseModel):
    username: str
    email: str
    
class UpdateUserPasswordRequest(BaseModel):
    newPassword: str = Field(..., example="new_password")