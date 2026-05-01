from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from database.config import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # 'admin', 'bidder'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Tender(Base):
    __tablename__ = "tenders"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    tender_number = Column(String, unique=True)
    file_path = Column(String)
    criteria = Column(JSON) # Extracted criteria
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active") # 'active', 'closed', 'evaluating'

class Bidder(Base):
    __tablename__ = "bidders"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    registration_number = Column(String, unique=True)
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

class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    status = Column(String) # 'PASS', 'FAIL', 'REVIEW'
    confidence_score = Column(Float)
    risk_level = Column(String) # 'LOW', 'MEDIUM', 'HIGH'
    detailed_report = Column(JSON) # Explainability data
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"
    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"))
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    alert_type = Column(String)
    risk_score = Column(Float)
    details = Column(JSON)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
