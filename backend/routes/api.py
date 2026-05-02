from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database.db import get_db
from models import Tender, Bidder, BidderDocument, Evaluation, AuditLog, User
# Note: BidderDocument might need to be moved to its own file or added to models/__init__.py
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
    
    return {
        "id": new_tender.id, 
        "tender_name": new_tender.title,
        "status": "Uploaded",
        "criteria": new_tender.criteria
    }

@api_router.get("/tenders")
async def get_tenders(db: Session = Depends(get_db)):
    tenders = db.query(Tender).all()
    # Map 'title' to 'tender_name' for consistency with user request if needed, 
    # but frontend is already using .title based on my TenderList implementation.
    # I'll add 'tender_name' as an extra field for compatibility.
    result = []
    for t in tenders:
        result.append({
            "id": t.id,
            "title": t.title,
            "tender_name": t.title,
            "tender_number": t.tender_number,
            "status": t.status,
            "created_at": t.created_at,
            "file_path": t.file_path
        })
    return result

@api_router.post("/upload-bidder-doc")
async def upload_bidder_doc(
    bidder_id: int = Form(...), 
    tender_id: int = Form(...), 
    document_type: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # Ensure bidder exists (for demo, we create if not exists)
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        bidder = Bidder(id=bidder_id, company_name=f"Bidder {bidder_id}")
        db.add(bidder)
        db.commit()
        db.refresh(bidder)

    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"bidder_{bidder_id}_{file_id}{file_ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_doc = BidderDocument(
        bidder_id=bidder_id,
        tender_id=tender_id,
        document_type=document_type,
        file_path=file_path
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return {"id": new_doc.id, "message": "Document uploaded successfully"}

@api_router.get("/tenders/latest")
async def get_latest_tender(db: Session = Depends(get_db)):
    tender = db.query(Tender).order_by(Tender.id.desc()).first()
    if not tender:
        raise HTTPException(status_code=404, detail="No tenders found")
    return tender



@api_router.get("/evaluations")
async def get_evaluations(db: Session = Depends(get_db)):
    # Join with Bidder and Tender to get names
    evaluations = db.query(Evaluation).all()
    results = []
    for e in evaluations:
        bidder = db.query(Bidder).filter(Bidder.id == e.bidder_id).first()
        tender = db.query(Tender).filter(Tender.id == e.tender_id).first()
        results.append({
            "id": e.id,
            "bidder_name": bidder.company_name if bidder else "Unknown",
            "tender_title": tender.title if tender else "Unknown",
            "status": e.status,
            "ai_score": e.confidence_score,
            "risk_level": e.risk_level,
            "submission_date": e.created_at.strftime("%Y-%m-%d")
        })
    return results


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

from services.fraud_service import FraudDetectionService

@api_router.get("/fraud-detection")
async def get_fraud_alerts(db: Session = Depends(get_db)):
    """
    Get all detected fraud patterns and suspicious bidder relationships.
    """
    return FraudDetectionService.detect_fraud_patterns(db)

@api_router.get("/fraud-detection/summary")
async def get_fraud_summary(db: Session = Depends(get_db)):
    """
    Get a summary of fraud statistics for the dashboard cards.
    """
    alerts = FraudDetectionService.detect_fraud_patterns(db)
    
    summary = {
        "total_alerts": len(alerts),
        "high_risk": len([a for a in alerts if a["risk_level"] == "High"]),
        "medium_risk": len([a for a in alerts if a["risk_level"] == "Medium"]),
        "low_risk": len([a for a in alerts if a["risk_level"] == "Low"]),
    }
    return summary

@api_router.get("/audit-logs")
async def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return logs
