from dotenv import load_dotenv
import os
import redis

load_dotenv()

# AWS ElastiCache 配置
REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")
REDIS_DB = os.getenv("REDIS_DB")

# 建立 Redis 連接
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def get_redis():
    return redis_client