from typing import List, Dict
from utils.logger import get_logger

logger = get_logger(__name__)

def evaluate_bidder(bidder_data: str, criteria: dict) -> List[Dict]:
    """
    Compares extracted bidder text against extracted criteria.
    In production, this would use LLM for semantic matching.
    """
    logger.info("Evaluating bidder against tender criteria...")
    
    evaluations = []
    
    # Mock evaluation logic
    evaluations.append({
        "criterion_name": "Turnover",
        "required_value": "₹5 Cr",
        "found_value": "₹6.2 Cr",
        "source_document": "Financial_Statement.pdf",
        "status": "PASS",
        "confidence_score": 95.0,
        "reason": "Turnover exceeds threshold of ₹5 Cr"
    })
    
    evaluations.append({
        "criterion_name": "ISO 27001",
        "required_value": "Valid ISO 27001 Certificate",
        "found_value": "Certificate found but expiry date unclear",
        "source_document": "Certificates.pdf",
        "status": "REVIEW",
        "confidence_score": 45.0,
        "reason": "OCR confidence low on expiry date. Human review required."
    })
    
    return evaluations
