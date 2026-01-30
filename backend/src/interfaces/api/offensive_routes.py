"""
Offensive Security API Routes for DracoSec

Endpoints for managing penetration testing scans, vulnerabilities,
methodologies, and real-time agent feed.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from jose import jwt, JWTError

from ...infrastructure.database import get_db
from ...infrastructure.models import (
    User, OffensiveScan, Vulnerability, AgentEvent, ScanMethodology
)
from ...use_cases.strix_service import strix_service

router = APIRouter(prefix="/api/offensive", tags=["offensive"])

# JWT Secret (should match your auth_service.py)
SECRET_KEY = "dracosec-super-secret-key-change-in-prod"
ALGORITHM = "HS256"

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
    # Check query param (for SSE)
    elif request.query_params.get("token"):
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Debugging: Print token and secret
        # print(f"DEBUG: Token: {token[:10]}...") 
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Changed from user_id to id to match AuthService token structure
        user_id_str: str = payload.get("id")
        
        if user_id_str is None:
            # print("DEBUG Auth: id not found in payload which contains keys:", payload.keys())
            raise HTTPException(status_code=401, detail="Invalid token: missing id")
            
        user_id = int(str(user_id_str)) # Handle case where it might be int already
    except JWTError as e:
        # print(f"DEBUG Auth: JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except (ValueError, TypeError) as e:
        # print(f"DEBUG Auth: Value/Type Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token format")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # print(f"DEBUG Auth: User {user_id} not found in DB")
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


# ===== Pydantic Models =====

class ScanCreate(BaseModel):
    target: str
    methodology: str
    scope: str

class ScanResponse(BaseModel):
    id: int
    target: str
    methodology: str
    scope: str
    status: str
    vulnerabilities_found: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class VulnerabilityResponse(BaseModel):
    id: int
    scan_id: int
    title: str
    content: str
    severity: str
    vulnerability_type: str
    poc: Optional[str]
    found_at: datetime

    class Config:
        from_attributes = True

class MethodologyCreate(BaseModel):
    title: str
    description: str

class MethodologyResponse(BaseModel):
    id: int
    title: str
    description: str
    is_default: int
    created_at: datetime

    class Config:
        from_attributes = True


# ===== Scan Endpoints =====

@router.post("/scans", response_model=dict)
async def create_scan(
    scan_data: ScanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create and start a new offensive security scan."""
    
    # Check license tier (offensive security requires Pro/Enterprise)
    if current_user.plan_tier not in ["Pro", "Enterprise"]:
        raise HTTPException(
            status_code=403,
            detail="Offensive Security requires Pro or Enterprise license"
        )
    
    # Create scan record
    scan = OffensiveScan(
        user_id=current_user.id,
        target=scan_data.target,
        methodology=scan_data.methodology,
        scope=scan_data.scope,
        status="pending"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Start Strix scan
    result = await strix_service.start_scan(
        scan_id=scan.id,
        target=scan_data.target,
        methodology=scan_data.methodology,
        scope=scan_data.scope,
        db=db
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return {
        "success": True,
        "scan_id": scan.id,
        "message": "Scan started successfully"
    }


@router.get("/scans", response_model=List[ScanResponse])
def list_scans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all scans for the current user."""
    scans = db.query(OffensiveScan).filter(
        OffensiveScan.user_id == current_user.id
    ).order_by(OffensiveScan.created_at.desc()).all()
    
    return scans


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific scan."""
    scan = db.query(OffensiveScan).filter(
        OffensiveScan.id == scan_id,
        OffensiveScan.user_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return scan


@router.delete("/scans/{scan_id}")
async def stop_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stop a running scan."""
    scan = db.query(OffensiveScan).filter(
        OffensiveScan.id == scan_id,
        OffensiveScan.user_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    result = await strix_service.stop_scan(scan_id, db)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return {"message": "Scan stopped successfully"}


@router.get("/scans/{scan_id}/feed")
async def get_agent_feed(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream real-time agent events (Server-Sent Events)."""
    # Verify scan ownership
    scan = db.query(OffensiveScan).filter(
        OffensiveScan.id == scan_id,
        OffensiveScan.user_id == current_user.id
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Return SSE stream
    return StreamingResponse(
        strix_service.get_agent_feed_stream(scan_id, db),
        media_type="text/event-stream"
    )


# ===== Vulnerability Endpoints =====

@router.get("/vulnerabilities", response_model=List[VulnerabilityResponse])
def list_vulnerabilities(
    scan_id: Optional[int] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List vulnerabilities with optional filters."""
    # Get user's scans
    user_scan_ids = [s.id for s in db.query(OffensiveScan).filter(
        OffensiveScan.user_id == current_user.id
    ).all()]
    
    # Build query
    query = db.query(Vulnerability).filter(
        Vulnerability.scan_id.in_(user_scan_ids)
    )
    
    if scan_id:
        query = query.filter(Vulnerability.scan_id == scan_id)
    
    if severity:
        query = query.filter(Vulnerability.severity == severity.lower())
    
    vulnerabilities = query.order_by(Vulnerability.found_at.desc()).all()
    
    return vulnerabilities


@router.get("/vulnerabilities/{vuln_id}", response_model=VulnerabilityResponse)
def get_vulnerability(
    vuln_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific vulnerability."""
    # Get user's scans
    user_scan_ids = [s.id for s in db.query(OffensiveScan).filter(
        OffensiveScan.user_id == current_user.id
    ).all()]
    
    vulnerability = db.query(Vulnerability).filter(
        Vulnerability.id == vuln_id,
        Vulnerability.scan_id.in_(user_scan_ids)
    ).first()
    
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    return vulnerability


# ===== Methodology Endpoints =====

@router.post("/methodologies", response_model=MethodologyResponse)
def create_methodology(
    methodology_data: MethodologyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a custom testing methodology."""
    methodology = ScanMethodology(
        user_id=current_user.id,
        title=methodology_data.title,
        description=methodology_data.description,
        is_default=0
    )
    db.add(methodology)
    db.commit()
    db.refresh(methodology)
    
    return methodology


@router.get("/methodologies", response_model=List[MethodologyResponse])
def list_methodologies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all methodologies (user's custom + system defaults)."""
    methodologies = db.query(ScanMethodology).filter(
        (ScanMethodology.user_id == current_user.id) | 
        (ScanMethodology.is_default == 1)
    ).order_by(ScanMethodology.is_default.desc(), ScanMethodology.created_at.desc()).all()
    
    return methodologies


@router.delete("/methodologies/{methodology_id}")
def delete_methodology(
    methodology_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom testing methodology (only user's own methodologies)."""
    methodology = db.query(ScanMethodology).filter(
        ScanMethodology.id == methodology_id,
        ScanMethodology.user_id == current_user.id,
        ScanMethodology.is_default == 0  # Cannot delete system defaults
    ).first()
    
    if not methodology:
        raise HTTPException(
            status_code=404, 
            detail="Methodology not found or you don't have permission to delete it"
        )
    
    db.delete(methodology)
    db.commit()
    
    return {"message": "Methodology deleted successfully"}


# ===== Analytics Endpoint =====

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get analytics data for offensive dashboard."""
    # Get user's scans
    scans = db.query(OffensiveScan).filter(
        OffensiveScan.user_id == current_user.id
    ).all()
    
    total_scans = len(scans)
    total_vulns = sum(s.vulnerabilities_found for s in scans)
    total_critical = sum(s.critical_count for s in scans)
    total_high = sum(s.high_count for s in scans)
    total_medium = sum(s.medium_count for s in scans)
    total_low = sum(s.low_count for s in scans)
    
    # Vulnerability by type
    user_scan_ids = [s.id for s in scans]
    vulns = db.query(Vulnerability).filter(
        Vulnerability.scan_id.in_(user_scan_ids)
    ).all() if user_scan_ids else []
    
    vuln_by_type = {}
    for vuln in vulns:
        vuln_type = vuln.vulnerability_type
        vuln_by_type[vuln_type] = vuln_by_type.get(vuln_type, 0) + 1
    
    return {
        "total_scans": total_scans,
        "total_vulnerabilities": total_vulns,
        "by_severity": {
            "critical": total_critical,
            "high": total_high,
            "medium": total_medium,
            "low": total_low
        },
        "by_type": vuln_by_type,
        "recent_scans": [
            {
                "id": s.id,
                "target": s.target,
                "status": s.status,
                "vulnerabilities_found": s.vulnerabilities_found,
                "created_at": s.created_at.isoformat()
            }
            for s in sorted(scans, key=lambda x: x.created_at, reverse=True)[:5]
        ]
    }
