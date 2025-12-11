from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

@dataclass
class Agent:
    """Core domain entity representing a security agent."""
    id: str
    name: str
    status: str  # e.g., 'idle', 'running', 'completed'
    target: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    
@dataclass
class Vulnerability:
    """Core domain entity for a finding."""
    id: str
    scan_id: str
    title: str
    severity: str
    description: str
