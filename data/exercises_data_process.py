import json
import sys
import os
from sqlalchemy import Column, Integer, String, JSON

# 添加項目根目錄到 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dbconfig import SessionLocal, Base, engine

# 定義 Model
class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    force = Column(String(255))
    level = Column(String(255), nullable=False)
    mechanic = Column(String(255))
    equipment = Column(String(255))
    primary_muscles = Column(JSON, nullable=False)
    secondary_muscles = Column(JSON)
    instructions = Column(JSON, nullable=False)
    category = Column(String(255), nullable=False)
    images = Column(JSON, nullable=False)

# 創建 Table
def create_table():
    Base.metadata.create_all(bind=engine)

# 導入資料
def import_data(json_file):
    file_path = os.path.join(os.path.dirname(__file__), json_file)
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    session = SessionLocal()
    try:
        for exercise in data["exercises"]:
            new_exercise = Exercise(
                name=exercise.get("name"),
                force=exercise.get("force"),
                level=exercise.get("level"),
                mechanic=exercise.get("mechanic"),
                equipment=exercise.get("equipment"),
                primary_muscles=exercise.get("primaryMuscles", []),
                secondary_muscles=exercise.get("secondaryMuscles", []),
                instructions=exercise.get("instructions", []),
                category=exercise.get("category"),
                images=exercise.get("images", [])
            )
            session.add(new_exercise)
        session.commit()
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

def main():
    create_table()
    import_data("exercises_data.json")

if __name__ == "__main__":
    main()