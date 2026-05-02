from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from database.base import Base
import datetime

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    tender_number = Column(String, unique=True)
    file_path = Column(String)
    criteria = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active") # active, closed, under_evaluation
