from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class License:
    """Represents a product license."""
    key: str
    tier: str  # 'basic', 'pro', 'enterprise'
    expiration_date: datetime
    is_active: bool = True

@dataclass
class User:
    """Core domain entity representing a system user."""
    id: str
    username: str
    email: str
    password_hash: str
    first_name: str
    last_name: str
    plan_tier: str = "none"  # 'none', 'basic', 'pro', 'enterprise'
    scans_remaining: int = 0
    license_key: Optional[str] = None
    license_expiry: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
