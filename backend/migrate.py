"""
Database migration script to create scans table.
Run this once to set up the database schema.
"""
from src.infrastructure.database import engine, Base
from src.infrastructure.models import User, License, ScanRecord

def migrate():
    """Create all tables defined in models."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print("Tables: users, licenses, scans")

if __name__ == "__main__":
    migrate()
