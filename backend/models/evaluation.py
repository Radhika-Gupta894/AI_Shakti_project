from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from database.base import Base
import datetime

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    status = Column(String) # Eligible, Not Eligible, Needs Manual Review
    confidence = Column(Float)
    total_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    bidder = relationship("Bidder", backref="evaluations")
    tender = relationship("Tender", backref="evaluations")
    details = relationship("EvaluationDetail", back_populates="evaluation", cascade="all, delete-orphan")

class EvaluationDetail(Base):
    __tablename__ = "evaluation_details"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    criterion_id = Column(Integer, ForeignKey("criteria.id"))
    status = Column(String) # PASS, FAIL, REVIEW
    bidder_value = Column(Text)
    confidence = Column(Float)
    source = Column(String) # e.g. "Financial Statement Page 4"
    explanation = Column(Text)
    score = Column(Float, default=0.0)

    # Relationships
    evaluation = relationship("Evaluation", back_populates="details")
    criterion = relationship("Criterion", backref="evaluation_details")
