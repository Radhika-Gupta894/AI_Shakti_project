from .db import engine, SessionLocal, get_db
from .base import Base

# This file is kept for backward compatibility with existing code
# New code should use database/db.py and database/base.py directly
