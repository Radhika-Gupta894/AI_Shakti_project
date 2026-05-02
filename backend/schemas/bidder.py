from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BidderBase(BaseModel):
    company_name: str
    gst_number: str
    turnover: Optional[float] = None

class BidderCreate(BidderBase):
    pass

class BidderResponse(BidderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
