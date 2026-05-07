from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import logging
import traceback
from pathlib import Path
from sqlalchemy.engine import make_url

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

USE_SQLITE = False

if not DATABASE_URL:
    logger.warning("⚠️ DATABASE_URL not found — falling back to local SQLite database.")
    SQLITE_PATH = BASE_DIR / "shakti_ai.db"
    DATABASE_URL = f"sqlite:///{SQLITE_PATH}"
    USE_SQLITE = True
else:
    # Normalize to postgresql+pg8000:// prefix
    if DATABASE_URL.startswith("postgresql+psycopg2://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+pg8000://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

    # pg8000 does NOT accept sslmode in the URL — SSL is handled via ssl_context in connect_args
    DATABASE_URL = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")

    logger.info("✅ Using pg8000 driver for Neon DB (SSL via connect_args)")

# Hide password in logs for security
safe_db_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
logger.info(f"🔌 Database Target: {safe_db_url}")

# -----------------------------------
# Create SQLAlchemy Engine
# -----------------------------------
from sqlalchemy import event

def get_engine_args():
    if USE_SQLITE:
        return {"connect_args": {"check_same_thread": False}, "echo": False}

    import ssl
    import re

    # --- Neon pg8000 SNI Workaround ---
    # pg8000 does not support SNI, so Neon requires the endpoint ID to be
    # passed via the `application_name` connect_arg for proper routing.
    endpoint_id = None
    match = re.search(r"@(ep-[^.]+)", DATABASE_URL)
    if match:
        endpoint_id = match.group(1)
        logger.info(f"🔗 Neon endpoint detected: {endpoint_id}")

    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    connect_args = {
        "ssl_context": ssl_context,
    }
    if endpoint_id:
        # Passes endpoint ID so Neon can route without SNI
        connect_args["application_name"] = f"endpoint={endpoint_id}"

    args = {
        "connect_args": connect_args,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "echo": False,
    }
    return args

# The engine is created with the processed DATABASE_URL
engine = create_engine(DATABASE_URL, **get_engine_args())

# Set statement timeout on every connection (PostgreSQL only)
if not USE_SQLITE:
    @event.listens_for(engine, "connect")
    def set_postgresql_timeout(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("SET statement_timeout = 10000")
            logger.info("⏱️ Statement timeout set to 10s")
        except Exception as e:
            logger.warning(f"⚠️ Could not set statement timeout: {e}")
        finally:
            cursor.close()

def verify_connection():
    """Verify database connection with retry logic (Non-blocking)"""
    import threading
    
    def check():
        try:
            logger.info("📡 Testing cloud database connection (Background)...")
            # Create a dedicated connection for the test
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                conn.commit()
                logger.info("✅ Cloud Database connection verified!")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            logger.error(traceback.format_exc())
            
    # Run check in a background thread to prevent hanging the app startup
    thread = threading.Thread(target=check, daemon=True)
    thread.start()

# Start background check
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