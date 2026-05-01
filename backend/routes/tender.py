from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
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
