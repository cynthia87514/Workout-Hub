from datetime import datetime
from pytz import timezone
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from dbconfig import Base
from model.user import User

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_time():
    return datetime.now(taipei_tz)

class Diet(Base):
    __tablename__ = "diet"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    calories = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fats = Column(Float, nullable=False)
    created_at = Column(DateTime, default=get_taipei_time)
    
    user = relationship("User", back_populates="diet")

User.diet = relationship("Diet", back_populates="user", cascade="all, delete-orphan")