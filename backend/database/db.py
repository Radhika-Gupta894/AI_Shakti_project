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

# For pure-python pg8000 driver (no C++ build tools required)
if DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+pg8000://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    # Strip any legacy sslmode from the URL as we use connect_args
    if "?" in DATABASE_URL or "&" in DATABASE_URL:
        import re
        # Remove sslmode and any empty query params
        DATABASE_URL = re.sub(r'([?&])sslmode=[^&]*&?', r'\1', DATABASE_URL)
        DATABASE_URL = DATABASE_URL.rstrip('?&')
    logger.info("⚡ Using pure-python pg8000 driver for cloud connection")

# Hide password in logs for security
safe_db_url = DATABASE_URL.split("@")[-1]

logger.info(f"🔌 Connecting to database: {safe_db_url}")

# -----------------------------------
# Create SQLAlchemy Engine
# -----------------------------------
# For Cloud DBs (Neon/Supabase), we need SSL and pooling
# Using pg8000 (pure-python) to avoid C++ build tool requirements

from sqlalchemy import event

def get_engine_args():
    args = {
        "pool_size": 10, # Increased for production-ready concurrency
        "max_overflow": 20, # Allow more connections during bursts
        "pool_timeout": 30, # Longer wait before timing out
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "echo": False,
    }
    
    # Connection arguments
    connect_args = {
        "timeout": 10, # Socket timeout
    }
    
    if "pg8000" in DATABASE_URL:
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connect_args["ssl_context"] = ssl_context
        logger.info("🔒 Configured SSL for pg8000")
    else:
        connect_args["sslmode"] = "require"
        
    args["connect_args"] = connect_args
    return args

# Update URL for pg8000 driver prefix if missing
if DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+pg8000://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

# Strip any legacy ssl parameters from URL to avoid conflicts
if "?" in DATABASE_URL or "&" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'([?&])(ssl|sslmode)=[^&]*&?', r'\1', DATABASE_URL)
    DATABASE_URL = DATABASE_URL.rstrip('?&')

engine = create_engine(DATABASE_URL, **get_engine_args())

# Set statement timeout on every connection
@event.listens_for(engine, "connect")
def set_postgresql_timeout(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        # 10 second timeout for all statements
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