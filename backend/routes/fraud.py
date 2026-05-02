from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from services.fraud_service import FraudDetectionService
from typing import List

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_fraud_alerts(db: Session = Depends(get_db)):
    """
    Get all detected fraud patterns and suspicious bidder relationships.
    """
    return FraudDetectionService.detect_fraud_patterns(db)

@router.get("/summary")
def get_fraud_summary(db: Session = Depends(get_db)):
    """
    Get a summary of fraud statistics for the dashboard cards.
    """
    alerts = FraudDetectionService.detect_fraud_patterns(db)
    
    summary = {
        "total_alerts": len(alerts),
        "high_risk": len([a for a in alerts if a["risk_level"] == "High"]),
        "medium_risk": len([a for a in alerts if a["risk_level"] == "Medium"]),
        "low_risk": len([a for a in alerts if a["risk_level"] == "Low"]),
    }
    return summary
