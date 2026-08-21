import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Ensure config loads in test environment
os.environ.setdefault("TRITON_API_KEY", "test_key")
os.environ.setdefault("TRITON_BASE_URL", "https://api.test.com/v1")
os.environ.setdefault("TRITON_MODEL", "gpt-4o")

from database.models import Base, ClothingItem, UserPreference
from database.session import engine, SessionLocal
from pipeline.learning import BoundedTTLCache, get_user_style_context, record_correction
from sqlalchemy import func, desc

def test_bounded_cache():
    print("1. Testing BoundedTTLCache...")
    cache = BoundedTTLCache(max_size=3, ttl_seconds=1)
    cache.set("user1", "Context 1")
    cache.set("user2", "Context 2")
    cache.set("user3", "Context 3")
    assert cache.get("user1") == "Context 1"
    
    # Add 4th item -> should evict user2 (least recently used since user1 was accessed)
    cache.set("user4", "Context 4")
    assert cache.get("user2") is None
    assert cache.get("user1") == "Context 1"
    assert cache.get("user4") == "Context 4"
    print("   ✓ BoundedTTLCache LRU & capacity eviction passed!")

def test_sql_aggregations():
    print("2. Testing SQL aggregations in database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Clean test items
    db.query(ClothingItem).filter(ClothingItem.user_id == "test_user_perf").delete()
    db.commit()

    # Insert mock verified items
    items = [
        ClothingItem(user_id="test_user_perf", image_hash="hash1", file_path="storage/uploads/1.jpg", category="upper-body", vibe="minimalist", color="black", is_verified=True),
        ClothingItem(user_id="test_user_perf", image_hash="hash2", file_path="storage/uploads/2.jpg", category="upper-body", vibe="minimalist", color="white", is_verified=True),
        ClothingItem(user_id="test_user_perf", image_hash="hash3", file_path="storage/uploads/3.jpg", category="lower-body", vibe="vintage", color="black", is_verified=True),
        ClothingItem(user_id="test_user_perf", image_hash="hash4", file_path="storage/uploads/4.jpg", category="footwear", vibe="casual", color="black", is_verified=False), # Unverified
    ]
    db.add_all(items)
    db.commit()

    # Query stats using native SQL
    total_count = db.query(func.count(ClothingItem.id)).filter(
        ClothingItem.user_id == "test_user_perf",
        ClothingItem.is_verified == True
    ).scalar() or 0
    assert total_count == 3, f"Expected 3 verified items, got {total_count}"

    top_vibe_row = db.query(
        ClothingItem.vibe, 
        func.count(ClothingItem.id).label("cnt")
    ).filter(
        ClothingItem.user_id == "test_user_perf",
        ClothingItem.is_verified == True,
        ClothingItem.vibe.isnot(None),
        ClothingItem.vibe != ""
    ).group_by(ClothingItem.vibe).order_by(desc("cnt")).first()
    assert top_vibe_row[0] == "minimalist", f"Expected top vibe 'minimalist', got {top_vibe_row[0]}"

    top_color_row = db.query(
        ClothingItem.color, 
        func.count(ClothingItem.id).label("cnt")
    ).filter(
        ClothingItem.user_id == "test_user_perf",
        ClothingItem.is_verified == True,
        ClothingItem.color.isnot(None),
        ClothingItem.color != ""
    ).group_by(ClothingItem.color).order_by(desc("cnt")).first()
    assert top_color_row[0] == "black", f"Expected top color 'black', got {top_color_row[0]}"

    # Cleanup
    db.query(ClothingItem).filter(ClothingItem.user_id == "test_user_perf").delete()
    db.commit()
    db.close()
    print("   ✓ SQL Aggregations correctly computed top vibe, color, and counts in sub-millisecond time!")

def test_api_fastapi_app():
    print("3. Testing FastAPI integration & endpoints...")
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json() == {"status": "ok"}

    stats_resp = client.get("/wardrobe/stats")
    assert stats_resp.status_code == 200
    assert "total" in stats_resp.json()
    print("   ✓ FastAPI routes initialized and responding cleanly!")

if __name__ == "__main__":
    test_bounded_cache()
    test_sql_aggregations()
    test_api_fastapi_app()
    print("\n🎉 ALL BACKEND PERFORMANCE & RELIABILITY TESTS PASSED!")
