from datetime import datetime
from pytz import timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from dbconfig import Base

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_date():
    return datetime.now(taipei_tz).date()

def get_taipei_time():
    return datetime.now(taipei_tz)

class Workouts(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    date = Column(Date, default=get_taipei_date, nullable=False, index=True)
    created_at = Column(DateTime, default=get_taipei_time)
    updated_at = Column(DateTime, default=get_taipei_time, onupdate=get_taipei_time)

    user = relationship("User", back_populates="workouts")
    workouts_items = relationship("WorkoutsItem", back_populates="workout", cascade="all, delete-orphan")

class WorkoutsItem(Base):
    __tablename__ = "workouts_item"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"))
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=get_taipei_time)
    updated_at = Column(DateTime, default=get_taipei_time, onupdate=get_taipei_time)

    workout = relationship("Workouts", back_populates="workouts_items")
    item_sets = relationship("ItemSet", back_populates="workouts_item", cascade="all, delete-orphan")

class ItemSet(Base):
    __tablename__ = "item_set"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    workouts_item_id = Column(Integer, ForeignKey("workouts_item.id", ondelete="CASCADE"))
    set_number = Column(Integer, nullable=False)
    weight = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=get_taipei_time)
    updated_at = Column(DateTime, default=get_taipei_time, onupdate=get_taipei_time)

    workouts_item = relationship("WorkoutsItem", back_populates="item_sets")