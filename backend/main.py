import os
import time
import logging
import traceback
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# ==================================================
# LOAD ENV VARIABLES
# ==================================================
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# ==================================================
# FASTAPI IMPORTS
# ==================================================
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

    try:
        logger.info("🚀 Starting SHAKTI AI Backend...")

        # We try to create tables but don't let it crash the startup if DB is down
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created/verified successfully.")
            
            # Verify created tables
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()
            logger.info(f"🏗️ Tables currently in database: {existing_tables}")
        except Exception as db_err:
            logger.error(f"⚠️ Database table creation skipped (DB might be down): {db_err}")

    except Exception as e:
        logger.error(f"❌ General initialization error: {e}")
        logger.error(traceback.format_exc())

    yield

    logger.info("🛑 SHAKTI AI Backend shutting down...")

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
# CORS
# ==================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins
    allow_credentials=False, # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# ==================================================
# INCLUDE ROUTES
# ==================================================
app.include_router(api_router, prefix="/api")

# ==================================================
# ROOT ENDPOINT
# ==================================================
@app.get("/")
def root():
    db_status = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"error: {str(e)}"

    return {
        "message": "Welcome to SHAKTI AI API",
        "status": "running",
        "database": db_status
    }

# ==================================================
# PYDANTIC SCHEMAS
# ==================================================
class TenderSchema(BaseModel):
    title: str
    description: str

class BidderSchema(BaseModel):
    company_name: str
    gst_number: str
    turnover: float

# ==================================================
# VERIFICATION ENDPOINTS
# ==================================================
@app.post("/create-tender", tags=["Verification"])
def create_tender(
    tender: TenderSchema,
    db: Session = Depends(get_db)
):

    try:
        new_tender = Tender(
            title=tender.title,
            description=tender.description
        )

        db.add(new_tender)

        db.commit()

        db.refresh(new_tender)

        return {
            "message": "Tender created successfully",
            "data": {
                "id": new_tender.id,
                "title": new_tender.title,
                "description": new_tender.description
            }
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/tenders", tags=["Verification"])
def list_tenders(db: Session = Depends(get_db)):

    tenders = db.query(Tender).all()

    return tenders

@app.post("/create-bidder", tags=["Verification"])
def create_bidder(
    bidder: BidderSchema,
    db: Session = Depends(get_db)
):

    try:
        new_bidder = Bidder(
            company_name=bidder.company_name,
            gst_number=bidder.gst_number,
            turnover=bidder.turnover
        )

        db.add(new_bidder)

        db.commit()

        db.refresh(new_bidder)

        return {
            "message": "Bidder created successfully",
            "data": {
                "id": new_bidder.id,
                "company_name": new_bidder.company_name
            }
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/users", tags=["Verification"])
def list_users(db: Session = Depends(get_db)):

    users = db.query(User).all()

    return users

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
 