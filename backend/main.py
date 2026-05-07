import os
import time
import logging
import traceback
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# ==================================================
# LOAD ENV VARIABLES
# ==================================================
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

# ==================================================
# SET UPLOAD DIR EARLY — before any route imports
# main.py is the entry point so __file__ is always reliable here
# ==================================================
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_UPLOADS_DIR = os.path.join(_BACKEND_DIR, "uploads")
os.makedirs(_UPLOADS_DIR, exist_ok=True)
os.environ["SHAKTI_UPLOAD_DIR"] = _UPLOADS_DIR

# ==================================================
# FASTAPI IMPORTS
# ==================================================
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from pydantic import BaseModel
from typing import List

# ==================================================
# DATABASE IMPORTS
# ==================================================
from database.db import engine, get_db
from database.base import Base

# ==================================================
# IMPORTANT: IMPORT ALL MODELS
# ==================================================
import models.user
import models.tender
import models.bidder
import models.evaluation
import models.audit_log
import models.fraud_alert
import models.criterion
import models.tender_required_document

# ==================================================
# MODEL IMPORTS
# ==================================================
from models.tender import Tender
from models.bidder import Bidder
from models.user import User

# ==================================================
# ROUTES
# ==================================================
from routes.api import api_router

# ==================================================
# LOGGER
# ==================================================
from utils.logger import get_logger

logger = get_logger(__name__)

# ==================================================
# FASTAPI LIFESPAN
# ==================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 SHAKTI AI Backend - Startup Sequence Initialized")
    
    # 1. Synchronous Database Initialization & Migration (Transaction-Safe)
    try:
        logger.info("📡 Database: Verifying tables and schema...")
        Base.metadata.create_all(bind=engine)
        
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        criteria_cols = [c['name'] for c in inspector.get_columns("criteria")] if "criteria" in table_names else []
        eval_cols = [c['name'] for c in inspector.get_columns("evaluations")] if "evaluations" in table_names else []
        
        with engine.begin() as conn:
            # 1. Criteria Table Migrations
            if "weightage" not in criteria_cols:
                logger.info("➕ Migrating: Adding 'weightage' to criteria")
                conn.execute(text("ALTER TABLE criteria ADD COLUMN weightage FLOAT DEFAULT 0.0"))
            
            if "max_score" not in criteria_cols:
                logger.info("➕ Migrating: Adding 'max_score' to criteria")
                conn.execute(text("ALTER TABLE criteria ADD COLUMN max_score FLOAT DEFAULT 100.0"))

            # 2. Evaluations Table Migrations
            if "evaluations" in inspector.get_table_names():
                if "confidence" not in eval_cols:
                    logger.info("➕ Migrating: Adding 'confidence' to evaluations")
                    conn.execute(text("ALTER TABLE evaluations ADD COLUMN confidence FLOAT DEFAULT 0.0"))
                if "total_score" not in eval_cols:
                    logger.info("➕ Migrating: Adding 'total_score' to evaluations")
                    conn.execute(text("ALTER TABLE evaluations ADD COLUMN total_score FLOAT DEFAULT 0.0"))
                
                # Cleanup old column if present
                if "confidence_score" in eval_cols:
                    logger.info("🧹 Migration: Detected old 'confidence_score' column")
                    # We keep it for safety but focus on new columns
            
            # 3. Ensure evaluation_details exists
            if "evaluation_details" not in inspector.get_table_names():
                logger.info("➕ Migrating: Creating 'evaluation_details' table")
                conn.execute(text("""
                    CREATE TABLE evaluation_details (
                        id SERIAL PRIMARY KEY,
                        evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
                        criterion_id INTEGER REFERENCES criteria(id) ON DELETE CASCADE,
                        status VARCHAR(50),
                        bidder_value TEXT,
                        confidence FLOAT,
                        source VARCHAR(255),
                        explanation TEXT,
                        score FLOAT DEFAULT 0
                    )
                """))

            # 4. Users Table Migrations
            if "users" in inspector.get_table_names():
                user_cols = [c['name'] for c in inspector.get_columns("users")]
                for col in ["phone", "department", "designation", "bio", "profile_picture"]:
                    if col not in user_cols:
                        logger.info(f"➕ Migrating: Adding '{col}' to users")
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} TEXT"))
                
        logger.info("✅ Database: Schema is up to date.")
    except Exception as e:
        logger.error(f"❌ Database: Initialization failed: {e}")
        logger.error(traceback.format_exc())

    yield
    logger.info("🛑 SHAKTI AI Backend - Shutdown Sequence Initiated")

# ==================================================
# FASTAPI APP
# ==================================================
app = FastAPI(
    title="SHAKTI AI Backend API",
    description="Backend for AI-powered government procurement platform",
    version="1.0.0",
    lifespan=lifespan
)

# ==================================================
# GLOBAL CORS CONFIGURATION
# ==================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# BASIC TEST ROUTES (Instant Work)
# ==================================================
@app.get("/")
async def root():
    return {
        "status": "Online",
        "message": "SHAKTI AI API is running. Visit /docs for Swagger.",
        "timestamp": time.time()
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "Healthy",
        "database": "Connection is pooled",
        "service": "FastAPI Core Active",
        "timestamp": time.time()
    }

# ==================================================
# REQUEST LOGGER MIDDLEWARE
# ==================================================
@app.middleware("http")
async def log_requests(request: Request, call_next):

    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} "
        f"{response.status_code} "
        f"{process_time:.4f}s"
    )

    return response

# ==================================================
# GLOBAL ERROR HANDLER
# ==================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):

    logger.error(f"Global Error: {exc}")
    logger.error(traceback.format_exc())

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error": str(exc)
        }
    )

# UPLOADS_ABS_DIR is already set above — reuse for StaticFiles
UPLOADS_ABS_DIR = os.environ["SHAKTI_UPLOAD_DIR"]
# Serve uploaded files at /api/uploads/<filename> — required for PDF preview in browser
app.mount("/api/uploads", StaticFiles(directory=UPLOADS_ABS_DIR), name="uploads")

# ==================================================
# INCLUDE ROUTES
# ==================================================
app.include_router(api_router, prefix="/api")

# ==================================================
# MAIN
# ==================================================
if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
 