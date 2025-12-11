# Static License Definition removed in favor of DB
from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
from ..infrastructure.models import User, License
from ..infrastructure.security import get_password_hash, verify_password, create_access_token

class AuthService:
    def signup(self, user_data: dict, db: Session) -> User:
        # Check if user exists
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if existing_user:
            raise ValueError("Username already exists")
        
        hashed_pw = get_password_hash(user_data["password"])
        
        # Create User
        new_user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=hashed_pw,
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            plan_tier="Basic", # Default
            scans_remaining=5,
            license_expiry=datetime.utcnow() + timedelta(days=30) # Default 30 days trial
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Process License Key if provided
        if "license_key" in user_data and user_data["license_key"].strip():
            # Pass db session to activate_license
            try:
                self.activate_license(new_user.username, user_data["license_key"], db)
                db.refresh(new_user) 
            except ValueError as e:
                print(f"Warning: License activation failed during signup: {e}")
                # Continue signup even if license fails, user is created as Basic
                
        return new_user

    def login(self, credentials: dict, db: Session) -> Optional[dict]:
        user = db.query(User).filter(User.username == credentials["username"]).first()
        
        if not user or not verify_password(credentials["password"], user.password_hash):
            return None
        
        # Use str(user.id) because JWT expects string subject usually
        token = create_access_token({"sub": user.username, "id": str(user.id)})
        
        # Calculate days remaining
        days_left = 0
        if user.license_expiry:
             days_left = (user.license_expiry - datetime.utcnow()).days
             
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "username": user.username,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "tier": user.plan_tier, 
                "scans": user.scans_remaining,
                "days_remaining": days_left,
                "avatar": None 
            }
        }

    def activate_license(self, username: str, license_key: str, db: Session) -> User:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")
        
        normalized_key = license_key.strip().upper()
        
        # Query DB for license
        license_data = db.query(License).filter(License.key == normalized_key).first()
        
        if not license_data:
            raise ValueError("Invalid license key")
        
        # Apply Plan
        user.plan_tier = license_data.tier
        # Calculate expiration based on duration in DB
        user.license_expiry = datetime.utcnow() + timedelta(days=license_data.duration_days)
        user.license_key = license_data.key
        
        # Set limits
        if user.plan_tier == "Basic":
            user.scans_remaining = 5
        elif user.plan_tier == "Pro":
            user.scans_remaining = 20
        elif user.plan_tier == "Enterprise":
            user.scans_remaining = 30
            
        db.commit()
        db.refresh(user)
            
        return user
