from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class ItemSetCreate(BaseModel):
    set_number: int
    weight: Optional[float]
    reps: Optional[int]

class WorkoutsItemCreate(BaseModel):
    name: str
    item_sets: List[ItemSetCreate]

class WorkoutCreate(BaseModel):
    title: str
    workout_items: List[WorkoutsItemCreate]

class ItemSetResponse(BaseModel):
    id: int
    set_number: int
    weight: Optional[float]
    reps: Optional[int]

    class Config:
        orm_mode = True

class WorkoutsItemResponse(BaseModel):
    id: int
    name: str
    item_sets: List[ItemSetResponse]

    class Config:
        orm_mode = True

class WorkoutResponse(BaseModel):
    id: int
    title: str
    date: date

    class Config:
        orm_mode = True

class WorkoutDetail(BaseModel):
    id: int
    title: str
    date: date
    workout_items: List[WorkoutsItemResponse]

    class Config:
        orm_mode = True