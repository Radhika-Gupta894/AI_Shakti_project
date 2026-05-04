from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from database.base import Base
import datetime

class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    tender_number = Column(String, unique=True)
    file_path = Column(String)
    criteria = Column(JSON) # Legacy/Raw JSON from AI
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active") # active, closed, under_evaluation

    # New structured criteria
    criteria_list = relationship("Criterion", back_populates="tender", cascade="all, delete-orphan")
