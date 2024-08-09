from pydantic import BaseModel
from typing import List, Optional

class ExerciseSchema(BaseModel):
    name: str
    equipment: Optional[str]
    primary_muscles: List[str]
    instructions: List[str]
    category: str
    images: List[str]

    class Config:
        orm_mode = True