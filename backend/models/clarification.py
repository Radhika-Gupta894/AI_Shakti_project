from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from database.base import Base
import datetime

class ClarificationRequest(Base):
    __tablename__ = "clarification_requests"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    document_id = Column(Integer, ForeignKey("bidder_documents.id"))
    message = Column(Text, nullable=False)
    status = Column(String, default="OPEN") # OPEN, RESOLVED
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
