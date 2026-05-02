import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from backend.database.base import Base
from backend.models.tender import Tender
from backend.models.bidder import Bidder
from backend.models.user import User

# Load environment variables
load_dotenv(dotenv_path="backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

def seed_data():
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in .env")
        return

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Check if already seeded
        if db.query(User).filter(User.username == 'admin').first():
            print("Database already seeded.")
            return

        # Insert Dummy Data
        admin_user = User(
            name="Administrator",
            username="admin",
            email="admin@shakti.gov.in",
            password="admin_password_placeholder", # In real app, use hashed password
            role="admin"
        )
        db.add(admin_user)
        
        criteria = {
            "technical_criteria": [
                {"name": "Experience", "description": "5 years in tactical gear", "mandatory": True},
                {"name": "ISO 9001", "description": "Valid certification", "mandatory": True}
            ],
            "financial_criteria": [
                {"name": "Turnover", "description": "50 Cr average", "mandatory": True}
            ],
            "compliance_criteria": [],
            "deadlines": []
        }
        
        new_tender = Tender(
            title="Tactical Gear Procurement 2026",
            tender_number="TDR-2026-001",
            description="Procurement of high-grade tactical gear for CRPF units.",
            criteria=criteria,
            status="active"
        )
        db.add(new_tender)
        
        bidder1 = Bidder(company_name="Bharat Electronics Ltd", gst_number="29AAAAA0000A1Z5", turnover=120.5)
        bidder2 = Bidder(company_name="Modern Garments Pvt", gst_number="27BBBBB1111B2Z6", turnover=45.0)
        db.add(bidder1)
        db.add(bidder2)
        
        db.commit()
        print("PostgreSQL Database seeded with dummy data successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
