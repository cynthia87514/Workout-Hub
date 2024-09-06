from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class ItemSetCreate(BaseModel):
    set_number: int
    weight: Optional[float]
    reps: Optional[int]

class WorkoutsItemCreate(BaseModel):
    exercise_name: str
    item_sets: List[ItemSetCreate]

class WorkoutCreate(BaseModel):
    title: str
    workout_items: List[WorkoutsItemCreate]
    is_template: Optional[bool] = False
    created_at: Optional[datetime]

class ItemSetResponse(BaseModel):
    id: int
    set_number: int
    weight: Optional[float]
    reps: Optional[int]

    class Config:
        from_attributes = True

class WorkoutsItemResponse(BaseModel):
    id: int
    exercise_name: str
    item_sets: List[ItemSetResponse] = []

    class Config:
        from_attributes = True

class WorkoutResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    is_template: bool

    class Config:
        from_attributes = True

class WorkoutDetail(BaseModel):
    id: int
    title: str
    created_at: datetime
    is_template: bool
    workout_items: List[WorkoutsItemResponse] = []

    class Config:
        from_attributes = True
        
class ItemSetUpdate(BaseModel):
    id: Optional[int]
    set_number: int
    weight: Optional[float]
    reps: Optional[int]

class WorkoutsItemUpdate(BaseModel):
    id: Optional[int]
    exercise_name: str
    item_sets: List[ItemSetUpdate]

class WorkoutUpdate(BaseModel):
    title: Optional[str]
    workout_items: List[WorkoutsItemUpdate]