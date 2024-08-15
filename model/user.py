from datetime import datetime
from pytz import timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from dbconfig import Base
from passlib.context import CryptContext

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_time():
    return datetime.now(taipei_tz)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    profile_image_url = Column(Text, nullable=True, default=None)
    created_at = Column(DateTime, default=get_taipei_time)
    updated_at = Column(DateTime, default=get_taipei_time, onupdate=get_taipei_time)
    
    workouts = relationship("Workouts", back_populates="user", cascade="all, delete-orphan")
    
    # 驗證密碼 Function
    def check_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)
    
    # 設置密碼 Function
    def set_password(self, password: str):
        self.hashed_password = pwd_context.hash(password)