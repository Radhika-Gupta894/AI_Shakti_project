from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from database.base import Base
import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
