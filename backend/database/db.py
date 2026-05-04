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
    # 1. Ensure postgresql+pg8000 prefix
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    
    # 2. Strip legacy ssl parameters to avoid conflicts
    if "?" in DATABASE_URL:
        import re
        DATABASE_URL = re.sub(r'([?&])(ssl|sslmode)=[^&]*&?', r'\1', DATABASE_URL)
        DATABASE_URL = DATABASE_URL.rstrip('?&')
    
    # 3. Robust Password Handling for pg8000 (Requirement #5)
    try:
        url_obj = make_url(DATABASE_URL)
        if "pg8000" in url_obj.drivername and url_obj.password is None:
            # Reconstruct URL with empty string password to satisfy pg8000's internal decode call
            DATABASE_URL = str(url_obj._replace(password=""))
            logger.info("ℹ️ Injected safe password placeholder for pg8000")
    except Exception as e:
        logger.warning(f"⚠️ URL parsing notice: {e}")

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

    args = {
        "pool_size": 15,
        "max_overflow": 25,
        "pool_timeout": 60,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "echo": False,
    }
    
    connect_args = {"timeout": 15}
    
    if "pg8000" in DATABASE_URL:
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connect_args["ssl_context"] = ssl_context
        # Ensure password is explicitly a string, not None
        connect_args["password"] = make_url(DATABASE_URL).password or ""
        logger.info("🔒 Configured SSL & Password Safety for pg8000")
    else:
        connect_args["sslmode"] = "require"
        
    args["connect_args"] = connect_args
    return args

# The engine is created with the processed DATABASE_URL
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