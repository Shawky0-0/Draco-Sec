import sys
import os

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from sqlalchemy.orm import Session
from src.infrastructure.database import SessionLocal, engine
from src.infrastructure.models import Base, User, License

def seed_db():
    db = SessionLocal()
    try:
        # Clear existing data
        print("Clearing database...")
        db.query(User).delete()
        db.query(License).delete()
        
        # Add Licenses
        print("Seeding licenses...")
        licenses = [
            License(key="BASIC-KEY-05", tier="Basic", duration_days=30),
            License(key="PRO-KEY-20", tier="Pro", duration_days=30),
            License(key="ENTERPRISE-KEY-999", tier="Enterprise", duration_days=30)
        ]
        
        db.add_all(licenses)
        db.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
