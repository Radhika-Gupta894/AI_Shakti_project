from sqlalchemy.orm import Session
from sqlalchemy import func
from models.bidder import Bidder, BidderDocument
from difflib import SequenceMatcher
from typing import List, Dict
import os

from models.fraud_alert import FraudAlert
from models.audit_log import AuditLog
from datetime import datetime

class FraudDetectionService:
    @staticmethod
    def get_similarity(a: str, b: str) -> float:
        """Calculate string similarity ratio."""
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

    @staticmethod
    def run_full_scan(db: Session) -> Dict:
        """
        Runs the full fraud detection logic and saves results to the database.
        """
        try:
            # 1. Generate patterns
            patterns = FraudDetectionService.detect_fraud_patterns(db)
            
            # 2. Clear old NEW alerts to avoid duplicates
            db.query(FraudAlert).filter(FraudAlert.status == "NEW").delete()
            
            # 3. Save new alerts
            new_alerts_count = 0
            for p in patterns:
                alert = FraudAlert(
                    bidder1_id=p.get('company1_id'),
                    bidder2_id=p.get('company2_id'),
                    alert_type="COLLUSION",
                    risk_level=p.get('risk_level'),
                    risk_score=p.get('risk_score'),
                    alert_reason=", ".join(p.get('reasons', [])),
                    details=p.get('details', {}),
                    status="NEW"
                )
                db.add(alert)
                new_alerts_count += 1
            
            # 4. Log the scan
            audit = AuditLog(
                action="System Fraud Scan",
                details={"alerts_found": new_alerts_count, "timestamp": str(datetime.now())},
                user_id=None
            )
            db.add(audit)
            db.commit()
            
            return {
                "message": f"Scan complete. {new_alerts_count} potential issues flagged.",
                "count": new_alerts_count
            }
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def detect_fraud_patterns(db: Session) -> List[Dict]:
        """
        Analyze all bidders to find suspicious relationships.
        """
        bidders = db.query(Bidder).all()
        all_docs = db.query(BidderDocument).all()
        docs_by_bidder = {}
        for d in all_docs:
            if d.bidder_id not in docs_by_bidder:
                docs_by_bidder[d.bidder_id] = []
            docs_by_bidder[d.bidder_id].append(d)
            
        results = []

        for i in range(len(bidders)):
            for j in range(i + 1, len(bidders)):
                b1 = bidders[i]
                b2 = bidders[j]
                
                risk_score = 0
                reasons = []
                
                if b1.gst_number and b2.gst_number and b1.gst_number == b2.gst_number:
                    risk_score += 80
                    reasons.append("Same GST number")
                
                if b1.phone and b2.phone and b1.phone == b2.phone:
                    risk_score += 40
                    reasons.append("Same phone number")
                
                if b1.address and b2.address and b1.address.lower().strip() == b2.address.lower().strip():
                    risk_score += 30
                    reasons.append("Same physical address")
                
                similarity = FraudDetectionService.get_similarity(b1.company_name, b2.company_name)
                if similarity > 0.8:
                    risk_score += 20
                    reasons.append(f"Highly similar company names ({int(similarity*100)}% match)")
 
                docs1 = docs_by_bidder.get(b1.id, [])
                docs2 = docs_by_bidder.get(b2.id, [])
                
                shared_docs = []
                for d1 in docs1:
                    if not d1.file_path:
                        continue
                    for d2 in docs2:
                        if not d2.file_path:
                            continue
                        d1_name = os.path.basename(d1.file_path)
                        d2_name = os.path.basename(d2.file_path)
                        if (d1.file_hash and d1.file_hash == d2.file_hash) or (d1_name == d2_name):
                            shared_docs.append(d1_name)
                
                if shared_docs:
                    risk_score += 25
                    reasons.append(f"Duplicate documents uploaded: {', '.join(list(set(shared_docs)))}")

                risk_level = "Low"
                if risk_score >= 80:
                    risk_level = "High"
                elif risk_score >= 40:
                    risk_level = "Medium"

                if risk_score > 0:
                    results.append({
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

        return sorted(results, key=lambda x: x['risk_score'], reverse=True)
