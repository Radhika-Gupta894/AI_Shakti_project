import os
import logging
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_schema():
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found in .env")
        return

    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # 1. Handle 'evaluations' table
            logger.info("Checking 'evaluations' table...")
            
            # Check for 'confidence' column
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='evaluations' AND column_name='confidence'"))
            if not res.fetchone():
                logger.info("Adding 'confidence' column to 'evaluations'...")
                conn.execute(text("ALTER TABLE evaluations ADD COLUMN confidence FLOAT DEFAULT 0"))
                conn.commit()

            # Check for 'total_score' column
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='evaluations' AND column_name='total_score'"))
            if not res.fetchone():
                logger.info("Adding 'total_score' column to 'evaluations'...")
                conn.execute(text("ALTER TABLE evaluations ADD COLUMN total_score FLOAT DEFAULT 0"))
                conn.commit()

            # Remove old 'confidence_score' if it exists and we want to clean up
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='evaluations' AND column_name='confidence_score'"))
            if res.fetchone():
                logger.info("Cleaning up old 'confidence_score' column...")
                # We could drop it, but it's safer to keep it or just leave it for now.
                # conn.execute(text("ALTER TABLE evaluations DROP COLUMN confidence_score"))
                pass

            # 2. Handle 'evaluation_details' table (Create if missing)
            logger.info("Ensuring 'evaluation_details' table exists...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS evaluation_details (
                    id SERIAL PRIMARY KEY,
                    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
                    criterion_id INTEGER REFERENCES criteria(id) ON DELETE CASCADE,
                    status VARCHAR(50),
                    bidder_value TEXT,
                    confidence FLOAT,
                    source VARCHAR(255),
                    explanation TEXT,
                    score FLOAT DEFAULT 0
                )
            """))
            conn.commit()
            
            logger.info("✅ Schema synchronization complete.")

    except Exception as e:
        logger.error(f"❌ Error fixing schema: {e}")

if __name__ == "__main__":
    fix_schema()
