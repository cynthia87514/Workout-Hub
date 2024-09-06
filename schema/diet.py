from pydantic import BaseModel
from datetime import datetime
from typing import List

class DietBase(BaseModel):
    food: str
    quantity: float
    calories: float
    protein: float
    carbs: float
    fats: float

class DietResponse(DietBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DietListResponse(BaseModel):
    diets: List[DietResponse]

    class Config:
        from_attributes = True