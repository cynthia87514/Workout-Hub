from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dbconfig import get_db
from model.user import User
from service.auth import create_access_token, get_current_user
from schema.profile import EmailCheckRequest, PasswordVerifyRequest, UpdateUserInfoRequest, UpdateUserPasswordRequest

ProfileRouter = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)

# 確認 email 是否重複
@ProfileRouter.post("/check-email")
async def check_email(email_check_request: EmailCheckRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email_check_request.email).first()
    if user and user.id != current_user.id:  # 忽略當前用戶自己的 Email
        return {"isAvailable": False}
    return {"isAvailable": True}

# 驗證密碼
@ProfileRouter.post("/verify-password")
async def verify_password(password_verify_request: PasswordVerifyRequest, current_user: User = Depends(get_current_user)):
    if not current_user.check_password(password_verify_request.currentPassword):
        return {"isPasswordCorrect": False}
    return {"isPasswordCorrect": True}

# 更新使用者資訊
@ProfileRouter.post("/update-user-info")
async def update_user_info(update_user_info_request: UpdateUserInfoRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 更新 username 和 email
    current_user.username = update_user_info_request.username
    current_user.email = update_user_info_request.email
    db.commit()
    # 生成新的 JWT
    access_token = create_access_token(data={"sub": current_user.email})
    
    return {"status": "success", "access_token": access_token}

# 更新用户密码
@ProfileRouter.post("/update-user-password")
async def update_user_password(update_user_password_request: UpdateUserPasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.set_password(update_user_password_request.newPassword)
    db.commit()

    return {"status": "success", "message": "Password updated successfully"}