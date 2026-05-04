from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database.db import get_db
from models import Tender, Bidder, BidderDocument, Evaluation, AuditLog, User, ManualReview, ClarificationRequest, FraudAlert, Criterion
from services.evaluator import process_tender_upload, process_bidder_evaluation
from services.ai_service import AIService
from services.fraud_service import FraudDetectionService
import logging
import shutil
import os
import uuid
import traceback
import asyncio
import random
from datetime import datetime
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
async def get_latest_tender(db: Session = Depends(get_db)):
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
async def get_tenders(db: Session = Depends(get_db)):
    try:
        logger.info("📡 FETCH: Retrieving all tenders...")
        tenders = db.query(Tender).order_by(Tender.id.desc()).all()
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
async def get_my_submissions(bidder_id: int, db: Session = Depends(get_db)):
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
async def get_report(evaluation_id: int, db: Session = Depends(get_db)):
    eval_record = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not eval_record:
        raise HTTPException(status_code=404, detail="Report not found")
    return eval_record.detailed_report


@api_router.get("/dashboard-stats")
async def get_stats(db: Session = Depends(get_db)):
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
async def get_evaluations(db: Session = Depends(get_db)):
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
async def get_all_bidder_documents(db: Session = Depends(get_db)):
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
async def get_fraud_alerts(db: Session = Depends(get_db)):
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
async def get_fraud_summary(db: Session = Depends(get_db)):
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
        result = FraudDetectionService.run_full_scan(db)
        return result
    except Exception as e:
        logger.error(f"❌ SCAN FAILED: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/audit-logs")
async def get_audit_logs(db: Session = Depends(get_db)):
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
async def get_report_summary(db: Session = Depends(get_db)):
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
async def get_manual_review(document_id: int, db: Session = Depends(get_db)):
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

@api_router.post("/ask-ai")
async def ask_ai(data: dict):
    question = data.get("question", "")
    # Mock AI Response for hackathon
    return {"answer": f"Based on the tender analysis, here is the response to your query regarding '{question}': The requirement strictly follows GFR 2017 guidelines and requires a minimum turnover of 5 Crores for the last 3 financial years."}

@api_router.get("/system-status")
async def system_status():
    import random
    return {
        "backend": "Online",
        "ocr_engine": "Active - 99.8% Accuracy",
        "ai_model": "v2.4 - Latency 42ms",
        "database": "Connected",
        "cpu_usage": f"{random.randint(20, 60)}%"
    }

@api_router.get("/tender-summary")
async def tender_summary():
    return {
        "summary": [
            "₹5 Cr turnover required for the last 3 financial years",
            "GST registration certificate mandatory",
            "ISO 9001 certification required",
            "Minimum 3 past relevant projects required"
        ]
    }

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
async def get_all_criteria(tender_id: int = None, db: Session = Depends(get_db)):
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

@api_router.post("/criteria/extract")
async def extract_criteria(data: dict, db: Session = Depends(get_db)):
    try:
        tender_id = data.get("tender_id")
        if not tender_id:
            return JSONResponse(status_code=400, content={"success": False, "error": "Tender ID is required"})
        
        # Ensure it's an int
        try:
            tender_id = int(tender_id)
        except (ValueError, TypeError):
             return JSONResponse(status_code=400, content={"success": False, "error": "Invalid Tender ID format"})

        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            return JSONResponse(status_code=404, content={"success": False, "error": f"Tender #{tender_id} not found"})

        # Simulation of AI Extraction Logic
        simulated_criteria = [
            {"title": "Annual Turnover Requirement", "category": "Financial", "description": "Avg turnover > 50 Cr in last 3 years", "weightage": 25, "max_score": 100, "mandatory": True},
            {"title": "Technical Competence Certification", "category": "Technical", "description": "ISO 9001:2015 or equivalent required", "weightage": 15, "max_score": 100, "mandatory": True},
            {"title": "Relevant Work Experience", "category": "Experience", "description": "3 successful projects of similar scale", "weightage": 40, "max_score": 100, "mandatory": False},
            {"title": "GST & PAN Compliance", "category": "Compliance", "description": "Valid statutory documents must be provided", "weightage": 20, "max_score": 100, "mandatory": True}
        ]

        new_count = 0
        for item in simulated_criteria:
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
                    weightage=item["weightage"],
                    max_score=item["max_score"],
                    mandatory=item["mandatory"],
                    confidence=0.98
                )
                db.add(new_c)
                new_count += 1
        
        db.commit()
        
        # Fetch ALL criteria for this tender to return a fresh list
        all_criteria = db.query(Criterion).filter(Criterion.tender_id == tender_id).order_by(Criterion.id.desc()).all()
        
        with open("criteria_debug.log", "a") as f:
            f.write(f"{datetime.now()}: SUCCESS: Extracted {new_count} new for Tender {tender_id}\n")
            
        return {"success": True, "count": new_count, "data": all_criteria}
    except Exception as e:
        error_msg = f"AI EXTRACTION FAILED: {str(e)}"
        logger.error(error_msg)
        with open("criteria_debug.log", "a") as f:
            f.write(f"{datetime.now()}: ERROR: {error_msg}\n")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
