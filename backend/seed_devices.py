from sqlalchemy.orm import Session
from src.infrastructure.database import SessionLocal, engine, Base
from src.infrastructure.models import NetworkDevice

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Mock data
    devices = [
        {"ip": "192.168.1.1", "mac": "00:1A:2B:3C:4D:5E", "vendor": "Netgear"},
        {"ip": "192.168.1.5", "mac": "A1:B2:C3:D4:E5:F6", "vendor": "Apple Inc."},
    ]
    for d in devices:
        if not db.query(NetworkDevice).filter_by(ip_address=d['ip']).first():
            db.add(NetworkDevice(ip_address=d['ip'], mac_address=d['mac'], vendor=d['vendor']))
    db.commit()
    print("Seeded devices.")

if __name__ == "__main__":
    seed()
