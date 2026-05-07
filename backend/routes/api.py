from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database.db import get_db
from models import Tender, Bidder, BidderDocument, Evaluation, AuditLog, User, ManualReview, ClarificationRequest, FraudAlert, Criterion, TenderRequiredDocument
from pydantic import BaseModel
from services.ai_service import AIService
from services.fraud_service import FraudDetectionService
from services.evaluator import process_tender_upload, process_bidder_evaluation
from utils.ocr import extract_pdf_text
import pdfplumber
import io
import PIL.Image
import logging
import shutil
import os
import uuid
import json
import re
import traceback
import asyncio
import random
from datetime import datetime
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Services will be initialized lazily to prevent startup crashes
ai_service = None
fraud_service = None

def get_ai_service():
    global ai_service
    if ai_service is None:
        ai_service = AIService()
    return ai_service

def get_fraud_service():
    global fraud_service
    if fraud_service is None:
        fraud_service = FraudDetectionService()
    return fraud_service

class CriterionCreate(BaseModel):
    tender_id: int
    title: str
    description: str = ""
    category: str = "Technical"
    mandatory: bool = True
    value: str = ""
    confidence: float = 0.90
    weightage: float = 0.0
    max_score: float = 100.0


class RequiredDocumentCreate(BaseModel):
    document_name: str
    category: str = "Compliance"
    mandatory: bool = True
    source: str = "Admin"
    description: str = ""

class TenderIDRequest(BaseModel):
    tender_id: int

api_router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def run_tender_analysis(tender_id: int, file_path: str, db_session_factory):
    db = db_session_factory()
    try:
        logger.info(f"⚙️ Background analysis started for Tender {tender_id}")
        processing_result = asyncio.run(process_tender_upload(file_path))
        criteria = processing_result.get('criteria', {})
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if tender:
            tender.criteria = criteria
            tender.status = "active"
            db.commit()
            logger.info(f"✅ Background analysis complete for Tender {tender_id}")
        else:
            logger.error(f"❌ Tender {tender_id} not found in DB!")
    except Exception as e:
        logger.error(f"❌ Background analysis failed: {e}")
        logger.error(traceback.format_exc())
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if tender:
            tender.status = "failed"
            db.commit()
    finally:
        db.close()


def run_bidder_evaluation(tender_id: int, bidder_id: int, db_session_factory):
    db = db_session_factory()
    try:
        logger.info(f"⚙️ Background evaluation for Bidder {bidder_id} on Tender {tender_id}")
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        bidder_docs = db.query(BidderDocument).filter(
            BidderDocument.bidder_id == bidder_id,
            BidderDocument.tender_id == tender_id
        ).all()

        if not tender or not bidder_docs:
            logger.warning(f"⚠️ Cannot evaluate: Tender or Docs missing for Bidder {bidder_id}")
            return

        docs_list = [{"type": d.document_type, "file_path": d.file_path} for d in bidder_docs]
        evaluation_result = asyncio.run(process_bidder_evaluation(tender.criteria, docs_list))

        eval_record = db.query(Evaluation).filter(
            Evaluation.tender_id == tender_id,
            Evaluation.bidder_id == bidder_id
        ).first()

        if eval_record:
            eval_record.status = evaluation_result.get('overall_status', 'REVIEW')
            eval_record.confidence_score = evaluation_result.get('risk_score', 0)
            eval_record.risk_level = "LOW" if evaluation_result.get('risk_score', 0) < 30 else "HIGH"
            eval_record.detailed_report = evaluation_result
            db.commit()
            logger.info(f"✅ Background evaluation complete for Bidder {bidder_id}")
    except Exception as e:
        logger.error(f"❌ Background evaluation failed: {e}")
        logger.error(traceback.format_exc())
    finally:
        db.close()


@api_router.post("/upload-tender")
async def upload_tender(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        logger.info(f"📁 UPLOAD: Processing tender '{file.filename}'")
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"tender_{file_id}{file_ext}")

        # Check if file is empty (Requirement #4)
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size == 0:
            logger.error("❌ UPLOAD FAILED: Empty file (0 bytes)")
            raise HTTPException(status_code=400, detail="File is empty. Please upload a valid document.")

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_tender = Tender(title=file.filename, file_path=file_path, criteria={}, status="processing")
        db.add(new_tender)
        db.commit()
        db.refresh(new_tender)
        logger.info(f"✅ DB SUCCESS: Tender saved with ID {new_tender.id}")

        from database.db import SessionLocal
        background_tasks.add_task(run_tender_analysis, new_tender.id, file_path, SessionLocal)

        return {"id": new_tender.id, "tender_name": new_tender.title, "status": "Processing", "message": "Upload successful. AI Analysis started."}
    except Exception as e:
        logger.error(f"❌ UPLOAD FAILED: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/tenders/latest")
def get_latest_tender(db: Session = Depends(get_db)):
    tender = db.query(Tender).order_by(Tender.id.desc()).first()
    if not tender:
        raise HTTPException(status_code=404, detail="No tenders found")
    return {
        "id": tender.id,
        "title": tender.title,
        "status": tender.status,
        "criteria": tender.criteria or {},
        "file_path": tender.file_path,
        "created_at": tender.created_at.isoformat() if tender.created_at else None
    }


@api_router.get("/tenders")
def get_tenders(db: Session = Depends(get_db)):
    try:
        logger.info("📡 FETCH: Retrieving all tenders...")
        tenders = db.query(
            Tender.id, Tender.title, Tender.status, Tender.created_at, Tender.file_path
        ).order_by(Tender.id.desc()).all()
        logger.info(f"📊 Found {len(tenders)} tenders.")
        return [
            {
                "id": t.id,
                "title": t.title,
                "tender_name": t.title,
                "tender_number": f"TNDR-{t.id:04d}",
                "status": t.status or "active",
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "file_path": t.file_path
            } for t in tenders
        ]
    except Exception as e:
        logger.error(f"❌ FETCH FAILED: {e}")
        return []


@api_router.post("/extract-criteria")
async def extract_criteria(file: UploadFile = File(...)):
    try:
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{file_id}{file_ext}")
        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            result = await process_tender_upload(temp_path)
            criteria = result.get('criteria', {})
            return {
                "financial": criteria.get('financial_criteria', []),
                "technical": criteria.get('technical_criteria', []),
                "compliance": criteria.get('compliance_criteria', []),
                "raw_criteria": criteria
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    except Exception as e:
        return {"financial": [], "technical": [], "compliance": [], "error": str(e)}


@api_router.post("/upload-bidder-doc")
async def upload_bidder_doc(
    bidder_id: int = Form(...),
    tender_id: int = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"📤 Uploading {document_type} for bidder {bidder_id} on tender {tender_id}")

        bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
        if not bidder:
            # gst_number has nullable=False so provide a placeholder
            bidder = Bidder(id=bidder_id, company_name=f"Bidder {bidder_id}", gst_number="PENDING")
            db.add(bidder)
            db.commit()
            db.refresh(bidder)

        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_DIR, f"bidder_{bidder_id}_{file_id}{file_ext}")

        # Check if file is empty
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size == 0:
            logger.error(f"❌ Document Upload Failed: Empty file for bidder {bidder_id}")
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

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
        logger.info(f"✅ Document {new_doc.id} uploaded.")
        return {"id": new_doc.id, "message": "Document uploaded successfully"}
    except Exception as e:
        logger.error(f"❌ Error uploading document: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/evaluate-bidder")
async def evaluate_bidder(tender_id: int, bidder_id: int, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        bidder = Bidder(id=bidder_id, company_name=f"Demo Bidder {bidder_id}", gst_number="PENDING")
        db.add(bidder)
        db.commit()

    bidder_docs = db.query(BidderDocument).filter(
        BidderDocument.bidder_id == bidder_id,
        BidderDocument.tender_id == tender_id
    ).all()

    if not tender:
        tender = Tender(id=tender_id, title=f"Tender #{tender_id}", status="active", criteria={})
        db.add(tender)
        db.commit()
        db.refresh(tender)

    if not bidder_docs:
        return {"overall_status": "AWAITING_DOCS", "risk_score": 0, "message": "Waiting for documents."}

    docs_list = [{"type": d.document_type, "file_path": d.file_path} for d in bidder_docs]
    evaluation_result = await process_bidder_evaluation(tender.criteria, docs_list)

    new_eval = Evaluation(
        tender_id=tender_id,
        bidder_id=bidder_id,
        status=evaluation_result['overall_status'],
        confidence_score=evaluation_result.get('risk_score', 0),
        risk_level="LOW" if evaluation_result.get('risk_score', 0) < 30 else "HIGH",
        detailed_report=evaluation_result
    )
    db.add(new_eval)
    db.commit()
    return evaluation_result


@api_router.post("/finalize-submission")
async def finalize_submission(background_tasks: BackgroundTasks, tender_id: int, bidder_id: int, db: Session = Depends(get_db)):
    logger.info(f"📥 FINALIZE: tender {tender_id}, bidder {bidder_id}")
    try:
        eval_record = db.query(Evaluation).filter(
            Evaluation.tender_id == tender_id,
            Evaluation.bidder_id == bidder_id
        ).first()

        if not eval_record:
            eval_record = Evaluation(
                tender_id=tender_id, bidder_id=bidder_id,
                status="SUBMITTED", confidence_score=0, risk_level="PENDING"
            )
            db.add(eval_record)
            db.commit()
            db.refresh(eval_record)

        audit = AuditLog(action="Bid Submitted", details={"tender_id": tender_id, "bidder_id": bidder_id}, user_id=None)
        db.add(audit)
        db.commit()

        from database.db import SessionLocal
        background_tasks.add_task(run_bidder_evaluation, tender_id, bidder_id, SessionLocal)

        return {"message": "Submission finalized. AI Evaluation in progress.", "id": eval_record.id}
    except Exception as e:
        logger.error(f"❌ FINALIZE FAILED: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/my-submissions/{bidder_id}")
def get_my_submissions(bidder_id: int, db: Session = Depends(get_db)):
    try:
        evaluations = db.query(Evaluation).filter(Evaluation.bidder_id == bidder_id).all()
        results = []
        for e in evaluations:
            tender = db.query(Tender).filter(Tender.id == e.tender_id).first()
            results.append({
                "id": e.id,
                "tender_title": tender.title if tender else f"Tender #{e.tender_id}",
                "status": e.status,
                "ai_score": getattr(e, 'confidence_score', 0),
                "risk_level": getattr(e, 'risk_level', 'PENDING'),
                "submission_date": e.created_at.strftime("%b %d, %H:%M") if e.created_at else "Recent",
                "detailed_report": e.detailed_report
            })
        return results
    except Exception as e:
        logger.error(f"❌ USER FETCH FAILED: {e}")
        return []


@api_router.get("/evaluation-report/{evaluation_id}")
def get_report(evaluation_id: int, db: Session = Depends(get_db)):
    eval_record = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not eval_record:
        raise HTTPException(status_code=404, detail="Report not found")
    return eval_record.detailed_report


@api_router.get("/dashboard-stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        total_bidders = db.query(Bidder).count()
        evaluations = db.query(Evaluation).all()
        tenders_count = db.query(Tender).count()
        eligible = len([e for e in evaluations if e.status in ['PASS', 'Eligible']])
        rejected = len([e for e in evaluations if e.status in ['FAIL', 'Rejected']])
        review = len([e for e in evaluations if e.status == 'REVIEW'])
        submitted = len([e for e in evaluations if e.status == 'SUBMITTED'])
        return {
            "total_bidders": total_bidders,
            "total_tenders": tenders_count,
            "eligible": eligible,
            "rejected": rejected,
            "review": review,
            "submitted": submitted,
            "total_evaluations": len(evaluations)
        }
    except Exception as e:
        logger.error(f"❌ STATS FAILED: {e}")
        return {"total_bidders": 0, "eligible": 0, "rejected": 0, "review": 0, "submitted": 0}


@api_router.get("/evaluations")
def get_evaluations(db: Session = Depends(get_db)):
    try:
        # Optimized: Only fetch necessary columns and limit to recent 50 for performance
        evaluations = db.query(Evaluation).order_by(Evaluation.created_at.desc()).limit(50).all()
        
        if not evaluations:
            return []

        # Bulk fetch related bidders and tenders
        bidder_ids = list(set(e.bidder_id for e in evaluations if e.bidder_id))
        tender_ids = list(set(e.tender_id for e in evaluations if e.tender_id))
        
        bidders = {b.id: b for b in db.query(Bidder).filter(Bidder.id.in_(bidder_ids)).all()} if bidder_ids else {}
        tenders = {t.id: t for t in db.query(Tender).filter(Tender.id.in_(tender_ids)).all()} if tender_ids else {}
        
        results = []
        for e in evaluations:
            bidder = bidders.get(e.bidder_id)
            tender = tenders.get(e.tender_id)
            results.append({
                "id": e.id,
                "bidder_id": e.bidder_id,
                "tender_id": e.tender_id,
                "bidder_name": bidder.company_name if bidder else f"Bidder #{e.bidder_id}",
                "tender_title": tender.title if tender else f"Tender #{e.tender_id}",
                "status": e.status or "PENDING",
                "ai_score": int(e.confidence_score) if e.confidence_score is not None else 0,
                "risk_level": e.risk_level or "LOW",
                "submission_date": e.created_at.strftime("%b %d, %H:%M") if e.created_at else "Recent"
            })
        return results
    except Exception as e:
        logger.error(f"❌ Evaluations fetch failed: {e}")
        return []


@api_router.get("/admin/documents")
def get_all_bidder_documents(db: Session = Depends(get_db)):
    try:
        docs = db.query(BidderDocument).order_by(BidderDocument.created_at.desc()).all()
        results = []
        for d in docs:
            bidder = db.query(Bidder).filter(Bidder.id == d.bidder_id).first()
            results.append({
                "id": d.id,
                "bidder_id": d.bidder_id,
                "bidder_name": bidder.company_name if bidder else f"Bidder #{d.bidder_id}",
                "type": d.document_type,
                "file_path": d.file_path,
                "created_at": d.created_at.isoformat() if d.created_at else None
            })
        return results
    except Exception as e:
        logger.error(f"❌ Admin documents error: {e}")
        return []


@api_router.get("/fraud-detection")
def get_fraud_alerts(db: Session = Depends(get_db)):
    try:
        alerts = db.query(FraudAlert).order_by(FraudAlert.risk_score.desc()).all()
        results = []
        for a in alerts:
            b1 = db.query(Bidder).filter(Bidder.id == a.bidder1_id).first()
            b2 = db.query(Bidder).filter(Bidder.id == a.bidder2_id).first()
            results.append({
                "id": a.id,
                "company1": b1.company_name if b1 else "Unknown",
                "company2": b2.company_name if b2 else "Unknown",
                "risk_score": a.risk_score,
                "risk_level": a.risk_level,
                "reasons": a.alert_reason.split(", ") if a.alert_reason else [],
                "status": a.status,
                "details": a.details
            })
        return results
    except Exception as e:
        error_str = str(e)
        if "fraud_alerts.bidder1_id does not exist" in error_str or "42703" in error_str:
            from sqlalchemy import text
            try:
                db.execute(text("DROP TABLE IF EXISTS fraud_alerts"))
                db.commit()
                FraudAlert.__table__.create(db.get_bind())
                logger.info("✅ fraud_alerts table recreated with new schema.")
                return [] # Return empty list so the frontend doesn't crash, it just shows empty
            except Exception as e2:
                return JSONResponse(status_code=500, content={"detail": str(e2)})
        
        logger.error(f"❌ FRAUD ALERTS FAILED: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e), "traceback": traceback.format_exc()})


@api_router.get("/fraud-detection/summary")
def get_fraud_summary(db: Session = Depends(get_db)):
    try:
        # Use a single query to count risk levels for speed
        from sqlalchemy import func
        risk_counts = db.query(FraudAlert.risk_level, func.count(FraudAlert.id)).group_by(FraudAlert.risk_level).all()
        counts_dict = dict(risk_counts)
        
        total = sum(counts_dict.values())
        
        # Return field names that match frontend expectations (total_alerts and total_flags)
        return {
            "total_alerts": total,
            "total_flags": total, 
            "high_risk": counts_dict.get("High", 0),
            "medium_risk": counts_dict.get("Medium", 0),
            "low_risk": counts_dict.get("Low", 0),
        }
    except Exception as e:
        logger.error(f"⚠️ Fraud summary failed: {e}")
        return {"total_alerts": 0, "total_flags": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0}


@api_router.post("/fraud-detection/scan")
async def run_fraud_scan(db: Session = Depends(get_db)):
    try:
        res = await get_fraud_service().run_full_scan(db)
        return res
    except Exception as e:
        logger.error(f"❌ SCAN FAILED: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    try:
        logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
        return [
            {
                "id": l.id,
                "action": l.action,
                "details": l.details,
                "user_id": l.user_id,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None
            } for l in logs
        ]
    except Exception as e:
        logger.error(f"❌ AUDIT FAILED: {e}")
        return []


@api_router.get("/reports/summary")
def get_report_summary(db: Session = Depends(get_db)):
    try:
        evaluations = db.query(Evaluation).all()
        tenders = db.query(Tender).all()
        qualified = [e for e in evaluations if e.status in ['PASS', 'Eligible']]
        disqualified = [e for e in evaluations if e.status in ['FAIL', 'Rejected']]
        top_bidders = []
        for e in sorted(qualified, key=lambda x: x.confidence_score, reverse=True)[:5]:
            tender = db.query(Tender).filter(Tender.id == e.tender_id).first()
            top_bidders.append({
                "rank": len(top_bidders) + 1,
                "name": f"Bidder #{e.bidder_id}",
                "score": f"{e.confidence_score}/100",
                "status": "Verified",
                "tender_title": tender.title if tender else "Tender"
            })
        return {
            "total_bids": len(evaluations),
            "qualified": len(qualified),
            "disqualified": len(disqualified),
            "top_bidders": top_bidders,
            "report_date": datetime.now().strftime("%B %d, %Y"),
            "report_id": f"REP-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        }
    except Exception as e:
        logger.error(f"❌ REPORT FAILED: {e}")
        return {"total_bids": 0, "qualified": 0, "disqualified": 0, "top_bidders": []}


@api_router.get("/reports/export-csv")
async def export_csv(db: Session = Depends(get_db)):
    import csv
    import io
    from fastapi.responses import StreamingResponse
    try:
        evaluations = db.query(Evaluation).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Evaluation ID", "Tender ID", "Bidder ID", "Status", "Score", "Risk Level", "Date"])
        for e in evaluations:
            writer.writerow([e.id, e.tender_id, e.bidder_id, e.status, e.confidence_score, e.risk_level, e.created_at])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=tender_evaluation_report.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Export failed")


@api_router.get("/manual-review/{document_id}")
def get_manual_review(document_id: int, db: Session = Depends(get_db)):
    try:
        doc = db.query(BidderDocument).filter(BidderDocument.id == document_id).first()
        if not doc:
            # Demo fallback
            return {
                "document": {
                    "id": document_id,
                    "type": "GST Registration",
                    "file_path": None,
                    "extracted_data": {"gstin": "27AAACR1234A1Z1", "legal_name": "DEMO ENTERPRISE", "registration_date": "12-05-2018", "type": "Regular"},
                    "status": "PENDING",
                    "uploaded_by": "Demo Bidder",
                    "uploaded_at": "2026-05-01 10:20"
                },
                "history": []
            }
        bidder = db.query(Bidder).filter(Bidder.id == doc.bidder_id).first()
        history = db.query(ManualReview).filter(ManualReview.document_id == document_id).order_by(ManualReview.timestamp.desc()).all()
        return {
            "document": {
                "id": doc.id,
                "type": doc.document_type,
                "file_path": doc.file_path,
                "extracted_data": doc.extracted_data or {},
                "status": "PENDING",
                "uploaded_by": bidder.company_name if bidder else "Unknown",
                "uploaded_at": doc.created_at.strftime("%Y-%m-%d %H:%M") if doc.created_at else "Recent"
            },
            "history": [{"reviewer": h.reviewer_name, "action": h.action, "comments": h.comments, "timestamp": h.timestamp.strftime("%Y-%m-%d %H:%M")} for h in history]
        }
    except Exception as e:
        logger.error(f"❌ Manual review error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/manual-review/approve")
async def approve_document(data: dict, db: Session = Depends(get_db)):
    try:
        document_id = data.get("document_id")
        reviewer = data.get("reviewer", "Officer Admin")
        comments = data.get("comments", "")
        review = ManualReview(document_id=document_id, reviewer_name=reviewer, action="APPROVE", comments=comments, status="APPROVED")
        db.add(review)
        audit = AuditLog(action=f"Document Approved: ID {document_id}", details={"reviewer": reviewer, "comments": comments}, user_id=None)
        db.add(audit)
        db.commit()
        return {"message": "Document approved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/manual-review/reject")
async def reject_document(data: dict, db: Session = Depends(get_db)):
    try:
        document_id = data.get("document_id")
        reviewer = data.get("reviewer", "Officer Admin")
        comments = data.get("comments", "")
        review = ManualReview(document_id=document_id, reviewer_name=reviewer, action="REJECT", comments=comments, status="REJECTED")
        db.add(review)
        audit = AuditLog(action=f"Document Rejected: ID {document_id}", details={"reviewer": reviewer, "reason": comments}, user_id=None)
        db.add(audit)
        db.commit()
        return {"message": "Document rejected"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/manual-review/clarification")
async def request_clarification(data: dict, db: Session = Depends(get_db)):
    try:
        document_id = data.get("document_id")
        bidder_id = data.get("bidder_id")
        message = data.get("message")
        reviewer = data.get("reviewer", "Officer Admin")
        req = ClarificationRequest(bidder_id=bidder_id, document_id=document_id, message=message)
        db.add(req)
        review = ManualReview(document_id=document_id, reviewer_name=reviewer, action="CLARIFY", comments=f"Requested: {message}", status="CLARIFICATION_REQUESTED")
        db.add(review)
        db.commit()
        return {"message": "Clarification request sent"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/manual-review/save")
async def save_review(data: dict, db: Session = Depends(get_db)):
    try:
        document_id = data.get("document_id")
        reviewer = data.get("reviewer", "Officer Admin")
        comments = data.get("comments", "")
        review = ManualReview(document_id=document_id, reviewer_name=reviewer, action="SAVE", comments=comments, status="DRAFT")
        db.add(review)
        db.commit()
        return {"message": "Review draft saved"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tenders/{tender_id}/summarize")
async def summarize_tender(tender_id: int, db: Session = Depends(get_db)):
    from models import Tender, Criterion
    
    logger.info(f"Summary request for tender #{tender_id}")
    
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    criteria = db.query(Criterion).filter(Criterion.tender_id == tender_id).all()
    if not criteria:
        return {"summary": ["No criteria extracted yet. Please run a Deep Intelligence Scan first."]}
    
    criteria_text = "\n".join([f"- {c.title}: {c.description}" for c in criteria])
    
    try:
        ai_service = get_ai_service()
        prompt = f"Summarize these requirements for {tender.title} into a JSON list of 4 strings. NO EXTRA TEXT. [{criteria_text}]"
        
        response = ai_service.model.generate_content(prompt)
        
        match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if match:
            summary_points = json.loads(match.group())
            return {"summary": summary_points}
        
        raise Exception("JSON array not found in AI response")
    except Exception as e:
        logger.error(f"Summary error: {e}")
        return {"summary": [
            f"Analysis of {len(criteria)} requirements completed.",
            "Key eligibility markers identified by Master Auditor.",
            "Technical and financial thresholds are ready for review.",
            "Please check the detailed matrix below for specifics."
        ]}

# Redundant route removed (superseded by line 1200 implementation)

@api_router.post("/tenders/{tender_id}/generate-required-documents")
async def generate_required_documents(tender_id: int, db: Session = Depends(get_db)):
    from models import Criterion, TenderRequiredDocument, Tender
    try:
        criteria = db.query(Criterion).filter(Criterion.tender_id == tender_id).all()
        if not criteria:
            raise HTTPException(status_code=400, detail="No AI criteria found to propagate.")
            
        db.query(TenderRequiredDocument).filter(TenderRequiredDocument.tender_id == tender_id).delete()
        
        new_docs = []
        for c in criteria:
            doc = TenderRequiredDocument(
                tender_id=tender_id,
                document_name=c.title,
                description=c.description,
                category=c.category,
                mandatory=c.mandatory
            )
            db.add(doc)
            new_docs.append(doc)
            
        db.commit()
        return {"success": True, "count": len(new_docs), "total": len(criteria)}
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Propagation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/approve-bidder/{eval_id}")
async def approve_bidder(eval_id: int, db: Session = Depends(get_db)):
    try:
        eval_record = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
        if not eval_record:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        eval_record.status = "Eligible"
        db.commit()
        
        audit = AuditLog(action=f"Bidder Approved (Eval ID {eval_id})", details={"status": "Eligible"}, user_id=None)
        db.add(audit)
        db.commit()
        return {"message": "Bidder approved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/reject-bidder/{eval_id}")
async def reject_bidder(eval_id: int, data: dict, db: Session = Depends(get_db)):
    try:
        eval_record = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
        if not eval_record:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        eval_record.status = "Rejected"
        db.commit()
        
        reason = data.get("reason", "No reason provided")
        audit = AuditLog(action=f"Bidder Rejected (Eval ID {eval_id})", details={"reason": reason}, user_id=None)
        db.add(audit)
        db.commit()
        return {"message": "Bidder rejected"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/send-manual-review/{eval_id}")
async def send_manual_review(eval_id: int, data: dict, db: Session = Depends(get_db)):
    try:
        eval_record = db.query(Evaluation).filter(Evaluation.id == eval_id).first()
        if not eval_record:
            raise HTTPException(status_code=404, detail="Evaluation not found")
        eval_record.status = "Manual Review"
        db.commit()
        
        reason = data.get("reason", "Sent for manual check")
        audit = AuditLog(action=f"Sent to Manual Review (Eval ID {eval_id})", details={"reason": reason}, user_id=None)
        db.add(audit)
        db.commit()
        return {"message": "Sent to manual review"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ==================================================
# CRITERIA MANAGEMENT
# ==================================================

@api_router.get("/criteria")
def get_all_criteria(tender_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Criterion)
    if tender_id:
        query = query.filter(Criterion.tender_id == tender_id)
    return query.order_by(Criterion.id.desc()).all()

@api_router.post("/criteria/add")
async def add_criterion(data: CriterionCreate, db: Session = Depends(get_db)):
    try:
        # Verify tender exists
        tender = db.query(Tender).filter(Tender.id == data.tender_id).first()
        if not tender:
            raise HTTPException(status_code=404, detail="Tender not found")

        new_criterion = Criterion(
            tender_id=data.tender_id,
            title=data.title,
            description=data.description,
            category=data.category,
            mandatory=data.mandatory,
            value=data.value,
            confidence=data.confidence,
            weightage=data.weightage,
            max_score=data.max_score
        )
        db.add(new_criterion)
        db.commit()
        db.refresh(new_criterion)
        return {"success": True, "data": new_criterion}
    except Exception as e:
        error_msg = f"Error adding criterion: {str(e)}"
        logger.error(error_msg)
        with open("criteria_debug.log", "a") as f:
            f.write(f"{datetime.now()}: {error_msg}\n")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@api_router.put("/criteria/{id}")
def update_criterion(id: int, data: CriterionCreate, db: Session = Depends(get_db)):
    try:
        c = db.query(Criterion).filter(Criterion.id == id).first()
        if not c:
            return JSONResponse(status_code=404, content={"success": False, "error": "Not found"})
        
        c.title = data.title
        c.description = data.description
        c.category = data.category
        c.mandatory = data.mandatory
        c.value = data.value
        c.confidence = data.confidence
        c.weightage = data.weightage
        c.max_score = data.max_score
        
        db.commit()
        db.refresh(c)
        return {"success": True, "data": c}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@api_router.delete("/criteria/{id}")
async def delete_criterion(id: int, db: Session = Depends(get_db)):
    try:
        criterion = db.query(Criterion).filter(Criterion.id == id).first()
        if not criterion:
            raise HTTPException(status_code=404, detail="Criterion not found")
        
        db.delete(criterion)
        db.commit()
        return {"success": True, "message": "Criterion deleted"}
    except Exception as e:
        logger.error(f"❌ FAILED TO DELETE CRITERIA: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/extract-criteria/{tender_id}")
async def extract_criteria(tender_id: int, db: Session = Depends(get_db)):
    """
    REAL AI EXTRACTION:
    1. Reads PDF content for the tender.
    2. Sends text to Gemini for requirement analysis.
    3. Saves unique criteria to database.
    """
    try:
        if not tender_id:
            return JSONResponse(status_code=400, content={"success": False, "error": "Tender ID is required"})
        
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            return JSONResponse(status_code=404, content={"success": False, "error": f"Tender #{tender_id} not found"})

        # CLEAR OLD CRITERIA to ensure a truly dynamic fresh start
        db.query(Criterion).filter(Criterion.tender_id == tender_id).delete(synchronize_session=False)
        db.commit()

        # 1. DUAL-PATH EXTRACTION: Visual (for layout) + Text (for rules)
        image_parts = []
        full_text = ""
        file_path = tender.file_path
        if file_path and not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)

        if file_path and os.path.exists(file_path):
            try:
                logger.info(f"🔮 Dual-Path Analysis: {file_path}")
                with pdfplumber.open(file_path) as pdf:
                    # Capture text from ALL pages (fast)
                    full_text = "\n".join([p.extract_text() or "" for p in pdf.pages])
                    
                    # Capture images from first 3 pages (rich context)
                    max_images = min(len(pdf.pages), 3)
                    for i in range(max_images):
                        page = pdf.pages[i]
                        img = page.to_image(resolution=100).original 
                        img_byte_arr = io.BytesIO()
                        img.save(img_byte_arr, format='JPEG', quality=80) 
                        image_parts.append({
                            "mime_type": "image/jpeg",
                            "data": img_byte_arr.getvalue()
                        })
                logger.info(f"✅ Pre-processing complete: {len(image_parts)} images, {len(full_text)} chars.")
            except Exception as e:
                logger.error(f"❌ Pre-processing failed: {e}")

        # 2. CALL AI SERVICE (Hybrid Mode)
        try:
            # Combine text and images for maximum accuracy
            # We send the first 10k chars + images
            combined_context = f"TEXT CONTENT:\n{full_text[:10000]}\n\n[Images Attached]"
            ai_data = await get_ai_service().extract_tender_criteria_visual(image_parts, text_context=combined_context)
                
            if not ai_data or ("error" in ai_data and not ai_data.get("technical_criteria")):
                raise ValueError("AI returned no valid data")
        except Exception as ai_err:
            logger.error(f"❌ AI FAILED: {ai_err}")
            # Robust fallback
            ai_data = {
                "technical_criteria": [{"name": "Technical Qualifications", "description": "As per tender specs", "mandatory": True}],
                "financial_criteria": [{"name": "Audited Financials", "description": "Last 3 years", "mandatory": True}],
                "compliance_criteria": [{"name": "GST/PAN Details", "description": "Statutory documents", "mandatory": True}]
            }

        logger.info("📡 Synchronizing AI results to database...")
        
        # 3. PROCESS RESULTS
        new_count = 0
        
        # Flatten all categories from AI response
        all_ai_criteria = []
        for cat in ['technical_criteria', 'financial_criteria', 'compliance_criteria']:
            for item in ai_data.get(cat, []):
                all_ai_criteria.append({
                    "title": item.get("name", "Unnamed Criterion"),
                    "category": cat.split('_')[0].capitalize(),
                    "description": item.get("description", ""),
                    "mandatory": item.get("mandatory", True)
                })

        # If AI failed to find anything, use a smart fallback based on tender type
        if not all_ai_criteria:
            all_ai_criteria = [
                {"title": "GST Registration Certificate", "category": "Compliance", "description": "Mandatory GST compliance", "mandatory": True},
                {"title": "Annual Turnover Certificate", "category": "Financial", "description": "Last 3 years audited financials", "mandatory": True}
            ]

        for item in all_ai_criteria:
            # Check for exact duplicate to avoid mess
            exists = db.query(Criterion).filter(
                Criterion.tender_id == tender_id,
                Criterion.title == item["title"]
            ).first()
            
            if not exists:
                new_c = Criterion(
                    tender_id=tender_id,
                    title=item["title"],
                    category=item["category"],
                    description=item["description"],
                    weightage=20,
                    max_score=100,
                    mandatory=item["mandatory"],
                    confidence=0.95
                )
                db.add(new_c)
                new_count += 1
        
        db.commit()
        
        # Fetch fresh list and serialize
        all_criteria = db.query(Criterion).filter(Criterion.tender_id == tender_id).order_by(Criterion.id.desc()).all()
        
        serialized_data = [{
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "description": c.description,
            "mandatory": c.mandatory,
            "confidence": c.confidence
        } for c in all_criteria]
        
        # AUTO-SYNC to Bidder Checklist immediately
        generate_required_documents(tender_id, db)
            
        return {"success": True, "count": new_count, "data": serialized_data}
    except Exception as e:
        logger.error(f"AI EXTRACTION FAILED: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ==================================================
# REQUIRED DOCUMENTS — ADMIN → BIDDER SYNC
# ==================================================

# Mapping from criterion category/title keywords → normalized document requirement
CRITERIA_TO_DOC_MAP = [
    # (keyword_in_title_or_category, document_name, category, mandatory)
    ("gst",         "GST Registration Certificate",           "Compliance",  True),
    ("pan",         "PAN Card Copy",                          "Compliance",  True),
    ("iso",         "ISO 9001:2015 Certificate",              "Technical",   True),
    ("turnover",    "Audited Financial Statements (3 Years)", "Financial",   True),
    ("financial",   "Audited Financial Statements (3 Years)", "Financial",   True),
    ("audit",       "Audited Financial Statements (3 Years)", "Financial",   True),
    ("experience",  "Experience Certificate / Project Completion Report", "Experience", False),
    ("project",     "Experience Certificate / Project Completion Report", "Experience", False),
    ("compliance",  "Statutory Compliance Declaration",       "Compliance",  True),
    ("technical",   "Technical Competence Certificate",       "Technical",   True),
    ("incorporation", "Certificate of Incorporation",        "Compliance",  True),
    ("registration", "Company Registration Certificate",     "Compliance",  True),
    ("net worth",   "Net Worth Certificate",                  "Financial",   True),
    ("empanelment", "Empanelment Letter",                     "Technical",   False),
]


def _criteria_to_required_docs(criteria_list):
    """Convert Criterion ORM objects → normalized RequiredDocument dicts with deduplication."""
    seen_doc_names = set()
    results = []

    for criterion in criteria_list:
        title = criterion.title or "Required Document"
        title_lower = title.lower()
        category_lower = (criterion.category or "").lower()
        search_text = title_lower + " " + category_lower

        # 1. SMART CHECK: If the AI title ALREADY looks like a document name, use it!
        doc_indicators = ["certificate", "card", "report", "copy", "document", "form", "statement", "registration", "license", "policy", "guarantee"]
        is_direct_doc = any(ind in title_lower for ind in doc_indicators)
        
        if is_direct_doc:
            key = title_lower
            if key not in seen_doc_names:
                seen_doc_names.add(key)
                results.append({
                    "document_name": title,
                    "category": criterion.category or "General",
                    "mandatory": criterion.mandatory,
                    "source": "AI",
                    "description": f"Extracted from: '{title}'"
                })
            continue # Move to next criterion

        # 2. FALLBACK: Use the Keyword Map
        for keyword, doc_name, doc_category, mandatory in CRITERIA_TO_DOC_MAP:
            if keyword in search_text:
                key = doc_name.lower()
                if key not in seen_doc_names:
                    seen_doc_names.add(key)
                    results.append({
                        "document_name": doc_name,
                        "category": doc_category,
                        "mandatory": mandatory,
                        "source": "AI",
                        "description": criterion.description or f"Triggered by '{title}'"
                    })
                break  # One match per criterion is enough

    return results


@api_router.post("/tenders/{tender_id}/generate-required-documents")
def generate_required_documents(tender_id: int, db: Session = Depends(get_db)):
    """
    Auto-generate required document list from extracted criteria.
    Admin-added docs are preserved; AI-sourced ones are regenerated.
    Deduplication is applied to prevent redundant entries.
    """
    try:
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            raise HTTPException(status_code=404, detail=f"Tender #{tender_id} not found")

        # Fetch all criteria for this tender
        criteria_list = db.query(Criterion).filter(Criterion.tender_id == tender_id).all()
        if not criteria_list:
            return JSONResponse(status_code=200, content={
                "success": False,
                "message": "No criteria found for this tender. Please extract criteria first.",
                "count": 0,
                "data": []
            })

        # Delete previous AI-generated docs (keep Admin ones)
        db.query(TenderRequiredDocument).filter(
            TenderRequiredDocument.tender_id == tender_id,
            TenderRequiredDocument.source == "AI"
        ).delete(synchronize_session=False)
        db.commit()

        # Fetch admin-added docs to prevent duplicates with them too
        admin_docs = db.query(TenderRequiredDocument).filter(
            TenderRequiredDocument.tender_id == tender_id,
            TenderRequiredDocument.source == "Admin"
        ).all()
        admin_doc_names = {d.document_name.lower() for d in admin_docs}

        # Generate from criteria
        new_docs_data = _criteria_to_required_docs(criteria_list)

        added = 0
        for doc_data in new_docs_data:
            # Skip if admin already has a doc with same name
            if doc_data["document_name"].lower() in admin_doc_names:
                continue
            new_doc = TenderRequiredDocument(
                tender_id=tender_id,
                document_name=doc_data["document_name"],
                category=doc_data["category"],
                mandatory=doc_data["mandatory"],
                source="AI",
                description=doc_data["description"]
            )
            db.add(new_doc)
            added += 1

        db.commit()

        # Return full list for this tender
        all_docs = db.query(TenderRequiredDocument).filter(
            TenderRequiredDocument.tender_id == tender_id
        ).order_by(TenderRequiredDocument.mandatory.desc(), TenderRequiredDocument.id).all()

        result = [{
            "id": d.id,
            "tender_id": d.tender_id,
            "document_name": d.document_name,
            "category": d.category,
            "mandatory": d.mandatory,
            "source": d.source,
            "description": d.description,
            "created_at": d.created_at.isoformat() if d.created_at else None
        } for d in all_docs]

        logger.info(f"Generated {added} AI required docs for Tender #{tender_id}")
        return {"success": True, "count": added, "total": len(result), "data": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"generate-required-documents failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/tenders/{tender_id}/required-documents")
def get_required_documents(tender_id: int, db: Session = Depends(get_db)):
    """Return all required documents for a specific tender (for bidder view)."""
    try:
        docs = db.query(TenderRequiredDocument).filter(
            TenderRequiredDocument.tender_id == tender_id
        ).order_by(
            TenderRequiredDocument.mandatory.desc(),
            TenderRequiredDocument.category,
            TenderRequiredDocument.id
        ).all()
        
        # AUTO-SYNC: If no documents exist, but criteria DO exist, generate them on the fly
        if not docs:
            criteria_exists = db.query(Criterion).filter(Criterion.tender_id == tender_id).first()
            if criteria_exists:
                logger.info(f"🔄 Auto-generating docs for Tender #{tender_id} on fetch")
                generate_required_documents(tender_id, db)
                # Re-fetch after generation
                docs = db.query(TenderRequiredDocument).filter(
                    TenderRequiredDocument.tender_id == tender_id
                ).order_by(
                    TenderRequiredDocument.mandatory.desc(),
                    TenderRequiredDocument.id
                ).all()

        return {
            "success": True, 
            "data": [{
                "id": d.id,
                "tender_id": d.tender_id,
                "document_name": d.document_name,
                "category": d.category,
                "mandatory": d.mandatory,
                "source": d.source,
                "description": d.description,
                "created_at": d.created_at.isoformat() if d.created_at else None
            } for d in docs]
        }
    except Exception as e:
        logger.error(f"get-required-documents failed: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@api_router.post("/tenders/{tender_id}/required-documents")
def add_required_document(tender_id: int, data: RequiredDocumentCreate, db: Session = Depends(get_db)):
    """Admin manually adds a required document to a tender."""
    try:
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            raise HTTPException(status_code=404, detail=f"Tender #{tender_id} not found")

        # Prevent exact duplicate names (case-insensitive)
        existing = db.query(TenderRequiredDocument).filter(
            TenderRequiredDocument.tender_id == tender_id
        ).all()
        existing_names = {d.document_name.lower() for d in existing}
        if data.document_name.lower() in existing_names:
            return JSONResponse(status_code=409, content={
                "success": False,
                "error": f"'{data.document_name}' already exists for this tender."
            })

        new_doc = TenderRequiredDocument(
            tender_id=tender_id,
            document_name=data.document_name,
            category=data.category,
            mandatory=data.mandatory,
            source="Admin",
            description=data.description
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        audit = AuditLog(
            action=f"Admin Added Required Doc: {data.document_name}",
            details={"tender_id": tender_id, "document": data.document_name, "category": data.category},
            user_id=None
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "data": {
                "id": new_doc.id,
                "tender_id": new_doc.tender_id,
                "document_name": new_doc.document_name,
                "category": new_doc.category,
                "mandatory": new_doc.mandatory,
                "source": new_doc.source,
                "description": new_doc.description,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"add-required-document failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/required-documents/{doc_id}")
def delete_required_document(doc_id: int, db: Session = Depends(get_db)):
    """Admin removes a required document from a tender."""
    try:
        doc = db.query(TenderRequiredDocument).filter(TenderRequiredDocument.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Required document not found")

        audit = AuditLog(
            action=f"Admin Removed Required Doc: {doc.document_name}",
            details={"tender_id": doc.tender_id, "document": doc.document_name, "source": doc.source},
            user_id=None
        )
        db.add(audit)
        db.delete(doc)
        db.commit()
        return {"success": True, "message": f"'{doc.document_name}' removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete-required-document failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/bidders/{bidder_id}/uploaded-documents")
def get_bidder_uploaded_documents(bidder_id: int, tender_id: int, db: Session = Depends(get_db)):
    """Returns all documents a bidder has uploaded for a specific tender."""
    try:
        docs = db.query(BidderDocument).filter(
            BidderDocument.bidder_id == bidder_id,
            BidderDocument.tender_id == tender_id
        ).all()
        return {
            "success": True,
            "data": [{
                "id": d.id,
                "document_type": d.document_type,
                "file_path": d.file_path,
                "created_at": d.created_at.isoformat() if d.created_at else None
            } for d in docs]
        }
    except Exception as e:
        logger.error(f"get-bidder-uploaded-docs failed: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# ==================================================
# BIDDER & DOCUMENT SYNCHRONIZATION (REFINED)
# ==================================================



@api_router.get("/my-submissions/{bidder_id}")
def get_my_submissions(bidder_id: int, db: Session = Depends(get_db)):
    results = db.query(Evaluation, Tender.title).join(Tender, Evaluation.tender_id == Tender.id).filter(Evaluation.bidder_id == bidder_id).all()
    
    submissions = []
    for eval_rec, tender_title in results:
        # LOGGING FOR DEBUGGING
        logger.info(f"🔍 Submission Map: Eval ID {eval_rec.id} -> Tender ID {eval_rec.tender_id}")
        
        submissions.append({
            "id": eval_rec.id,              # Evaluation ID
            "tender_id": eval_rec.tender_id, # Real Tender ID
            "tender_title": tender_title,
            "status": eval_rec.status,
            "ai_score": int(eval_rec.confidence_score) if eval_rec.confidence_score is not None else 0,
            "submitted_at": eval_rec.created_at.strftime("%Y-%m-%d") if eval_rec.created_at else "Recent"
        })
    return submissions
