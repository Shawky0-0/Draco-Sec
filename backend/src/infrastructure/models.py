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

class SuricataAlert(Base):
    __tablename__ = "suricata_alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    
    # Network Info
    src_ip = Column(String)
    src_port = Column(Integer, nullable=True)
    dest_ip = Column(String)
    dest_port = Column(Integer, nullable=True)
    protocol = Column(String)
    
    # Alert Info
    severity = Column(Integer)  # 1 (High) to 4 (Low)
    signature = Column(String)  # The alert message
    category = Column(String)
    
    # Investigation
    action = Column(String)     # "allowed" / "blocked"
    status = Column(String, default="new")  # "new", "investigating", "resolved", "false_positive"
    
    # Evidence
    payload_printable = Column(String, nullable=True)
    raw_event = Column(String)  # Full JSON
    
    # Threat Intelligence (JSON stored as string)
    threat_intel = Column(String, nullable=True)  # IP reputation, geolocation, etc
    mitre_techniques = Column(String, nullable=True)  # JSON array of MITRE ATT&CK techniques
    related_alert_ids = Column(String, nullable=True)  # Comma-separated IDs
    analyst_notes = Column(String, nullable=True)
    enriched_at = Column(DateTime, nullable=True)  # When enrichment was added

class BlockedIP(Base):
    __tablename__ = "blocked_ips"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    reason = Column(String)
    blocked_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Integer, default=1)  # 1 for active, 0 for inactive (history)
    unblocked_at = Column(DateTime, nullable=True)# Offensive Security Models

class OffensiveScan(Base):
    """Stores DracoSec penetration testing scans."""
    __tablename__ = "offensive_scans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # FK to users table
    target = Column(String)  # URL, IP, domain, etc.
    methodology = Column(String)  # "Blackbox", "Whitebox", "Web Application", etc.
    scope = Column(String)  # Detailed instructions for Strix
    status = Column(String, default="pending")  # pending, running, completed, failed, stopped
    
    # Strix process info
    strix_run_name = Column(String, nullable=True)  # Strix run directory name
    process_id = Column(Integer, nullable=True)  # OS process ID
    
    # Results summary
    vulnerabilities_found = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ScanMethodology(Base):
    """Custom penetration testing methodologies created by users."""
    __tablename__ = "scan_methodologies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # FK to users table
    title = Column(String)
    description = Column(String)
    is_default = Column(Integer, default=0)  # 1 for system defaults, 0 for custom
    created_at = Column(DateTime, default=datetime.utcnow)

class Vulnerability(Base):
    """Vulnerabilities discovered by DracoSec scans."""
    __tablename__ = "vulnerabilities"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, index=True)  # FK to offensive_scans table
    title = Column(String)
    content = Column(String)  # Full vulnerability report (markdown)
    severity = Column(String)  # critical, high, medium, low, info
    vulnerability_type = Column(String)  # XSS, SQLi, IDOR, etc.
    
    # Proof of concept
    poc = Column(String, nullable=True)  # Steps to reproduce
    
    found_at = Column(DateTime, default=datetime.utcnow)

class AgentEvent(Base):
    """Real-time events from DracoSec agent execution."""
    __tablename__ = "agent_events"
    
    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, index=True)  # FK to offensive_scans table
    agent_id = Column(String)  # Strix agent identifier
    event_type = Column(String)  # "chat", "tool", "vulnerability", "status"
    content = Column(String)  # Event data (JSON or text)
    timestamp = Column(DateTime, default=datetime.utcnow)



