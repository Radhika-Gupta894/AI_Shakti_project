from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from database.base import Base
import datetime

class ManualReview(Base):
    __tablename__ = "manual_reviews"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("bidder_documents.id"))
    reviewer_name = Column(String, nullable=False)
    action = Column(String) # APPROVE, REJECT, CLARIFY, SAVE
    comments = Column(Text)
    status = Column(String, default="PENDING")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AI Metadata for reference
    ocr_confidence = Column(Integer)
    extracted_data = Column(JSON)
