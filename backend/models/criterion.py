from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from database.base import Base
import datetime

class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    category = Column(String) # Financial, Technical, Compliance, Experience, Other
    mandatory = Column(Boolean, default=True)
    value = Column(String) # Expected value/threshold
    confidence = Column(Float, default=0.9)
    
    weightage = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationship to tender
    tender = relationship("Tender", back_populates="criteria_list")

# Update Tender model to include relationship
# We'll do this in a separate step if needed, or just use the foreign key.
