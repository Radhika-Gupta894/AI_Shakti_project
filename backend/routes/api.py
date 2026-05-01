from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from database.config import get_db
from models.models import Tender, Bidder, BidderDocument, Evaluation, AuditLog, User
from services.evaluator import process_tender_upload, process_bidder_evaluation
from services.ai_service import AIService
import shutil
import os
import uuid

api_router = APIRouter()
ai_service = AIService()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@api_router.post("/upload-tender")
async def upload_tender(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"tender_{file_id}{file_ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process with OCR + AI
    processing_result = await process_tender_upload(file_path)
    
    new_tender = Tender(
        title=file.filename,
        file_path=file_path,
        criteria=processing_result['criteria'],
        status="active"
    )
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)
    
    return {"id": new_tender.id, "criteria": new_tender.criteria}

@api_router.get("/tenders")
async def get_tenders(db: Session = Depends(get_db)):
    tenders = db.query(Tender).all()
    return tenders


@api_router.post("/evaluate-bidder")
async def evaluate_bidder(tender_id: int, bidder_id: int, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    bidder_docs = db.query(BidderDocument).filter(
        BidderDocument.bidder_id == bidder_id,
        BidderDocument.tender_id == tender_id
    ).all()
    
    if not tender or not bidder_docs:
        raise HTTPException(status_code=404, detail="Tender or Bidder Documents not found")
    
    docs_list = [{"type": d.document_type, "file_path": d.file_path} for d in bidder_docs]
    
    evaluation_result = await process_bidder_evaluation(tender.criteria, docs_list)
    
    new_eval = Evaluation(
        tender_id=tender_id,
        bidder_id=bidder_id,
        status=evaluation_result['overall_status'],
        confidence_score=evaluation_result.get('risk_score', 0), # Using risk score as proxy or confidence
        risk_level="LOW" if evaluation_result.get('risk_score', 0) < 30 else "HIGH",
        detailed_report=evaluation_result
    )
    db.add(new_eval)
    db.commit()
    
    return evaluation_result

@api_router.get("/evaluation-report/{evaluation_id}")
async def get_report(evaluation_id: int, db: Session = Depends(get_db)):
    eval_record = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not eval_record:
        raise HTTPException(status_code=404, detail="Report not found")
    return eval_record.detailed_report

@api_router.get("/dashboard-stats")
async def get_stats(db: Session = Depends(get_db)):
    total_bidders = db.query(Bidder).count()
    evaluations = db.query(Evaluation).all()
    
    eligible = len([e for e in evaluations if e.status == 'PASS'])
    rejected = len([e for e in evaluations if e.status == 'FAIL'])
    review = len([e for e in evaluations if e.status == 'REVIEW'])
    
    return {
        "total_bidders": total_bidders,
        "eligible": eligible,
        "rejected": rejected,
        "review": review,
        "recent_activity": [] # Placeholder for recent logs
    }

@api_router.get("/fraud-detection")
async def fraud_detection(db: Session = Depends(get_db)):
    # In a real app, we'd fetch multiple bidders data
    # For now, return sample response
    return {
        "alerts": [
            {"bidder": "ABC Corp", "risk": "HIGH", "reason": "Shared Director with XYZ Ltd", "score": 85},
            {"bidder": "PQR Enterprises", "risk": "MEDIUM", "reason": "Similar document structure to MNO Pvt", "score": 55}
        ]
    }

@api_router.get("/audit-logs")
async def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs
