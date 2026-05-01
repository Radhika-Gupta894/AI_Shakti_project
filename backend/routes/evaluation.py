from fastapi import APIRouter, Depends, HTTPException
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
