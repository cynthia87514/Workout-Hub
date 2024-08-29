from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date

from dbconfig import get_db
from service.auth import get_current_user
from model.user import User
from model.diet import Diet
from schema.diet import DietBase, DietResponse, DietListResponse

DietRouter = APIRouter(
    prefix="/api/diet",
    tags=["Diet"]
)

# 儲存 Diet 資料到資料庫
@DietRouter.post("", response_model=DietResponse)
def create_diet(diet: DietBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_diet = Diet(
        user_id=current_user.id,
        food=diet.food,
        quantity=diet.quantity,
        calories=diet.calories,
        protein=diet.protein,
        carbs=diet.carbs,
        fats=diet.fats,
        created_at=datetime.now()
    )
    db.add(new_diet)
    db.commit()
    db.refresh(new_diet)
    return new_diet

# 刪除 Diet 資料
@DietRouter.delete("/{diet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diet(diet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    diet_record = db.query(Diet).filter(Diet.id == diet_id, Diet.user_id == current_user.id).first()
    if diet_record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diet record not found")

    db.delete(diet_record)
    db.commit()
    return {"message": "Diet record deleted successfully"}

# 取得使用者的今日 Diet 資料
@DietRouter.get("", response_model=DietListResponse)
def get_diet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    diets = db.query(Diet).filter(Diet.user_id == current_user.id, Diet.created_at >= today).all()
    return {"diets": diets}