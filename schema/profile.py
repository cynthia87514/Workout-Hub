from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class EmailCheckRequest(BaseModel):
    email: str
    
class PasswordVerifyRequest(BaseModel):
    currentPassword: str
    
class UpdateUserInfoRequest(BaseModel):
    username: str
    email: str
    
class UpdateUserPasswordRequest(BaseModel):
    newPassword: str = Field(..., example="new_password")

class ActivityLevelEnum(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    active = "active"
    very_active = "very_active"

class BodyInformationRequest(BaseModel):
    gender: str
    height: float
    weight: float
    age: int
    neck_circumference: Optional[float] = None
    waist_circumference: Optional[float] = None
    hip_circumference: Optional[float] = None
    activity_level: ActivityLevelEnum
    bmi: Optional[float] = None
    pbf: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None

class BodyInformationResponse(BaseModel):
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    neck_circumference: Optional[float] = None
    waist_circumference: Optional[float] = None
    hip_circumference: Optional[float] = None
    activity_level: Optional[ActivityLevelEnum] = None
    bmi: Optional[float] = None
    pbf: Optional[float] = None
    bmr: Optional[float] = None
    tdee: Optional[float] = None
    
class BodyHistoryResponse(BaseModel):
    weight: float
    pbf: Optional[float]
    recorded_at: datetime