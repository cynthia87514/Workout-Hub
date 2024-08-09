from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from dbconfig import get_db
from schema.user import UserCreate, UserInDB, Token, UserLogin, UserInResponse, AuthResponse
from service.crud import create_user, authenticate_user, get_user_by_email
from service.auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, get_remaining_time, oauth2_scheme

Userrouter = APIRouter(
    prefix="/api",
    tags=["User"]
)

@Userrouter.post("/user/auth", response_model=AuthResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        create_user(db, user)
        return {"status": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@Userrouter.put("/user/auth", response_model=Token)
def login_for_access_token(user_login: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=user_login.email, password=user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@Userrouter.get("/user/auth", response_model=UserInResponse)
def get_current_user_info(current_user: UserInDB = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    remaining_time = get_remaining_time(token)
    is_token_valid = remaining_time.total_seconds() > 0
    return {"id": current_user.id, "email": current_user.email, "username": current_user.username, "is_token_valid": is_token_valid}