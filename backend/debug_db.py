import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from pathlib import Path

# Load .env
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Testing DATABASE_URL: {DATABASE_URL}")

def test_url(url, label):
    try:
        engine = create_engine(url, connect_args={'connect_timeout': 5})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"SUCCESS [{label}]: Connected!")
        return True
    except Exception as e:
        print(f"FAILED [{label}]: {e}")
        return False

# 1. Test current URL
test_url(DATABASE_URL, "Current URL")

# 2. Test with default postgres db to see if server is up
if "@" in DATABASE_URL:
    base_url = DATABASE_URL.rsplit("/", 1)[0]
    test_url(f"{base_url}/postgres", "Default 'postgres' DB")

# 3. Test with 'shakti_db' (as seen in some scripts)
if "@" in DATABASE_URL:
    base_url = DATABASE_URL.rsplit("/", 1)[0]
    test_url(f"{base_url}/shakti_db", "Alternative 'shakti_db'")
