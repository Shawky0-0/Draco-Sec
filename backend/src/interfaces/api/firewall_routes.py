
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from ...infrastructure.database import get_db
from ...infrastructure.models import BlockedIP
from ...use_cases.firewall_service import firewall_service

router = APIRouter(prefix="/monitor", tags=["monitoring"])
logger = logging.getLogger(__name__)

class BlockIPRequest(BaseModel):
    ip_address: str
    reason: str = "Malicious activity detected"

@router.post("/block-ip")
async def block_ip(request: BlockIPRequest, db: Session = Depends(get_db)):
    """
    Block an IP address using iptables firewall and persist to DB
    """
    try:
        ip = request.ip_address
        
        # Validate IP format
        if not all(0 <= int(part) <= 255 for part in ip.split('.')):
            raise HTTPException(status_code=400, detail="Invalid IP address format")
        
        success = firewall_service.block_ip(ip, reason=request.reason)
        
        if not success:
             # If service returns false, likely already blocked or failed silently (but we'd catch exception for failure)
             # Actually service returns False if already blocked.
             return {
                "success": True, 
                "message": f"IP {ip} is already blocked or handled",
                "ip": ip
            }
        
        return {
            "success": True,
            "message": f"IP {ip} has been blocked",
            "ip": ip,
            "reason": request.reason
        }
        
    except Exception as e:
        logger.error(f"Error blocking IP {ip}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/unblock-ip")
async def unblock_ip(request: BlockIPRequest, db: Session = Depends(get_db)):
    """
    Unblock a previously blocked IP address
    """
    try:
        ip = request.ip_address
        
        firewall_service.unblock_ip(ip)
        
        return {
            "success": True,
            "message": f"IP {ip} has been unblocked",
            "ip": ip
        }
        
    except Exception as e:
        logger.error(f"Error unblocking IP {ip}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/blocked-ips")
async def get_blocked_ips(db: Session = Depends(get_db)):
    """
    Get list of currently blocked IPs from Database
    """
    try:
        # Fetch active blocks from DB
        blocked_records = db.query(BlockedIP).filter(BlockedIP.active == 1).order_by(BlockedIP.blocked_at.desc()).all()
        
        blocked_ips = []
        for record in blocked_records:
            blocked_ips.append({
                "ip": record.ip_address,
                "reason": record.reason,
                "blocked_at": record.blocked_at.isoformat() if record.blocked_at else None,
                "source": "Manual Block" # Ideally differentiate between Manual and Active Response in reason?
            })
        
        return {
            "success": True,
            "blocked_ips": blocked_ips,
            "count": len(blocked_ips)
        }
        
    except Exception as e:
        logger.error(f"Error getting blocked IPs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
