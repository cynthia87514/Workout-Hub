from sqlalchemy.orm import Session
from model.user import User
from schema.user import UserCreate
import bcrypt
from pydantic import EmailStr

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise ValueError("Email already registered")

    if user.password:
        hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    else:
        hashed_password = None
        
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        profile_image_url=user.profile_image_url,
        login_method=user.login_method
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        return False
    return user