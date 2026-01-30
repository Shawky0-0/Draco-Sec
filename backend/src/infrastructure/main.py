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

# Startup event - Start Suricata Log Watcher
@app.on_event("startup")
async def startup_event():
    monitor_service.start_watcher()

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
