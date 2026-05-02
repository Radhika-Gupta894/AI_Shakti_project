from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Float
from database.base import Base
import datetime

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    alert_type = Column(String)
    risk_level = Column(String) # low, medium, high
    risk_score = Column(Float)
    alert_reason = Column(Text)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
