import json
import sys, os

# 添加項目根目錄到 sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dbconfig import Database

# 創建 Table
def create_table():
    create_table_query = """
    CREATE TABLE IF NOT EXISTS exercises (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` TEXT NOT NULL,
        `force` VARCHAR(255),
        `level` VARCHAR(255) NOT NULL,
        `mechanic` VARCHAR(255),
        `equipment` VARCHAR(255),
        `primary_muscles` JSON,
        `secondary_muscles` JSON,
        `instructions` JSON,
        `category` VARCHAR(255) NOT NULL,
        `images` JSON
    )
    """
    Database.execute_query(create_table_query)

# 導入資料
def import_data(json_file):
    file_path = os.path.join(os.path.dirname(__file__), json_file)
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)
    
    insert_query = """
    INSERT INTO exercises (`name`, `force`, `level`, `mechanic`, `equipment`, `primary_muscles`, `secondary_muscles`, `instructions`, `category`, `images`)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    for exercise in data["exercises"]:
        Database.execute_query(insert_query, (
            exercise.get("name"),
            exercise.get("force"),
            exercise.get("level"),
            exercise.get("mechanic"),
            exercise.get("equipment"),
            json.dumps(exercise.get("primaryMuscles", [])),
            json.dumps(exercise.get("secondaryMuscles", [])),
            json.dumps(exercise.get("instructions", [])),
            exercise.get("category"),
            json.dumps(exercise.get("images", []))
        ))

def main():
    create_table()
    import_data("exercises_data.json")

if __name__ == "__main__":
    main()