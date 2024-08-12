from datetime import datetime
from pytz import timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from dbconfig import Base

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_time():
    return datetime.now(taipei_tz)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=get_taipei_time)
    updated_at = Column(DateTime, default=get_taipei_time, onupdate=get_taipei_time)
    
    workouts = relationship("Workouts", back_populates="user", cascade="all, delete-orphan")