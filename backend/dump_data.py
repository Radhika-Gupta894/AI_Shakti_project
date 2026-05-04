import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def dump_data():
    try:
        with engine.connect() as conn:
            print("--- Tenders ---")
            tenders = conn.execute(text("SELECT id, title FROM tenders")).fetchall()
            for t in tenders:
                print(f"ID: {t[0]}, Title: {t[1]}")
            
            print("\n--- Criteria ---")
            criteria = conn.execute(text("SELECT id, tender_id, title FROM criteria LIMIT 5")).fetchall()
            for c in criteria:
                print(f"ID: {c[0]}, TenderID: {c[1]}, Title: {c[2]}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_data()
