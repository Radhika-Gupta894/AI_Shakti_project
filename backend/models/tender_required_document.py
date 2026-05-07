from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.base import Base
import datetime


class TenderRequiredDocument(Base):
    """
    Stores the normalized list of required documents for each tender.
    Populated from AI-extracted criteria and/or admin-added requirements.
    Strictly scoped per tender_id — no cross-tender sharing.
    """
    __tablename__ = "tender_required_documents"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)

    document_name = Column(String, nullable=False)
    category = Column(String, default="Compliance")  # Compliance | Financial | Technical | Experience
    mandatory = Column(Boolean, default=True)
    source = Column(String, default="AI")  # AI | Admin
    description = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
