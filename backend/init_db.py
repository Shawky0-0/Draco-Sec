#!/usr/bin/env python3
"""
Database initialization script for DracoSec
Ensures all required tables exist and creates default data
"""
from src.infrastructure.database import engine, Base
from src.infrastructure.models import User, License, ScanMethodology, OffensiveScan, Vulnerability, AgentEvent
from sqlalchemy.orm import Session
from datetime import datetime

def init_database():
    """Initialize database with all required tables and default data"""
    print("🔧 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully")
    
    # Add default methodologies if they don't exist
    with Session(engine) as session:
        existing_methodologies = session.query(ScanMethodology).filter(ScanMethodology.is_default == 1).count()
        
        if existing_methodologies == 0:
            print("📝 Adding default methodologies...")
            
            default_methodologies = [
                ScanMethodology(
                    user_id=None,
                    title="OWASP Top 10",
                    description="Comprehensive testing based on OWASP Top 10 vulnerabilities including injection flaws, broken authentication, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, vulnerable components, and insufficient logging.",
                    is_default=1,
                    created_at=datetime.utcnow()
                ),
                ScanMethodology(
                    user_id=None,
                    title="Web Application Pentest",
                    description="Full-scope web application security assessment covering authentication, authorization, session management, input validation, business logic, API security, and client-side vulnerabilities.",
                    is_default=1,
                    created_at=datetime.utcnow()
                ),
                ScanMethodology(
                    user_id=None,
                    title="API Security Testing",
                    description="Specialized testing for REST/GraphQL APIs including authentication bypass, authorization flaws, injection attacks, rate limiting, data exposure, and API-specific vulnerabilities.",
                    is_default=1,
                    created_at=datetime.utcnow()
                ),
            ]
            
            session.add_all(default_methodologies)
            session.commit()
            print(f"✅ Added {len(default_methodologies)} default methodologies")
        else:
            print(f"ℹ️  {existing_methodologies} default methodologies already exist")
    
    print("🎉 Database initialization complete!")

if __name__ == "__main__":
    init_database()
