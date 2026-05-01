from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from database.config import Base

class Tender(Base):
    __tablename__ = "tenders"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    reference_no = Column(String, unique=True, index=True)
    document_path = Column(String)
    extracted_criteria = Column(JSON) # Store Technical, Financial, Compliance, Mandatory
    created_at = Column(DateTime(timezone=True), server_default=func.now())
