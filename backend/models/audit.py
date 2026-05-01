from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from database.config import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
