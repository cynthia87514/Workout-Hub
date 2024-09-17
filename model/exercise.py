from sqlalchemy import Column, Integer, String, JSON, PrimaryKeyConstraint, UniqueConstraint
from sqlalchemy.orm import relationship, Session
from dbconfig import Base

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, autoincrement=True)
    name = Column(String(255), nullable=False)
    force = Column(String(255))
    level = Column(String(255), nullable=False)
    mechanic = Column(String(255))
    equipment = Column(String(255))
    primary_muscles = Column(JSON, nullable=False)
    secondary_muscles = Column(JSON)
    instructions = Column(JSON, nullable=False)
    category = Column(String(255), nullable=False)
    images = Column(JSON, nullable=False)
    
    workouts_items = relationship("WorkoutsItem", back_populates="exercise")

    __table_args__ = (
        PrimaryKeyConstraint("id", "name"),
        UniqueConstraint("name", name="uix_exercise_name"),
    )
    
    @staticmethod
    def get_all_exercises(db: Session):
        results = db.query(
            Exercise.name,
            Exercise.equipment,
            Exercise.primary_muscles,
            Exercise.instructions,
            Exercise.category,
            Exercise.images
        ).all()
        exercises = [result._asdict() for result in results]
        return exercises