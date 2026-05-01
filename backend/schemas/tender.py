from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime

class TenderBase(BaseModel):
    title: str
    reference_no: str

class TenderCreate(TenderBase):
    pass

class TenderResponse(TenderBase):
    id: int
    document_path: str
    extracted_criteria: Optional[Dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

class CriteriaExtractionResponse(BaseModel):
    technical: List[str]
    financial: List[str]
    compliance: List[str]
    mandatory: List[str]
