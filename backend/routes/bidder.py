from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
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
