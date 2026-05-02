from sqlalchemy.orm import Session
from sqlalchemy import func
from models.bidder import Bidder, BidderDocument
from difflib import SequenceMatcher
from typing import List, Dict

class FraudDetectionService:
    @staticmethod
    def get_similarity(a: str, b: str) -> float:
        """Calculate string similarity ratio."""
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

    @staticmethod
    def detect_fraud_patterns(db: Session) -> List[Dict]:
        """
        Analyze all bidders to find suspicious relationships.
        Returns a list of potential fraud pairs with risk scores.
        """
        bidders = db.query(Bidder).all()
        results = []

        # Iterate through pairs of bidders to find relationships
        for i in range(len(bidders)):
            for j in range(i + 1, len(bidders)):
                b1 = bidders[i]
                b2 = bidders[j]
                
                risk_score = 0
                reasons = []
                
                # 1. Same GST Detection (80 points)
                if b1.gst_number and b2.gst_number and b1.gst_number == b2.gst_number:
                    risk_score += 80
                    reasons.append("Same GST number")
                
                # 2. Same Phone Number (40 points)
                if b1.phone and b2.phone and b1.phone == b2.phone:
                    risk_score += 40
                    reasons.append("Same phone number")
                
                # 3. Same Address (30 points)
                if b1.address and b2.address and b1.address.lower().strip() == b2.address.lower().strip():
                    risk_score += 30
                    reasons.append("Same physical address")
                
                # 4. Similar Company Names (20 points if > 80%)
                similarity = FraudDetectionService.get_similarity(b1.company_name, b2.company_name)
                if similarity > 0.8:
                    risk_score += 20
                    reasons.append(f"Highly similar company names ({int(similarity*100)}% match)")

                # 5. Duplicate Documents (Filename or Hash)
                # Check for shared document hashes if available
                docs1 = db.query(BidderDocument).filter(BidderDocument.bidder_id == b1.id).all()
                docs2 = db.query(BidderDocument).filter(BidderDocument.bidder_id == b2.id).all()
                
                shared_docs = []
                for d1 in docs1:
                    for d2 in docs2:
                        # Check by hash first, then filename as fallback
                        if (d1.file_hash and d1.file_hash == d2.file_hash) or (d1.file_path.split('/')[-1] == d2.file_path.split('/')[-1]):
                            shared_docs.append(d1.file_path.split('/')[-1])
                
                if shared_docs:
                    risk_score += 25
                    reasons.append(f"Duplicate documents uploaded: {', '.join(shared_docs)}")

                # Determine Risk Level
                risk_level = "Low"
                if risk_score >= 80:
                    risk_level = "High"
                elif risk_score >= 40:
                    risk_level = "Medium"

                # Only include in results if there is some risk
                if risk_score > 0:
                    results.append({
                        "id": f"{b1.id}_{b2.id}",
                        "company1": b1.company_name,
                        "company1_id": b1.id,
                        "company2": b2.company_name,
                        "company2_id": b2.id,
                        "risk_score": risk_score,
                        "risk_level": risk_level,
                        "reasons": reasons,
                        "details": {
                            "gst": b1.gst_number if b1.gst_number == b2.gst_number else None,
                            "phone": b1.phone if b1.phone == b2.phone else None,
                            "similarity": similarity
                        }
                    })

        # Sort by highest risk score first
        return sorted(results, key=lambda x: x['risk_score'], reverse=True)
