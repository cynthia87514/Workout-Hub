from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dbconfig import get_db
from model.workout import Workouts, WorkoutsItem, ItemSet
from model.user import User
from schema.workout import WorkoutCreate, WorkoutDetail, WorkoutResponse
from service.auth import get_current_user
from datetime import datetime
from pytz import timezone
import calendar
from typing import List

WorkoutRouter = APIRouter(
    prefix="/api",
    tags=["Workout"]
)

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_date():
    return datetime.now(taipei_tz).date()

def last_day_of_month(year, month):
    return calendar.monthrange(year, month)[1]

# 儲存 workout 資料到資料庫
@WorkoutRouter.post("/workout", response_model=WorkoutResponse)
def create_workout(workout: WorkoutCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_workout = Workouts(
        user_id=current_user.id,
        title=workout.title,
        date=get_taipei_date(),  # 使用當天的日期
    )
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
    
    for item in workout.workout_items:
        workout_item = WorkoutsItem(
            workout_id=new_workout.id,
            name=item.name,
        )
        db.add(workout_item)
        db.commit()
        db.refresh(workout_item)
        
        for set_detail in item.item_sets:
            item_set = ItemSet(
                workouts_item_id=workout_item.id,
                set_number=set_detail.set_number,
                weight=set_detail.weight,
                reps=set_detail.reps,
            )
            db.add(item_set)
        db.commit()

    return new_workout

# 刪除 workout 資料
@WorkoutRouter.delete("/workout/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workouts).filter(Workouts.id == workout_id, Workouts.user_id == current_user.id).first()
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    db.delete(workout)
    db.commit()
    return {"message": "Workout deleted successfully"}

# 取得指定月份的 workout 資料
@WorkoutRouter.get("/workouts/month/{month}", response_model=List[WorkoutResponse])
def get_workouts_by_month(month: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        year, month = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected 'YYYY-MM'.")
    
    last_day = last_day_of_month(year, month)
    workouts = db.query(Workouts).filter(
        Workouts.user_id == current_user.id,
        Workouts.date >= f"{year}-{month:02d}-01",
        Workouts.date <= f"{year}-{month:02d}-{last_day}"
    ).all()
    return workouts

# 取得特定 workout 資料
@WorkoutRouter.get("/workout/{workout_id}", response_model=WorkoutDetail)
def get_workout_detail(workout_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workout = db.query(Workouts).filter(Workouts.id == workout_id, Workouts.user_id == current_user.id).first()
    
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    workout_dict = {
        "id": workout.id,
        "title": workout.title,
        "date": workout.date,
        "workout_items": [
            {
                "id": item.id,
                "name": item.name,
                "item_sets": [
                    {
                        "id": set.id,
                        "set_number": set.set_number,
                        "weight": set.weight,
                        "reps": set.reps
                    } for set in item.item_sets
                ]
            } for item in workout.workouts_items
        ]
    }

    return workout_dict