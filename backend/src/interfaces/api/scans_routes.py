from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ...use_cases.scans_service import ScansService
from ...infrastructure.database import get_db
# from ...interfaces.api.auth_routes import get_current_user  # Temporarily disabled
from ...infrastructure.models import User as UserModel
from pydantic import BaseModel
import hashlib

router = APIRouter(prefix="/scans", tags=["scans"])

class URLScanRequest(BaseModel):
    url: str

class SaveScanRequest(BaseModel):
    scan_type: str
    target: str
    result: dict
    target_hash: Optional[str] = None
    analysis_id: Optional[str] = None

@router.post("/url")
def scan_url(
    request: URLScanRequest, 
    db: Session = Depends(get_db)
):
    """Scan a URL using VirusTotal API with DB caching."""
    try:
        service = ScansService(db=db, user_id=1)  # Temporary hardcoded user
        result = service.scan_url(request.url)
        
        # If result is complete (cached or immediate), save to DB
        if result.get('from_cache') or result.get('data', {}).get('attributes', {}).get('status') == 'completed':
            try:
                url_hash = hashlib.sha256(request.url.encode()).hexdigest()
                attrs = result.get('data', {}).get('attributes', {})
                if attrs:
                    service._save_scan_to_db('url', request.url, url_hash, attrs)
            except Exception as save_error:
                print(f"[WARN] Failed to save to DB: {save_error}")
        
        return result
    except Exception as e:
        print(f"[ERROR] scan_url failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/file")
async def scan_file(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """Scan a file using VirusTotal API with DB caching."""
    try:
        service = ScansService(db=db, user_id=1)
        result = await service.scan_file(file)
        return result
    except Exception as e:
        print(f"[ERROR] scan_file failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/analyses/{analysis_id}")
def get_analysis(
    analysis_id: str, 
    db: Session = Depends(get_db)
):
    """Get analysis results."""
    try:
        service = ScansService(db=db, user_id=1) # Temporary hardcoded user
        result = service.get_analysis_result(analysis_id)
        return result
    except Exception as e:
        print(f"[ERROR] get_analysis failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save")
def save_scan(
    request: SaveScanRequest, 
    db: Session = Depends(get_db)
):
    """Save completed scan to database."""
    try:
        service = ScansService(db=db, user_id=1)
        
        # Calculate hash if not provided
        target_hash = request.target_hash
        if not target_hash and request.target:
            target_hash = hashlib.sha256(request.target.encode()).hexdigest()
            
        service._save_scan_to_db(
            scan_type=request.scan_type,
            target=request.target,
            target_hash=target_hash,
            result=request.result
        )
        print(f"[INFO] Saved scan to DB: {request.scan_type} {request.target}")
        return {"success": True}
    except Exception as e:
        print(f"[ERROR] save_scan failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_scan_history(
    limit: int = 50, 
    db: Session = Depends(get_db)
):
    """Get scan history."""
    try:
        service = ScansService(db=db, user_id=1)
        history = service.get_scan_history(limit)
        return [
            {
                "id": scan.id,
                "scan_type": scan.scan_type,
                "target": scan.target,
                "status": scan.status,
                "stats": {
                    "malicious": scan.malicious_count,
                    "suspicious": scan.suspicious_count,
                    "harmless": scan.harmless_count,
                    "undetected": scan.undetected_count
                },
                "created_at": scan.created_at.isoformat(),
                "is_threat": scan.is_threat
            }
            for scan in history
        ]
    except Exception as e:
        print(f"[ERROR] get_scan_history failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stats")
def get_scan_stats(
    db: Session = Depends(get_db)
):
    """Get scan statistics."""
    try:
        service = ScansService(db=db, user_id=1)
        return service.get_scan_stats()
    except Exception as e:
        print(f"[ERROR] get_scan_stats failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
