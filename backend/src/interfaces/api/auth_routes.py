from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from ...infrastructure.database import get_db
from ...infrastructure.models import User
from ...use_cases.auth_service import AuthService
from ...infrastructure.security import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()

# Authentication dependency
async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token (Header or Query param)."""
    token = None
    
    # Check header first
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
    # Check query param (for SSE/Optional)
    elif request.query_params.get("token"):
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("id")
        
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing id")
            
        user_id = int(str(user_id_str))
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Pydantic Schemas for Request Body
class SignupRequest(BaseModel):
    username: str
    password: str
    email: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

class ActivateLicenseRequest(BaseModel):
    username: str
    license_key: str

@router.post("/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.signup(request.model_dump(), db)
        return {"message": "User created successfully", "user_id": user.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    token_data = auth_service.login(request.model_dump(), db)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return token_data

@router.post("/activate-license")
async def activate_license(request: ActivateLicenseRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.activate_license(request.username, request.license_key, db)
        
        from datetime import datetime
        days_left = 0
        if user.license_expiry:
             days_left = (user.license_expiry - datetime.utcnow()).days

        return {"message": "License activated", "tier": user.plan_tier, "scans": user.scans_remaining, "days_remaining": days_left}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    # Return full user details
    from datetime import datetime
    days_left = 0
    if current_user.license_expiry:
        days_left = (current_user.license_expiry - datetime.utcnow()).days

    return {
        "username": current_user.username,
        "name": f"{current_user.first_name} {current_user.last_name}",
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "tier": current_user.plan_tier, 
        "scans_remaining": current_user.scans_remaining,
        "days_remaining": days_left,
        "avatar": None 
    }

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@router.put("/me")
async def update_profile(
    data: ProfileUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        user = auth_service.update_profile(current_user.id, data.model_dump(exclude_unset=True), db)
        return {"message": "Profile updated", "user": {
            "name": f"{user.first_name} {user.last_name}",
            "email": user.email
        }}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/password")
async def change_password(
    data: PasswordChange, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    try:
        auth_service.change_password(current_user.id, data.old_password, data.new_password, db)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
