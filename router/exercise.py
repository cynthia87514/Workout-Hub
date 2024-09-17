from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from model.exercise import Exercise
from schema.exercise import ExerciseSchema
from typing import List
from dbconfig import get_db
from redisconfig import get_redis
import json

ExerciseRouter = APIRouter(
    prefix="/api",
    tags=["Exercise"]
)

@ExerciseRouter.get("/exercises", response_model=List[ExerciseSchema])
def get_exercises(db: Session = Depends(get_db), redis_client = Depends(get_redis)):
    cache_key = "exercises_data"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        print("Fetching exercises data from Redis cache")
        return json.loads(cached_data)

    try:
        results = Exercise.get_all_exercises(db)
        if not results:
            raise HTTPException(status_code=404, detail="No exercises found")
        
        redis_client.set(cache_key, json.dumps(results), ex=86400)
        print("Fetching exercises data from database and caching it in Redis")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))