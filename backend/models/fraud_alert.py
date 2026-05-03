from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Float
from database.base import Base
import datetime

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    bidder1_id = Column(Integer, ForeignKey("bidders.id"), nullable=True)
    bidder2_id = Column(Integer, ForeignKey("bidders.id"), nullable=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=True)
    
    alert_type = Column(String) # COLLUSION, SHELL_COMPANY, DUPLICATE_DOCS
    risk_level = Column(String) # Low, Medium, High
    risk_score = Column(Float)
    
    alert_reason = Column(Text)
    details = Column(JSON)
    
    status = Column(String, default="NEW") # NEW, FLAGGED, RESOLVED, DISMISSED
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
