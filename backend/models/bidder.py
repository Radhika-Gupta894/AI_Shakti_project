from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from database.base import Base
import datetime

class Bidder(Base):
    __tablename__ = "bidders"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True, nullable=False)
    gst_number = Column(String, unique=True, nullable=False)
    turnover = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class BidderDocument(Base):
    __tablename__ = "bidder_documents"
    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    document_type = Column(String) # 'GST', 'ISO', 'Financial', 'Experience'
    file_path = Column(String)
    extracted_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
