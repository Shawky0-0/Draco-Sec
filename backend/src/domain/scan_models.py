from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

@dataclass
class Scan:
    """Core domain entity representing a security scan."""
    id: Optional[int]
    user_id: int
    scan_type: str  # 'url' or 'file'
    target: str  # URL or filename
    target_hash: str  # SHA256 hash for deduplication
    status: str  # 'completed', 'failed', 'pending'
    malicious_count: int
    suspicious_count: int
    harmless_count: int
    undetected_count: int
    raw_result: Optional[Dict[str, Any]]  # Full VirusTotal response
    created_at: datetime
    updated_at: datetime
    
    @property
    def is_threat(self) -> bool:
        """Returns True if malicious detections found."""
        return self.malicious_count > 0
    
    @property
    def total_scans(self) -> int:
        """Total number of security vendor scans."""
        return (self.malicious_count + self.suspicious_count + 
                self.harmless_count + self.undetected_count)
