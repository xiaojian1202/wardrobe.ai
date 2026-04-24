from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from utils.config import settings

# Determine Database URL
# For SQLite, it's relative to the backend/ folder
if "sqlite" in settings.triton_base_url.lower(): # Just a logic example
     pass # Placeholder for dynamic env logic

# We will add DATABASE_URL to config.py later. 
# For now, default to local SQLite for the project scope.
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "fitcheck.db"
os.makedirs(DB_PATH.parent, exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Connect_args needed only for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for FastAPI endpoints to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
