from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime
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
