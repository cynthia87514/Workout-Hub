from dotenv import load_dotenv
import os
import mysql.connector
from mysql.connector import pooling

load_dotenv()

# MySQL 配置
DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_USER = os.getenv("DATABASE_USER")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
DATABASE_NAME = os.getenv("DATABASE_NAME")

class Database:
    pool = pooling.MySQLConnectionPool(
        pool_name = "mypool",
        pool_size = 10,
        pool_reset_session = True,
        host = DATABASE_HOST,
        user = DATABASE_USER,
        password = DATABASE_PASSWORD,
        database = DATABASE_NAME
    )

    @staticmethod
    def execute_query(query, params=None, dictionary=False):
        try:
            cnx = Database.pool.get_connection()
            if cnx.is_connected():
                cursor = cnx.cursor(dictionary=dictionary)
                cursor.execute(query, params)
                if query.strip().lower().startswith("select"):
                    data = cursor.fetchall()
                    return data
                else:
                    cnx.commit()
        except mysql.connector.Error as error:
            print("Error while connecting to MySQL", error)
        finally:
            if cnx.is_connected():
                cursor.close()
                cnx.close()