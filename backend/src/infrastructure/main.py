from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..interfaces.api.auth_routes import router as auth_router
from ..interfaces.api.phishing_routes import router as phishing_router
from ..interfaces.api.scans_routes import router as scans_router
from ..interfaces.api.ai_routes import router as ai_router
from .database import engine, Base
from . import models # Ensure models are registered

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dracosec API", version="1.0.0")

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

@app.get("/")
async def root():
    return {"message": "Welcome to Dracosec API - Clean Architecture Edition"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
