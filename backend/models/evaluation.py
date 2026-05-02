from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from database.base import Base
import datetime

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    criterion = Column(String, nullable=True) # Making it optional to match original
    status = Column(String) # pass, fail, pending
    confidence_score = Column(Float)
    risk_level = Column(String) # LOW, MEDIUM, HIGH
    reason = Column(Text)
    detailed_report = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bidder = relationship("Bidder", backref="evaluations")
    tender = relationship("Tender", backref="evaluations")
