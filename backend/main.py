import os
from dotenv import load_dotenv
# Load environment variables at the very beginning
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database.config import engine, Base
from routes.api import api_router
from utils.logger import get_logger
import time

logger = get_logger(__name__)

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Database connection failed, using dummy mode or check postgresql: {e}")

app = FastAPI(
    title="SHAKTI AI Backend API",
    description="Backend for AI-powered government procurement platform.",
    version="1.0.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

import traceback

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}")
    logger.error(traceback.format_exc())
    return {
        "detail": "An internal server error occurred. Check backend logs.",
        "error": str(exc)
    }

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to SHAKTI AI API", "status": "running"}

# Feature placeholders
@app.get("/api/fraud-detection/score/{bidder_id}")
def get_fraud_score(bidder_id: int):
    # Fraud risk scoring placeholder
    return {"bidder_id": bidder_id, "risk_score": 78, "level": "HIGH", "flags": ["Shared IP address", "Duplicate Director"]}

@app.post("/api/fraud-detection/check-duplicates")
def check_duplicates():
    # Duplicate bidder detection placeholder
    return {"status": "Complete", "duplicates_found": 1, "details": "Bidder A and Bidder C share same IP."}

if __name__ == "__main__":
    import uvicorn
    # reload_dirs=['.'] is default, we want to exclude 'uploads'
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, reload_excludes=["uploads/*", "*.db"])

