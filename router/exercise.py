from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from model.exercise import Exercise
from schema.exercise import ExerciseSchema
from typing import List
from dbconfig import get_db

ExerciseRouter = APIRouter(
    prefix="/api",
    tags=["Exercise"]
)

@ExerciseRouter.get("/exercises", response_model=List[ExerciseSchema])
def get_exercises(db: Session = Depends(get_db)):
    try:
        results = Exercise.get_all_exercises(db)
        if not results:
            raise HTTPException(status_code=404, detail="No exercises found")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))