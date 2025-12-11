from typing import Optional, List
from sqlalchemy.orm import Session
from ..models import ScanRecord
from ...domain.scan_models import Scan
from datetime import datetime
import json

class ScanRepository:
    """Repository for Scan data access following clean architecture."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def find_by_hash(self, target_hash: str) -> Optional[Scan]:
        """
        Find existing scan by target hash.
        Returns cached scan if found, None otherwise.
        """
        record = self.db.query(ScanRecord).filter(
            ScanRecord.target_hash == target_hash,
            ScanRecord.status == "completed"
        ).first()
        
        if not record:
            return None
        
        return self._to_domain(record)
    
    def save(self, scan: Scan) -> Scan:
        """Save or update a scan record."""
        # Check if exists by hash
        existing = self.db.query(ScanRecord).filter(
            ScanRecord.target_hash == scan.target_hash
        ).first()
        
        if existing:
            # Update existing
            existing.status = scan.status
            existing.malicious_count = scan.malicious_count
            existing.suspicious_count = scan.suspicious_count
            existing.harmless_count = scan.harmless_count
            existing.undetected_count = scan.undetected_count
            existing.raw_result = json.dumps(scan.raw_result) if scan.raw_result else None
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return self._to_domain(existing)
        else:
            # Create new
            record = ScanRecord(
                user_id=scan.user_id,
                scan_type=scan.scan_type,
                target=scan.target,
                target_hash=scan.target_hash,
                status=scan.status,
                malicious_count=scan.malicious_count,
                suspicious_count=scan.suspicious_count,
                harmless_count=scan.harmless_count,
                undetected_count=scan.undetected_count,
                raw_result=json.dumps(scan.raw_result) if scan.raw_result else None
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            scan.id = record.id
            return scan
    
    def find_by_user(self, user_id: int, limit: int = 50) -> List[Scan]:
        """Get scan history for a user."""
        records = self.db.query(ScanRecord).filter(
            ScanRecord.user_id == user_id
        ).order_by(ScanRecord.created_at.desc()).limit(limit).all()
        
        return [self._to_domain(r) for r in records]
    
    def get_stats(self, user_id: int) -> dict:
        """Get scan statistics for analytics."""
        total = self.db.query(ScanRecord).filter(
            ScanRecord.user_id == user_id
        ).count()
        
        threats = self.db.query(ScanRecord).filter(
            ScanRecord.user_id == user_id,
            ScanRecord.malicious_count > 0
        ).count()
        
        return {
            "total_scans": total,
            "threats_detected": threats,
            "clean_scans": total - threats
        }
    
    def _to_domain(self, record: ScanRecord) -> Scan:
        """Convert ORM model to domain entity."""
        return Scan(
            id=record.id,
            user_id=record.user_id,
            scan_type=record.scan_type,
            target=record.target,
            target_hash=record.target_hash,
            status=record.status,
            malicious_count=record.malicious_count,
            suspicious_count=record.suspicious_count,
            harmless_count=record.harmless_count,
            undetected_count=record.undetected_count,
            raw_result=json.loads(record.raw_result) if record.raw_result else None,
            created_at=record.created_at,
            updated_at=record.updated_at
        )
