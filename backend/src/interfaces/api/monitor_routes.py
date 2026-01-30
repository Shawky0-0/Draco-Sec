from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.infrastructure.database import get_db
from src.infrastructure.models import SuricataAlert
from src.infrastructure.threat_intel_service import threat_intel_service
from src.infrastructure.mitre_mapper import mitre_mapper
from typing import List, Dict, Optional
from pydantic import BaseModel
from sqlalchemy import func, text
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/monitor", tags=["monitoring"])

# ======= Response Models =======

class AlertEnrichment(BaseModel):
    source: Optional[Dict]
    destination: Optional[Dict]
    mitre_techniques: List[Dict]
    kill_chain_phase: Optional[str]
    enriched_at: str

class EnrichedAlertResponse(BaseModel):
    # Basic alert data
    id: int
    timestamp: datetime
    src_ip: str
    src_port: Optional[int]
    dest_ip: str
    dest_port: int
    protocol: str
    severity: int
    signature: str
    category: str
    action: str
    status: str
    
    # Evidence
    payload_printable: Optional[str]
    raw_event: str
   
    # Enrichment data
    enrichment: Optional[AlertEnrichment]
    analyst_notes: Optional[str]
    related_alerts: List[int]

    class Config:
        from_attributes = True


# ======= Helper Functions =======

def enrich_alert_db(alert: SuricataAlert, db: Session) -> SuricataAlert:
    """
    Enrich an alert with threat intelligence and MITRE mapping
    Updates the database record
    """
    # Skip if already enriched recently (within last hour)
    if alert.enriched_at and alert.enriched_at > datetime.utcnow() - timedelta(hours=1):
        return alert
    
    # Get threat intelligence
    enrichment_data = threat_intel_service.enrich_alert({
        'src_ip': alert.src_ip,
        'dest_ip': alert.dest_ip
    })
    
    # Get MITRE mapping
    mitre_techniques = mitre_mapper.map_signature(alert.signature)
    
    # Store as JSON strings
    alert.threat_intel = json.dumps(enrichment_data)
    alert.mitre_techniques = json.dumps(mitre_techniques)
    alert.enriched_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    
    return alert


def format_enriched_alert(alert: SuricataAlert) -> Dict:
    """Format alert with enrichment data for API response"""
    # Parse stored JSON
    enrichment = json.loads(alert.threat_intel) if alert.threat_intel else {"source": None, "destination": None}
    mitre_techniques = json.loads(alert.mitre_techniques) if alert.mitre_techniques else []
    related_ids = [int(x) for x in alert.related_alert_ids.split(',')] if alert.related_alert_ids else []
    
    return {
        "id": alert.id,
        "timestamp": alert.timestamp,
        "src_ip": alert.src_ip,
        "src_port": alert.src_port,
        "dest_ip": alert.dest_ip,
        "dest_port": alert.dest_port,
        "protocol": alert.protocol,
        "severity": alert.severity,
        "signature": alert.signature,
        "category": alert.category,
        "action": alert.action,
        "status": alert.status,
        "payload_printable": alert.payload_printable,
        "raw_event": alert.raw_event,
        "enrichment": {
            "source": enrichment.get("source"),
            "destination": enrichment.get("destination"),
            "mitre_techniques": mitre_techniques,
            "kill_chain_phase": mitre_mapper.get_kill_chain_phase(mitre_techniques),
            "enriched_at": alert.enriched_at.isoformat() if alert.enriched_at else None
        },
        "analyst_notes": alert.analyst_notes,
        "related_alerts": related_ids
    }


# ======= API Endpoints =======

@router.get("/alerts")
async def get_alerts(
    limit: int = 100,
    severity: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get alerts with optional filtering"""
    query = db.query(SuricataAlert)
    
    if severity:
        query = query.filter(SuricataAlert.severity == severity)
    if status:
        query = query.filter(SuricataAlert.status == status)
    
    alerts = query.order_by(SuricataAlert.timestamp.desc()).limit(limit * 2).all()
    
    # Filter out known false positives (Telegram, test sites, etc.)
    from .monitor_filtering import is_likely_false_positive
    filtered_alerts = [a for a in alerts if not is_likely_false_positive(a)]
    
    # Return basic alert data (no enrichment for list view)
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
        "status": a.status
    } for a in filtered_alerts[:limit]]


@router.get("/alerts/enriched/{alert_id}")
async def get_enriched_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get fully enriched alert with threat intelligence and MITRE mapping"""
    alert = db.query(SuricataAlert).filter(SuricataAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Enrich if needed
    alert = enrich_alert_db(alert, db)
    
    return format_enriched_alert(alert)


@router.get("/alerts/related/{alert_id}")
async def get_related_alerts(alert_id: int, db: Session = Depends(get_db)):
    """Find alerts related to this one (same src/dest IP, similar timeframe)"""
    alert = db.query(SuricataAlert).filter(SuricataAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Find alerts within 1 hour with same src or dest IP
    time_window_start = alert.timestamp - timedelta(hours=1)
    time_window_end = alert.timestamp + timedelta(hours=1)
    
    related = db.query(SuricataAlert).filter(
        SuricataAlert.id != alert_id,
        SuricataAlert.timestamp >= time_window_start,
        SuricataAlert.timestamp <= time_window_end,
        (SuricataAlert.src_ip == alert.src_ip) | (SuricataAlert.dest_ip == alert.dest_ip)
    ).limit(10).all()
    
    return [{
        "id": a.id,
        "timestamp": a.timestamp,
        "signature": a.signature,
        "src_ip": a.src_ip,
        "dest_ip": a.dest_ip,
        "severity": a.severity
    } for a in related]


@router.patch("/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: int,
    status: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update investigation status and add analyst notes"""
    alert = db.query(SuricataAlert).filter(SuricataAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = status
    if notes:
        alert.analyst_notes = notes
    
    db.commit()
    
    return {"success": True, "status": status}


@router.get("/statistics/timeline")
async def get_alert_timeline(hours: int = 24, db: Session = Depends(get_db)):
    """Get alert count by hour for timeline chart"""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    alerts = db.query(SuricataAlert).filter(
        SuricataAlert.timestamp >= cutoff
    ).all()
    
    # Filter false positives
    from .monitor_filtering import is_likely_false_positive
    alerts = [a for a in alerts if not is_likely_false_positive(a)]
    
    # Group by hour
    timeline = {}
    for alert in alerts:
        hour_key = alert.timestamp.strftime('%Y-%m-%d %H:00')
        if hour_key not in timeline:
            timeline[hour_key] = {"total": 0, "critical": 0, "high": 0}
        
        timeline[hour_key]["total"] += 1
        if alert.severity == 1:
            timeline[hour_key]["critical"] += 1
        elif alert.severity == 2:
            timeline[hour_key]["high"] += 1
    
    return sorted([{"time": k, **v} for k, v in timeline.items()], key=lambda x: x['time'])


@router.get("/statistics/top_attackers")
async def get_top_attackers(limit: int = 10, db: Session = Depends(get_db)):
    """Get top source IPs by alert count"""
    from sqlalchemy import func
    
    # Filter out known false positive signatures at DB level to keep stats clean
    results = db.query(
        SuricataAlert.src_ip,
        func.count(SuricataAlert.id).label('count')
    ).filter(
        ~SuricataAlert.signature.ilike('%Telegram%'),
        ~SuricataAlert.signature.ilike('%External IP Lookup%')
    ).group_by(SuricataAlert.src_ip).order_by(func.count(SuricataAlert.id).desc()).limit(limit).all()
    
    return [{"ip": ip, "count": count} for ip, count in results]


@router.get("/statistics/mitre")
async def get_mitre_stats(db: Session = Depends(get_db)):
    """Get MITRE ATT&CK technique distribution"""
    alerts = db.query(SuricataAlert).filter(SuricataAlert.mitre_techniques.isnot(None)).all()
    
    technique_counts = {}
    for alert in alerts:
        if alert.mitre_techniques:
            techniques = json.loads(alert.mitre_techniques)
            for tech in techniques:
                tech_id = tech.get('technique_id')
                if tech_id:
                    if tech_id not in technique_counts:
                        technique_counts[tech_id] = {
                            "technique_id": tech_id,
                            "technique_name": tech.get('technique_name'),
                            "tactic": tech.get('tactic'),
                            "count": 0
                        }
                    technique_counts[tech_id]["count"] += 1
    
    return sorted(list(technique_counts.values()), key=lambda x: x['count'], reverse=True)[:20]

@router.get("/stats")
async def get_monitor_stats(db: Session = Depends(get_db)):
    """
    Aggegated statistics for the monitoring dashboard
    """
    try:
        # 1. Severity Counts
        severity_counts = {
            "critical": db.query(SuricataAlert).filter(SuricataAlert.severity == 1).count(),
            "high": db.query(SuricataAlert).filter(SuricataAlert.severity == 2).count(),
            "medium": db.query(SuricataAlert).filter(SuricataAlert.severity == 3).count(),
            "low": db.query(SuricataAlert).filter(SuricataAlert.severity == 4).count(),
        }
        
        # 2. Top Attackers (Source IPs)
        top_ips_query = db.query(SuricataAlert.src_ip, func.count(SuricataAlert.id).label('count'))\
            .group_by(SuricataAlert.src_ip)\
            .order_by(text('count DESC'))\
            .limit(10).all()
            
        top_attackers = [{"ip": ip, "count": count} for ip, count in top_ips_query]
        
        # 3. Protocol Distribution
        proto_query = db.query(SuricataAlert.protocol, func.count(SuricataAlert.id).label('count'))\
            .group_by(SuricataAlert.protocol)\
            .all()
        
        protocol_stats = [{"protocol": p, "count": c} for p, c in proto_query if p]

        # 4. Alert Timeline (Last 24h)
        last_24h = datetime.utcnow() - timedelta(hours=24)
        timeline_query = db.query(
            func.strftime('%Y-%m-%d %H:00:00', SuricataAlert.timestamp).label('hour'),
            func.count(SuricataAlert.id)
        ).filter(SuricataAlert.timestamp >= last_24h)\
        .group_by('hour')\
        .order_by('hour').all()
        
        timeline = [{"time": t, "count": c} for t, c in timeline_query]
        
        # 5. MITRE Techniques
        mitre_query = db.query(SuricataAlert.category, func.count(SuricataAlert.id).label('count'))\
            .group_by(SuricataAlert.category)\
            .order_by(text('count DESC'))\
            .limit(10).all()
            
        mitre_stats = [{"technique": cat, "count": count} for cat, count in mitre_query if cat]

        return {
            "severity_counts": severity_counts,
            "top_attackers": top_attackers,
            "protocol_stats": protocol_stats,
            "timeline": timeline,
            "mitre_stats": mitre_stats
        }

    except Exception as e:
        print(f"Error generating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


