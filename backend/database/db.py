from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# -----------------------------------
# Logging Configuration
# -----------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# -----------------------------------
# Load .env File Explicitly
# -----------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"

load_dotenv(dotenv_path=env_path)

logger.info(f"📄 Loading .env from: {env_path}")

# -----------------------------------
# Database URL
# -----------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ DATABASE_URL not found in environment variables!")
    raise ValueError("DATABASE_URL environment variable is not set.")

# Hide password in logs for security
safe_db_url = DATABASE_URL.split("@")[-1]

logger.info(f"🔌 Connecting to database: {safe_db_url}")

# -----------------------------------
# Create SQLAlchemy Engine
# -----------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
    connect_args={'connect_timeout': 5} # 5 second timeout
)

def verify_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection verified successfully.")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        return False

# We skip the blocking check at top-level to let the app start
# verify_connection()

# -----------------------------------
# Session Factory
# -----------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# -----------------------------------
# Dependency for DB Session
# -----------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()