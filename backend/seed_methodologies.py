"""
Seed default methodologies for offensive security
"""
from sqlalchemy.orm import Session
from infrastructure.database import SessionLocal
from infrastructure.models import ScanMethodology

def seed_methodologies():
    """Add default testing methodologies."""
    db = SessionLocal()
    
    default_methodologies = [
        {
            "title": "Blackbox Testing",
            "description": "Test the application with no prior knowledge of its internals. Simulates an external attacker's perspective.",
            "is_default": 1,
            "user_id": 0  # System methodology
        },
        {
            "title": "Whitebox Testing",
            "description": "Test with full access to source code, architecture documentation, and internal details.",
            "is_default": 1,
            "user_id": 0
        },
        {
            "title": "Web Application",
            "description": "Specialized testing for web applications including OWASP Top 10 vulnerabilities.",
            "is_default": 1,
            "user_id": 0
        },
        {
            "title": "API Security",
            "description": "Focus on REST/GraphQL API security testing including authentication, authorization, and injection flaws.",
            "is_default": 1,
            "user_id": 0
        },
        {
            "title": "Network Penetration",
            "description": "Test network infrastructure, services, and protocols for vulnerabilities.",
            "is_default": 1,
            "user_id": 0
        },
        {
            "title": "Quick Scan",
            "description": "Fast vulnerability scan focusing on common issues. Ideal for CI/CD integration.",
            "is_default": 1,
            "user_id": 0
        },
    ]
    
    for methodology_data in default_methodologies:
        # Check if already exists
        existing = db.query(ScanMethodology).filter(
            ScanMethodology.title == methodology_data["title"],
            ScanMethodology.is_default == 1
        ).first()
        
        if not existing:
            methodology = ScanMethodology(**methodology_data)
            db.add(methodology)
    
    db.commit()
    db.close()
    print("✅ Default methodologies seeded successfully!")

if __name__ == "__main__":
    seed_methodologies()
