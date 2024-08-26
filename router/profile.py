from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from dbconfig import get_db
from model.user import User
from model.profile import BodyInformation, BodyHistory
from service.auth import create_access_token, get_current_user
from schema.profile import EmailCheckRequest, PasswordVerifyRequest, UpdateUserInfoRequest, UpdateUserPasswordRequest, BodyInformationRequest, BodyInformationResponse, BodyHistoryResponse
from schema.user import UserInDB
from datetime import datetime
from pytz import timezone
from typing import List

import os
from dotenv import load_dotenv
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from uuid import uuid4

ProfileRouter = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)

# 定義台北時區
taipei_tz = timezone("Asia/Taipei")

def get_taipei_time():
    return datetime.now(taipei_tz)

load_dotenv()

# 初始化 S3 服務
s3 = boto3.client(
    "s3",
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
)
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
CLOUDFRONT_DOMAIN = os.getenv("CLOUDFRONT_DOMAIN")

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

# 上傳使用者頭像到 AWS S3
@ProfileRouter.post("/upload-avatar")
async def upload_avatar(image: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # 獲取當前使用者的舊頭像 URL
        old_profile_image_url = current_user.profile_image_url
        
        # 上傳新頭像
        file_extension = os.path.splitext(image.filename)[1]      
        unique_filename = f"{uuid4()}{file_extension}"
        s3_key = f"profile_images/{current_user.id}/{unique_filename}"

        # 將頭像上傳至 S3
        s3.upload_fileobj(image.file, BUCKET_NAME, s3_key,)

        # 生成 CloudFront URL
        profile_image_url = f"{CLOUDFRONT_DOMAIN}/{s3_key}"

        # 更新用戶資料中的頭像 URL
        current_user.profile_image_url = profile_image_url
        db.add(current_user)
        db.commit()
        
        # 刪除舊頭像
        if old_profile_image_url:
            # 提取 S3 key
            old_s3_key = old_profile_image_url.split(f"{CLOUDFRONT_DOMAIN}/")[-1]
            s3.delete_object(Bucket=BUCKET_NAME, Key=old_s3_key)

        return {"status": "ok", "profile_image_url": profile_image_url}
    
    except (NoCredentialsError, PartialCredentialsError) as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload image")

@ProfileRouter.delete("/delete-avatar")
async def delete_avatar(current_user: UserInDB = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # 獲取當前使用者的頭像 URL
        profile_image_url = current_user.profile_image_url

        # 刪除 S3 中的頭像 URL
        if profile_image_url:
            # 提取 S3 key
            s3_key = profile_image_url.split(f"{CLOUDFRONT_DOMAIN}/")[-1]
            s3.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
            
            # 清空資料庫中的 profile_image_url
            current_user.profile_image_url = None
            db.add(current_user)
            db.commit()

            return {"status": "ok", "message": "Avatar deleted successfully"}
        else:
            return {"status": "ok", "message": "No avatar to delete"}
    
    except (NoCredentialsError, PartialCredentialsError) as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete image")
    
# 儲存 Body Information 到 DB
@ProfileRouter.post("/upload-bodyinfo")
async def upload_body_info(body_info: BodyInformationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    body_information = db.query(BodyInformation).filter_by(user_id=current_user.id).first()
    
    if not body_information:
        body_information = BodyInformation(
            user_id=current_user.id,
            gender=body_info.gender,
            height=body_info.height,
            weight=body_info.weight,
            age=body_info.age,
            neck_circumference=body_info.neck_circumference,
            waist_circumference=body_info.waist_circumference,
            hip_circumference=body_info.hip_circumference,
            activity_level=body_info.activity_level,
            bmi=body_info.bmi,
            pbf=body_info.pbf,
            bmr=body_info.bmr,
            tdee=body_info.tdee
        )
        db.add(body_information)
    else:
        body_information.height = body_info.height
        body_information.weight = body_info.weight
        body_information.age = body_info.age
        body_information.neck_circumference = body_info.neck_circumference
        body_information.waist_circumference = body_info.waist_circumference
        body_information.hip_circumference = body_info.hip_circumference
        body_information.activity_level = body_info.activity_level
        body_information.bmi = body_info.bmi
        body_information.pbf = body_info.pbf
        body_information.bmr = body_info.bmr
        body_information.tdee = body_info.tdee
    
    body_information.bmi = body_information.calculate_bmi()
    body_information.pbf = body_information.calculate_pbf()
    body_information.bmr = body_information.calculate_bmr()
    body_information.tdee = body_information.calculate_tdee()

    db.commit()
    
    body_history = BodyHistory(
        user_id=current_user.id,
        weight=body_information.weight,
        pbf=body_information.pbf,
        recorded_at=datetime.now(taipei_tz)
    )
    db.add(body_history)
    db.commit()
    
    return {"status": "success", "message": "Body information uploaded successfully"}

# 提取 Body Information
@ProfileRouter.get("/bodyinfo", response_model=BodyInformationResponse)
async def get_body_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    body_information = db.query(BodyInformation).filter_by(user_id=current_user.id).first()

    if not body_information:
        return BodyInformationResponse()

    return BodyInformationResponse(
        gender=body_information.gender,
        height=body_information.height,
        weight=body_information.weight,
        age=body_information.age,
        neck_circumference=body_information.neck_circumference,
        waist_circumference=body_information.waist_circumference,
        hip_circumference=body_information.hip_circumference,
        activity_level=body_information.activity_level,
        bmi=body_information.bmi,
        pbf=body_information.pbf,
        bmr=body_information.bmr,
        tdee=body_information.tdee
    )

# 提取 Body History
@ProfileRouter.get("/bodyhistory", response_model=List[BodyHistoryResponse])
async def get_body_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    body_history_records = db.query(BodyHistory).filter_by(user_id=current_user.id).order_by(BodyHistory.recorded_at.asc()).all()

    body_history_response = [BodyHistoryResponse(
        weight=record.weight,
        pbf=record.pbf,
        recorded_at=record.recorded_at
    ) for record in body_history_records]

    return body_history_response