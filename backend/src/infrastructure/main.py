from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..interfaces.api.auth_routes import router as auth_router
from ..interfaces.api.phishing_routes import router as phishing_router
from ..interfaces.api.scans_routes import router as scans_router
from ..interfaces.api.ai_routes import router as ai_router
from ..interfaces.api.monitor_routes import router as monitor_router
from ..interfaces.api.firewall_routes import router as firewall_router
from ..interfaces.api.offensive_routes import router as offensive_router
from ..use_cases.monitor_service import monitor_service
from .database import engine, Base
from . import models # Ensure models are registered

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dracosec API", version="1.0.0")

DEFAULT_METHODOLOGIES = [
    ("Quick Scan", "Fast recon scan covering the most critical attack surfaces: open ports, common web vulnerabilities, and low-hanging fruit. Best for initial triage.", 1),
    ("Network Pentest", "Full network penetration test targeting TCP/UDP services, firewall analysis, SMB, SSH, FTP, databases, and internal network pivoting.", 1),
    ("Blackbox", "Black-box approach simulating an external attacker with zero prior knowledge. Recon → Enumeration → Exploitation → Post-exploitation phases.", 1),
    ("OWASP Top 10", "Covers OWASP Top 10: injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, vulnerable components, insufficient logging.", 1),
    ("Web Application Pentest", "Full-scope web app assessment: authentication, authorization, session management, input validation, business logic, API security, and client-side vulnerabilities.", 1),
    ("API Security Testing", "Specialized REST/GraphQL API testing: auth bypass, authorization flaws, injection, rate limiting, data exposure, and API-specific security issues.", 1),
]

def seed_methodologies():
    """Ensure all default methodologies exist in the DB on startup."""
    from .database import SessionLocal
    from .models import ScanMethodology
    db = SessionLocal()
    try:
        existing = {m.title for m in db.query(ScanMethodology).filter(ScanMethodology.is_default == 1).all()}
        for title, description, is_default in DEFAULT_METHODOLOGIES:
            if title not in existing:
                m = ScanMethodology(user_id=None, title=title, description=description, is_default=is_default)
                db.add(m)
        db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Methodology seeding failed: {e}")
    finally:
        db.close()

# Startup event - Start Suricata Log Watcher + seed default data
@app.on_event("startup")
async def startup_event():
    monitor_service.start_watcher()
    seed_methodologies()

# CORS setup for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(phishing_router)
app.include_router(scans_router)
app.include_router(ai_router)
app.include_router(monitor_router)
app.include_router(firewall_router)
app.include_router(offensive_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Dracosec API - Clean Architecture Edition"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
