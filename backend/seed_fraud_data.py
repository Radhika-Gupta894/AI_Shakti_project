import os
from sqlalchemy.orm import Session
from database.db import SessionLocal, engine
from models.bidder import Bidder, BidderDocument
from database.base import Base

from models.tender import Tender

def seed_fraud_data():
    # Force refresh the schema using CASCADE to handle dependencies
    print("🧹 Force cleaning old schema (CASCADE)...")
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS fraud_alerts CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS evaluations CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS bidder_documents CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS bidders CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS tenders CASCADE"))
        conn.commit()
    
    print("🏗️ Creating new schema with fraud detection fields...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 0. Create a dummy tender to satisfy foreign keys
    print("📋 Creating dummy tender...")
    dummy_tender = Tender(
        id=1,
        title="Main Modernization Project 2026",
        description="Major infrastructure upgrade for regional headquarters."
    )
    db.add(dummy_tender)
    db.commit()
    
    # Sample Bidders with suspicious relationships
    suspicious_bidders = [
        # Pair 1: Same GST (High Risk)
        {
            "company_name": "Modern Infra Solutions Ltd",
            "gst_number": "27AAACR1234A1Z1",
            "phone": "9876543210",
            "address": "123, Nariman Point, Mumbai",
            "email": "contact@moderninfra.com"
        },
        {
            "company_name": "Modern Infrastructure Pvt Ltd",
            "gst_number": "27AAACR1234A1Z1", # Shared GST
            "phone": "9876543210", # Shared Phone
            "address": "Plot 45, MIDC, Andheri, Mumbai",
            "email": "admin@moderninfra.com"
        },
        
        # Pair 2: Same Address & Similar Name (Medium/High Risk)
        {
            "company_name": "Standard Builders",
            "gst_number": "27BBBCR5678B1Z2",
            "phone": "9988776655",
            "address": "Suite 505, Tech Park, Bangalore",
            "email": "info@standardbuilders.in"
        },
        {
            "company_name": "Standard Building Group",
            "gst_number": "27CCCR9012C1Z3",
            "phone": "9988776654", # Slightly different
            "address": "Suite 505, Tech Park, Bangalore", # Identical Address
            "email": "info@standardgroup.in"
        },
        
        # Pair 3: Similar Names (Low/Medium Risk)
        {
            "company_name": "Global Tech Services",
            "gst_number": "27DDDR3456D1Z4",
            "phone": "9123456789",
            "address": "Sector 5, Gurgaon",
            "email": "hr@globaltech.com"
        },
        {
            "company_name": "Global Technical Services", # Similar Name
            "gst_number": "27EEER7890E1Z5",
            "phone": "9123456780",
            "address": "Sector 12, Gurgaon",
            "email": "sales@globaltech.co.in"
        }
    ]

    print("🌱 Seeding suspicious bidder data...")
    
    for bidder_data in suspicious_bidders:
        # Check if already exists to avoid duplicates
        existing = db.query(Bidder).filter(Bidder.company_name == bidder_data["company_name"]).first()
        if not existing:
            new_bidder = Bidder(**bidder_data)
            db.add(new_bidder)
            print(f"Added: {bidder_data['company_name']}")
    
    db.commit()
    
    # Add some duplicate documents for Pair 1
    b1 = db.query(Bidder).filter(Bidder.company_name == "Modern Infra Solutions Ltd").first()
    b2 = db.query(Bidder).filter(Bidder.company_name == "Modern Infrastructure Pvt Ltd").first()
    
    if b1 and b2:
        doc1 = BidderDocument(
            bidder_id=b1.id,
            tender_id=1, # Assuming tender 1 exists
            document_type="ISO_CERT",
            file_path="uploads/iso_cert_2024.pdf",
            file_hash="hash_abc_123"
        )
        doc2 = BidderDocument(
            bidder_id=b2.id,
            tender_id=1,
            document_type="ISO_CERT",
            file_path="uploads/iso_cert_2024.pdf", # Same filename fallback
            file_hash="hash_abc_123" # Identical hash
        )
        db.add(doc1)
        db.add(doc2)
        db.commit()
        print("✅ Added duplicate documents for verification")

    db.close()
    print("✨ Seeding complete!")

if __name__ == "__main__":
    seed_fraud_data()
