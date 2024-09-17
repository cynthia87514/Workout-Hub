from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dbconfig import get_db
from redisconfig import get_redis
from model.workout import Workouts, WorkoutsItem, ItemSet
from model.user import User
from schema.workout import WorkoutCreate, WorkoutDetail, WorkoutResponse, WorkoutUpdate
from service.auth import get_current_user
from datetime import datetime
from pytz import timezone
from typing import List
import calendar
import json

WorkoutRouter = APIRouter(
    prefix="/api",
    tags=["Workout"]
)

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def last_day_of_month(year, month):
    return calendar.monthrange(year, month)[1]

# 儲存 workout 資料及新增模板到資料庫
@WorkoutRouter.post("/workout", response_model=WorkoutResponse)
def create_workout(workout: WorkoutCreate, db: Session = Depends(get_db), redis_client = Depends(get_redis), current_user: User = Depends(get_current_user)):
    created_at = workout.created_at if hasattr(workout, "created_at") else datetime.now(taipei_tz)
    
    new_workout = Workouts(
        user_id=current_user.id,
        title=workout.title,
        is_template=workout.is_template,
        created_at=created_at,
        updated_at=datetime.now(taipei_tz)
    )
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
    
    for item in workout.workout_items:
        workout_item = WorkoutsItem(
            workout_id=new_workout.id,
            exercise_name=item.exercise_name,
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

    if workout.is_template:
        cache_key = f"user:{current_user.id}:templates"
        redis_client.delete(cache_key)
        print(f"Cache cleared for key: {cache_key}")

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

# 取得 template workout 資料
@WorkoutRouter.get("/workout/templates", response_model=List[WorkoutDetail])
def get_template_workouts(db: Session = Depends(get_db), redis_client = Depends(get_redis), current_user: User = Depends(get_current_user)):
    cache_key = f"user:{current_user.id}:templates"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        print("Fetching templates data from Redis cache")
        return json.loads(cached_data)
    
    try: 
        templates = db.query(Workouts).filter(
            Workouts.user_id == current_user.id,
            Workouts.is_template == True
        ).order_by(Workouts.created_at.asc()).all()

        templates_detail = []
        for template in templates:
            template_dict = WorkoutDetail.model_validate(template).model_dump()
            template_dict["created_at"] = template_dict["created_at"].isoformat()
            template_dict["workout_items"] = [
                {
                    "id": item.id,
                    "exercise_name": item.exercise_name,
                    "item_sets": [
                        {
                            "id": set.id,
                            "set_number": set.set_number,
                            "weight": set.weight,
                            "reps": set.reps
                        } for set in item.item_sets
                    ]
                } for item in template.workouts_items
            ]

            templates_detail.append(template_dict)

        redis_client.set(cache_key, json.dumps(templates_detail), ex=86400)
        print("Fetching templates data from database and caching it in Redis")
        
        return templates_detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 刪除 template workout 資料
@WorkoutRouter.delete("/workout/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_workout(template_id: int, db: Session = Depends(get_db), redis_client = Depends(get_redis), current_user: User = Depends(get_current_user)):
    workout = db.query(Workouts).filter(Workouts.id == template_id, Workouts.user_id == current_user.id).first()
    if workout is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(workout)
    db.commit()
    
    cache_key = f"user:{current_user.id}:templates"
    redis_client.delete(cache_key)
    print(f"Cache cleared for key: {cache_key}")
    
    return {"message": "Template deleted successfully"}

# 取得指定月份的 workout 資料
@WorkoutRouter.get("/workouts/month/{month}", response_model=List[WorkoutResponse])
def get_workouts_by_month(month: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        year, month = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Expected 'YYYY-MM'.")
    
    start_date = datetime(year, month, 1)
    last_day = last_day_of_month(year, month)
    end_date = datetime(year, month, last_day, 23, 59, 59)
    
    workouts = db.query(Workouts).filter(
        Workouts.user_id == current_user.id,
        Workouts.is_template == False,
        Workouts.created_at >= start_date,
        Workouts.created_at <= end_date
    ).order_by(Workouts.created_at.asc()).all()
    
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
        "created_at": workout.created_at,
        "is_template": workout.is_template,
        "workout_items": [
            {
                "id": item.id,
                "exercise_name": item.exercise_name,
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

# 更新 tempalte 功能
@WorkoutRouter.put("/workout/templates/{template_id}", response_model=WorkoutDetail)
def update_template_workout(template_id: int, workout_update: WorkoutUpdate, db: Session = Depends(get_db), redis_client = Depends(get_redis), current_user: User = Depends(get_current_user)):
    workout = db.query(Workouts).filter(Workouts.id == template_id, Workouts.user_id == current_user.id).first()
    if workout is None or not workout.is_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if workout_update.title:
        workout.title = workout_update.title
    
    workout.updated_at = datetime.now(taipei_tz)
    
    existing_items = {item.id: item for item in workout.workouts_items}
    
    for item_update in workout_update.workout_items:
        if item_update.id:
            workout_item = existing_items.pop(item_update.id, None)
            if workout_item:
                workout_item.exercise_name = item_update.exercise_name
        else:
            workout_item = WorkoutsItem(
                workout_id=workout.id,
                exercise_name=item_update.exercise_name
            )
            db.add(workout_item)
            db.commit()
            db.refresh(workout_item)
        
        existing_sets = {set.id: set for set in workout_item.item_sets}
        
        for set_update in item_update.item_sets:
            if set_update.id:
                item_set = existing_sets.pop(set_update.id, None)
                if item_set:
                    item_set.set_number = set_update.set_number
                    item_set.weight = set_update.weight
                    item_set.reps = set_update.reps
            else:
                item_set = ItemSet(
                    workouts_item_id=workout_item.id,
                    set_number=set_update.set_number,
                    weight=set_update.weight,
                    reps=set_update.reps
                )
                db.add(item_set)

        for set_id in existing_sets:
            db.delete(existing_sets[set_id])
        db.commit()

    for item_id in existing_items:
        db.delete(existing_items[item_id])
    db.commit()

    updated_workout = db.query(Workouts).filter(Workouts.id == template_id).first()
    
    workout_dict = {
        "id": updated_workout.id,
        "title": updated_workout.title,
        "created_at": updated_workout.created_at,
        "is_template": updated_workout.is_template,
        "workout_items": [
            {
                "id": item.id,
                "exercise_name": item.exercise_name,
                "item_sets": [
                    {
                        "id": set.id,
                        "set_number": set.set_number,
                        "weight": set.weight,
                        "reps": set.reps
                    } for set in item.item_sets
                ]
            } for item in updated_workout.workouts_items
        ]
    }

    cache_key = f"user:{current_user.id}:templates"
    redis_client.delete(cache_key)
    print(f"Cache cleared for key: {cache_key}")
    
    return workout_dict