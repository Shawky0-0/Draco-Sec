from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    
    # Licensing & Plans
    plan_tier = Column(String, default="Basic")
    scans_remaining = Column(Integer, default=5)
    license_key = Column(String, nullable=True)
    license_expiry = Column(DateTime, nullable=True) # Allows Trial users logic
    
    created_at = Column(DateTime, default=datetime.utcnow)

class License(Base):
    __tablename__ = "licenses"
    
    key = Column(String, primary_key=True, index=True)
    tier = Column(String)
    duration_days = Column(Integer, default=30)

class ScanRecord(Base):
    """Stores scan results for caching and analytics."""
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # FK to users table
    scan_type = Column(String)  # 'url' or 'file'
    target = Column(String)  # URL or filename
    target_hash = Column(String, index=True, unique=True)  # SHA256 for deduplication
    status = Column(String, default="completed")  # 'completed', 'failed', 'pending'
    
    # VirusTotal stats
    malicious_count = Column(Integer, default=0)
    suspicious_count = Column(Integer, default=0)
    harmless_count = Column(Integer, default=0)
    undetected_count = Column(Integer, default=0)
    
    # Full result (JSON stored as string)
    raw_result = Column(String, nullable=True)  # JSON text
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # FK to users table
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, index=True) # FK to conversations table
    role = Column(String) # 'user', 'assistant'
    content = Column(String) # SQLite Text
    created_at = Column(DateTime, default=datetime.utcnow)

