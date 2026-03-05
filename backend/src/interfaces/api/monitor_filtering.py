from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.infrastructure.database import get_db
from src.infrastructure.models import SuricataAlert
from typing import List
import socket
import subprocess
import re

router = APIRouter(prefix="/monitor", tags=["monitoring"])


def _get_own_ips() -> set:
    """
    Dynamically detect all IP addresses assigned to THIS machine's interfaces.
    Works on any Linux host regardless of IP — no hardcoding needed.
    Cached at module level (runs once per process startup).
    """
    if _get_own_ips._cache is not None:
        return _get_own_ips._cache

    own_ips = set(["127.0.0.1", "::1"])

    # Method 1: Parse `ip addr show` — most reliable on Linux
    try:
        result = subprocess.run(
            ["ip", "addr", "show"],
            capture_output=True, text=True, timeout=3
        )
        for match in re.finditer(r"inet (\d+\.\d+\.\d+\.\d+)", result.stdout):
            own_ips.add(match.group(1))
    except Exception:
        pass

    # Method 2: Socket trick fallback (gets at least the primary outbound IP)
    if len(own_ips) <= 2:  # Only loopback detected above
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            own_ips.add(s.getsockname()[0])
            s.close()
        except Exception:
            pass

    _get_own_ips._cache = own_ips
    return own_ips

_get_own_ips._cache = None  # Module-level cache

# Known false positive patterns to filter out
FALSE_POSITIVE_PATTERNS = [
    "ET HUNTING Telegram API",  # Telegram usage is not an attack
    "ET HUNTING Observed Telegram",
    "ET INFO External IP Lookup",  # Our own geolocation lookups
    "testmynids.org",  # Test traffic
    "testmyids.com",
]

# Known testing IPs to filter out
TEST_IPS = [
    "3.175.196.35",   # testmynids.org
    "3.175.196.66",
    "3.175.196.11", 
    "3.175.196.125",
    "testmynids.org",
]

def is_likely_false_positive(alert: SuricataAlert) -> bool:
    """
    Determine if an alert is likely a false positive
    """
    # Check signature against known benign patterns
    signature_lower = alert.signature.lower() if alert.signature else ""
    
    for pattern in FALSE_POSITIVE_PATTERNS:
        if pattern.lower() in signature_lower:
            return True
    
    # Check if source IP is a known test site
    if alert.src_ip in TEST_IPS:
        return True
    
    # Suppress alerts where THIS MACHINE is the source — that's self-generated noise.
    # Attacks FROM other machines (even on the same LAN) are real threats.
    if alert.src_ip and alert.src_ip in _get_own_ips():
        return True

    return False


@router.get("/alerts/filtered")
async def get_filtered_alerts(
    limit: int = 100,
    hide_false_positives: bool = True,
    min_severity: int = None,
    db: Session = Depends(get_db)
):
    """
    Get alerts with smart filtering to hide noise
    """
    query = db.query(SuricataAlert)
    
    # Apply severity filter
    if min_severity:
        query = query.filter(SuricataAlert.severity <= min_severity)
    
    alerts = query.order_by(SuricataAlert.timestamp.desc()).limit(limit * 3).all()  # Get extra to allow filtering
    
    # Filter out false positives
    if hide_false_positives:
        filtered_alerts = [a for a in alerts if not is_likely_false_positive(a)]
    else:
        filtered_alerts = alerts
    
    # Return limited results
    filtered_alerts = filtered_alerts[:limit]
    
    return [{
        "id": a.id,
        "timestamp": a.timestamp,
        "src_ip": a.src_ip,
        "src_port": a.src_port,
        "dest_ip": a.dest_ip,
        "dest_port": a.dest_port,
        "protocol": a.protocol,
        "severity": a.severity,
        "signature": a.signature,
        "category": a.category,
        "action": a.action,
        "status": a.status,
        "is_likely_false_positive": is_likely_false_positive(a)
    } for a in filtered_alerts]


@router.get("/stats/true_threats")
async def get_true_threat_stats(db: Session = Depends(get_db)):
    """
    Get statistics for actual threats (excluding false positives)
    """
    all_alerts = db.query(SuricataAlert).all()
    
    true_threats = [a for a in all_alerts if not is_likely_false_positive(a)]
    false_positives = [a for a in all_alerts if is_likely_false_positive(a)]
    
    return {
        "total_alerts": len(all_alerts),
        "true_threats": len(true_threats),
        "false_positives": len(false_positives),
        "noise_ratio": f"{(len(false_positives) / len(all_alerts) * 100):.1f}%"
    }
