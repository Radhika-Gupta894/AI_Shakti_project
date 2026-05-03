from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import ssl

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

# For pure-python pg8000 driver (no C++ build tools required)
if DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+pg8000://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    logger.info("⚡ Using pure-python pg8000 driver for cloud connection")

# Hide password in logs for security
safe_db_url = DATABASE_URL.split("@")[-1]

logger.info(f"🔌 Connecting to database: {safe_db_url}")

# -----------------------------------
# Create SQLAlchemy Engine
# -----------------------------------
# For Cloud DBs (Neon/Supabase), we need SSL and pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=False,
    connect_args={"ssl_context": ssl.create_default_context()}
    
)

def verify_connection():
    """Verify database connection with retry logic"""
    try:
        logger.info("📡 Testing cloud database connection...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
            logger.info("✅ Cloud Database connection verified!")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

# Run a quick check on startup
verify_connection()

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