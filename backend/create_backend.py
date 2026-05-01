import os

base_dir = r"c:\Users\shali\OneDrive\Documents\AI_Shakti_project\backend"

directories = [
    "database",
    "models",
    "schemas",
    "routes",
    "services",
    "utils",
    "uploads",
    "reports"
]

for d in directories:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)
    init_file = os.path.join(base_dir, d, "__init__.py")
    if not os.path.exists(init_file) and d not in ["uploads", "reports"]:
        open(init_file, 'w').close()

files = {}

files["requirements.txt"] = """fastapi
uvicorn
sqlalchemy
psycopg2-binary
pydantic
pydantic-settings
python-multipart
pdfplumber
pytesseract
Pillow
openai
reportlab
python-dotenv
"""

files[".env.example"] = """DATABASE_URL=postgresql://user:password@localhost:5432/shakti_db
OPENAI_API_KEY=your_openai_api_key_here
TESSERACT_CMD_PATH=C:/Program Files/Tesseract-OCR/tesseract.exe
"""

files["database/config.py"] = """from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/shakti_db"
    OPENAI_API_KEY: str = ""
    TESSERACT_CMD_PATH: str = "tesseract"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Setup SQLAlchemy
# Use connect_args={"check_same_thread": False} only for sqlite, for postgresql it's not needed.
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"""

files["models/base.py"] = """from database.config import Base
# Import all models here so metadata is created
from .tender import Tender
from .bidder import Bidder, BidderDocument
from .evaluation import Evaluation
from .audit import AuditLog
"""

files["models/tender.py"] = """from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from database.config import Base

class Tender(Base):
    __tablename__ = "tenders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    reference_no = Column(String, unique=True, index=True)
    document_path = Column(String)
    extracted_criteria = Column(JSON) # Store Technical, Financial, Compliance, Mandatory
    created_at = Column(DateTime(timezone=True), server_default=func.now())
"""

files["models/bidder.py"] = """from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.config import Base

class Bidder(Base):
    __tablename__ = "bidders"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    name = Column(String, index=True)
    status = Column(String, default="PENDING") # PENDING, PASS, FAIL, REVIEW
    overall_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    documents = relationship("BidderDocument", back_populates="bidder")
    evaluations = relationship("Evaluation", back_populates="bidder")

class BidderDocument(Base):
    __tablename__ = "bidder_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    document_type = Column(String)
    file_path = Column(String)
    extracted_text = Column(String)
    
    bidder = relationship("Bidder", back_populates="documents")
"""

files["models/evaluation.py"] = """from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.config import Base

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    criterion_name = Column(String)
    required_value = Column(String)
    found_value = Column(String)
    source_document = Column(String)
    status = Column(String) # PASS, FAIL, REVIEW
    confidence_score = Column(Float)
    reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    bidder = relationship("Bidder", back_populates="evaluations")
"""

files["models/audit.py"] = """from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from database.config import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
"""

files["schemas/tender.py"] = """from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

class TenderBase(BaseModel):
    title: str
    reference_no: str

class TenderCreate(TenderBase):
    pass

class TenderResponse(TenderBase):
    id: int
    document_path: str
    extracted_criteria: Optional[Dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

class CriteriaExtractionResponse(BaseModel):
    technical: List[str]
    financial: List[str]
    compliance: List[str]
    mandatory: List[str]
"""

files["schemas/evaluation.py"] = """from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EvaluationBase(BaseModel):
    criterion_name: str
    required_value: str
    found_value: str
    source_document: str
    status: str
    confidence_score: float
    reason: str

class EvaluationResponse(EvaluationBase):
    id: int
    bidder_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ManualReviewRequest(BaseModel):
    evaluation_id: int
    override_status: str # PASS or FAIL
    reviewer_notes: str
"""

files["utils/logger.py"] = """import logging

def get_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
    return logger
"""

files["services/ocr_service.py"] = """import pdfplumber
import pytesseract
from PIL import Image
from utils.logger import get_logger
from database.config import settings

logger = get_logger(__name__)

# Configure tesseract if needed for windows
if settings.TESSERACT_CMD_PATH:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD_PATH

def extract_pdf_text(file_path: str) -> str:
    \"\"\"Extract text from typed PDFs.\"\"\"
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\\n"
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
    return text

def extract_image_text(image_path: str) -> str:
    \"\"\"Extract text from images using OCR.\"\"\"
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting image text: {e}")
        return ""

def calculate_ocr_confidence(text: str) -> float:
    \"\"\"Mock confidence score based on text quality.\"\"\"
    # In production, pytesseract.image_to_data can return actual confidences.
    if not text:
        return 0.0
    # Simple heuristic: ratio of alphanumeric chars
    alnum = sum(c.isalnum() for c in text)
    ratio = alnum / len(text)
    return min(ratio * 100, 100.0)
"""

files["services/ai_service.py"] = """import json
from database.config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Using dummy response for illustration without real OpenAI call
async def extract_criteria_from_text(text: str) -> dict:
    \"\"\"
    Sends text to OpenAI/Gemini to extract structured criteria.
    Returns structured JSON.
    \"\"\"
    # Placeholder for actual OpenAI call
    # response = openai.ChatCompletion.create(
    #     model="gpt-4",
    #     messages=[{"role": "user", "content": f"Extract criteria from this tender:\\n{text}"}]
    # )
    
    logger.info("Extracting criteria using AI...")
    
    # Dummy structured response
    return {
        "technical": [
            "ISO 27001 Certification",
            "CMMI Level 3"
        ],
        "financial": [
            "Minimum average turnover of ₹5 Cr over last 3 years"
        ],
        "compliance": [
            "Non-blacklisting affidavit"
        ],
        "mandatory": [
            "ISO 27001 Certification",
            "Minimum average turnover of ₹5 Cr over last 3 years"
        ]
    }
"""

files["services/evaluation_engine.py"] = """from typing import List, Dict
from utils.logger import get_logger

logger = get_logger(__name__)

def evaluate_bidder(bidder_data: str, criteria: dict) -> List[Dict]:
    \"\"\"
    Compares extracted bidder text against extracted criteria.
    In production, this would use LLM for semantic matching.
    \"\"\"
    logger.info("Evaluating bidder against tender criteria...")
    
    evaluations = []
    
    # Mock evaluation logic
    evaluations.append({
        "criterion_name": "Turnover",
        "required_value": "₹5 Cr",
        "found_value": "₹6.2 Cr",
        "source_document": "Financial_Statement.pdf",
        "status": "PASS",
        "confidence_score": 95.0,
        "reason": "Turnover exceeds threshold of ₹5 Cr"
    })
    
    evaluations.append({
        "criterion_name": "ISO 27001",
        "required_value": "Valid ISO 27001 Certificate",
        "found_value": "Certificate found but expiry date unclear",
        "source_document": "Certificates.pdf",
        "status": "REVIEW",
        "confidence_score": 45.0,
        "reason": "OCR confidence low on expiry date. Human review required."
    })
    
    return evaluations
"""

files["services/report_service.py"] = """import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from utils.logger import get_logger

logger = get_logger(__name__)

def generate_pdf_report(evaluation_id: int, bidder_name: str, results: list) -> str:
    \"\"\"Generates a downloadable PDF report for a bidder.\"\"\"
    report_path = f"reports/evaluation_report_{evaluation_id}.pdf"
    
    try:
        c = canvas.Canvas(report_path, pagesize=letter)
        c.drawString(100, 750, f"SHAKTI AI - Evaluation Report")
        c.drawString(100, 730, f"Bidder: {bidder_name}")
        c.drawString(100, 710, "-"*50)
        
        y = 680
        for res in results:
            c.drawString(100, y, f"Criterion: {res['criterion_name']}")
            c.drawString(100, y-15, f"Status: {res['status']} | Confidence: {res['confidence_score']}%")
            c.drawString(100, y-30, f"Reason: {res['reason']}")
            y -= 60
            
            if y < 100:
                c.showPage()
                y = 750
        
        c.save()
        logger.info(f"Report generated at {report_path}")
        return report_path
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return ""
"""

files["routes/api.py"] = """from fastapi import APIRouter
from .tender import router as tender_router
from .bidder import router as bidder_router
from .evaluation import router as evaluation_router

api_router = APIRouter()

api_router.include_router(tender_router, prefix="/tender", tags=["Tender"])
api_router.include_router(bidder_router, prefix="/bidder", tags=["Bidder"])
api_router.include_router(evaluation_router, prefix="/evaluation", tags=["Evaluation"])
"""

files["routes/tender.py"] = """from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database.config import get_db
from models.tender import Tender
from schemas.tender import TenderResponse, CriteriaExtractionResponse
from services.ocr_service import extract_pdf_text
from services.ai_service import extract_criteria_from_text
import shutil
import os

router = APIRouter()

@router.post("/upload", response_model=TenderResponse)
async def upload_tender(title: str, reference_no: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save file
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create DB entry
    new_tender = Tender(title=title, reference_no=reference_no, document_path=file_path)
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)
    return new_tender

@router.post("/extract-criteria/{tender_id}", response_model=CriteriaExtractionResponse)
async def extract_criteria(tender_id: int, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    # Extract text from PDF
    text = extract_pdf_text(tender.document_path)
    
    # Use AI to get structured criteria
    criteria = await extract_criteria_from_text(text)
    
    # Save criteria in DB
    tender.extracted_criteria = criteria
    db.commit()
    
    return criteria
"""

files["routes/bidder.py"] = """from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database.config import get_db
from models.bidder import Bidder, BidderDocument
import shutil
import os

router = APIRouter()

@router.post("/upload")
async def upload_bidder_document(bidder_name: str, tender_id: int, doc_type: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Find or create bidder
    bidder = db.query(Bidder).filter(Bidder.name == bidder_name, Bidder.tender_id == tender_id).first()
    if not bidder:
        bidder = Bidder(name=bidder_name, tender_id=tender_id)
        db.add(bidder)
        db.commit()
        db.refresh(bidder)
        
    # Save file
    file_path = f"uploads/bidder_{bidder.id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create document entry
    new_doc = BidderDocument(bidder_id=bidder.id, document_type=doc_type, file_path=file_path)
    db.add(new_doc)
    db.commit()
    
    return {"message": "Document uploaded successfully", "bidder_id": bidder.id}
"""

files["routes/evaluation.py"] = """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.config import get_db
from models.tender import Tender
from models.bidder import Bidder, BidderDocument
from models.evaluation import Evaluation
from schemas.evaluation import EvaluationResponse, ManualReviewRequest
from services.ocr_service import extract_pdf_text
from services.evaluation_engine import evaluate_bidder
from services.report_service import generate_pdf_report
from fastapi.responses import FileResponse
from typing import List

router = APIRouter()

@router.post("/evaluate/{bidder_id}", response_model=List[EvaluationResponse])
async def evaluate_bidder_endpoint(bidder_id: int, db: Session = Depends(get_db)):
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")
        
    tender = db.query(Tender).filter(Tender.id == bidder.tender_id).first()
    if not tender or not tender.extracted_criteria:
        raise HTTPException(status_code=400, detail="Tender criteria not extracted yet")
        
    documents = db.query(BidderDocument).filter(BidderDocument.bidder_id == bidder.id).all()
    
    # Combine text from all docs
    full_text = ""
    for doc in documents:
        # Simplistic extraction for demo
        full_text += extract_pdf_text(doc.file_path)
        
    # Evaluate
    results = evaluate_bidder(full_text, tender.extracted_criteria)
    
    # Save results
    saved_evals = []
    for res in results:
        eval_record = Evaluation(
            bidder_id=bidder_id,
            criterion_name=res["criterion_name"],
            required_value=res["required_value"],
            found_value=res["found_value"],
            source_document=res["source_document"],
            status=res["status"],
            confidence_score=res["confidence_score"],
            reason=res["reason"]
        )
        db.add(eval_record)
        db.commit()
        db.refresh(eval_record)
        saved_evals.append(eval_record)
        
    return saved_evals

@router.post("/manual-review")
async def manual_review(request: ManualReviewRequest, db: Session = Depends(get_db)):
    evaluation = db.query(Evaluation).filter(Evaluation.id == request.evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    evaluation.status = request.override_status
    evaluation.reason = f"[Manual Override]: {request.reviewer_notes}"
    db.commit()
    
    return {"message": "Evaluation overridden successfully"}

@router.get("/report/{bidder_id}")
async def get_evaluation_report(bidder_id: int, db: Session = Depends(get_db)):
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    evaluations = db.query(Evaluation).filter(Evaluation.bidder_id == bidder_id).all()
    
    if not bidder or not evaluations:
        raise HTTPException(status_code=404, detail="Data not found")
        
    res_list = [{
        "criterion_name": e.criterion_name,
        "status": e.status,
        "confidence_score": e.confidence_score,
        "reason": e.reason
    } for e in evaluations]
    
    report_path = generate_pdf_report(bidder_id, bidder.name, res_list)
    return FileResponse(path=report_path, filename=f"Evaluation_Report_{bidder_id}.pdf", media_type='application/pdf')
"""

files["main.py"] = """from fastapi import FastAPI, Request
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
"""

for file_path, content in files.items():
    full_path = os.path.join(base_dir, file_path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Backend setup successfully")
