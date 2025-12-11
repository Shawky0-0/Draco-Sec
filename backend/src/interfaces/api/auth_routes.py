from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ...infrastructure.database import get_db
from ...use_cases.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()

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
async def read_users_me():
    return {"message": "Auth endpoint active"}
