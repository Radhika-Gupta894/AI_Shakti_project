from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
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
