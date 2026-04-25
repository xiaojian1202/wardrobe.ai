import os
from pathlib import Path
from database.session import engine
from database.models import Base

def reinit_db():
    print("--- Re-initializing Database Schema ---")
    
    # 1. Drop existing tables to clear the old 'UNIQUE' constraint
    print("Dropping old tables...")
    Base.metadata.drop_all(bind=engine)
    
    # 2. Create tables with the NEW schema (Multi-item support)
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    
    print("✓ Success! Your database now supports multiple items per image.")

if __name__ == "__main__":
    reinit_db()
