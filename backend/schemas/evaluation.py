from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EvaluationBase(BaseModel):
    criterion_name: str
    required_value: str
    found_value: str
    source_document: str
    status: str
    confidence_score: float
    reason: str

class EvaluationResponse(EvaluationBase):
    id: int
    bidder_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ManualReviewRequest(BaseModel):
    evaluation_id: int
    override_status: str # PASS or FAIL
    reviewer_notes: str
