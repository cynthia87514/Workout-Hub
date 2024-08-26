import json
import sys
import os

# 添加項目根目錄到 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dbconfig import SessionLocal
from model.exercise import Exercise
from model.workout import WorkoutsItem
from model.user import User

# 導入資料
def import_data(json_file):
    file_path = os.path.join(os.path.dirname(__file__), json_file)
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    session = SessionLocal()
    try:
        for exercise in data["exercises"]:
            existing_exercise = session.query(Exercise).filter_by(name=exercise.get("name")).first()
            if existing_exercise:
                print(f"Exercise with name {exercise.get('name')} already exists, skipping.")
                continue
            
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
    import_data("exercises_data.json")

if __name__ == "__main__":
    main()