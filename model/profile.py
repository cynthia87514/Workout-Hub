from datetime import datetime
from pytz import timezone
from sqlalchemy import Column, Integer, Float, ForeignKey, String, DateTime, Enum
from sqlalchemy.orm import relationship
from dbconfig import Base
from math import log10
from model.user import User

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_time():
    return datetime.now(taipei_tz)

class BodyInformation(Base):
    __tablename__ = "body_information"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    gender = Column(Enum("Male", "Female", name="gender_enum"), nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    age = Column(Integer, nullable=False)
    neck_circumference = Column(Float, nullable=True)
    waist_circumference = Column(Float, nullable=True)
    hip_circumference = Column(Float, nullable=True)
    activity_level = Column(String(100), nullable=False)
    bmi = Column(Float, nullable=True)
    pbf = Column(Float, nullable=True)
    bmr = Column(Float, nullable=True)
    tdee = Column(Float, nullable=True)
    created_at = Column(DateTime, default=get_taipei_time)
    updated_at = Column(DateTime, default=get_taipei_time, onupdate=get_taipei_time)

    user = relationship("User", back_populates="body_information")

    def calculate_bmi(self):
        height_in_meters = self.height / 100
        bmi = self.weight / (height_in_meters ** 2)
        return round(bmi, 2)

    def calculate_pbf(self):
        bmi = self.calculate_bmi()
        
        if self.gender == "Male":
            if self.neck_circumference and self.waist_circumference:
                pbf = 495 / (1.0324 - 0.19077 * log10(self.waist_circumference - self.neck_circumference) + 0.15456 * log10(self.height)) - 450
            else:
                pbf = (1.2 * bmi) + (0.23 * self.age) - 16.2
        elif self.gender == "Female":
            if self.neck_circumference and self.waist_circumference and self.hip_circumference:
                pbf = 495 / (1.29579 - 0.35004 * log10(self.waist_circumference + self.hip_circumference - self.neck_circumference) + 0.22100 * log10(self.height)) - 450
            else:
                pbf = (1.2 * bmi) + (0.23 * self.age) - 5.4
                
        return round(pbf, 2)

    def calculate_bmr(self):
        if self.gender == "Male":
            bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) + 5
        elif self.gender == "Female":
            bmr = (10 * self.weight) + (6.25 * self.height) - (5 * self.age) - 161
        return round(bmr, 2)

    def calculate_tdee(self):
        bmr = self.calculate_bmr()
        activity_level_multiplier = {
            "sedentary": 1.2,
            "lightly_active": 1.375,
            "moderately_active": 1.55,
            "active": 1.725,
            "very_active": 1.9
        }
        tdee = bmr * activity_level_multiplier[self.activity_level]
        return round(tdee, 2)

User.body_information = relationship("BodyInformation", back_populates="user", uselist=False, cascade="all, delete-orphan")

class BodyHistory(Base):
    __tablename__ = "body_history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    weight = Column(Float, nullable=False)
    pbf = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=get_taipei_time)

    user = relationship("User", back_populates="body_history")

User.body_history = relationship("BodyHistory", back_populates="user", cascade="all, delete-orphan")