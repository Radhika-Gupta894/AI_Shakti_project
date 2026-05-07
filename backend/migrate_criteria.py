import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("DATABASE_URL not found in .env")
    exit(1)

# Fix for pg8000 sslmode if present
if "sslmode=" in database_url and "postgresql+pg8000" in database_url:
    database_url = database_url.split("?")[0]

engine = create_engine(database_url)

commands = [
    "ALTER TABLE criteria ADD COLUMN IF NOT EXISTS weightage FLOAT DEFAULT 0.0;",
    "ALTER TABLE criteria ADD COLUMN IF NOT EXISTS max_score FLOAT DEFAULT 100.0;"
]

with engine.connect() as conn:
    for cmd in commands:
        try:
            print(f"Executing: {cmd}")
            conn.execute(text(cmd))
            conn.commit()
            print("Success.")
        except Exception as e:
            print(f"Failed: {e}")
