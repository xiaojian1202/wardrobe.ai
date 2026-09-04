import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from database.session import SessionLocal, engine
from database.models import Base, User, ClothingItem, UserPreference
from utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from main import app
from fastapi.testclient import TestClient

def test_auth_workflow():
    print("=" * 60)
    print("RUNNING MULTI-TENANT AUTHENTICATION & ISOLATION TESTS")
    print("=" * 60)

    # 1. Test Password Hashing and Verification
    print("\n1. Testing password hashing & verification...")
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    assert hashed != password, "Password was not hashed"
    assert verify_password(password, hashed), "Valid password verification failed"
    assert not verify_password("WrongPassword", hashed), "Invalid password accepted"
    print("   ✓ Password hashing & verification passed!")

    # 2. Test JWT Token Creation & Decoding
    print("\n2. Testing JWT token creation & decoding...")
    test_payload = {"sub": "user_12345", "email": "test@example.com"}
    token = create_access_token(test_payload)
    decoded = decode_access_token(token)
    assert decoded is not None, "Token decoding returned None"
    assert decoded["sub"] == test_payload["sub"], "Subject claim mismatch"
    assert decoded["email"] == test_payload["email"], "Email claim mismatch"
    assert decode_access_token("invalid.token.here") is None, "Invalid token was falsely accepted"
    print("   ✓ JWT creation, signature, and validation passed!")

    # 3. Test API Registration & Login via FastAPI TestClient
    print("\n3. Testing API Registration, Login, and Protected Endpoints...")
    client = TestClient(app)

    # Register User A
    email_a = f"alice_{int(sys.version_info.major)}@test.com"
    res_a = client.post("/auth/register", json={"email": email_a, "password": "PasswordAlice123"})
    assert res_a.status_code in (200, 409), f"Registration failed: {res_a.text}"
    if res_a.status_code == 409:
        res_a = client.post("/auth/login", json={"email": email_a, "password": "PasswordAlice123"})
    
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    email_b = f"bob_{int(sys.version_info.major)}@test.com"
    res_b = client.post("/auth/register", json={"email": email_b, "password": "PasswordBob123"})
    assert res_b.status_code in (200, 409), f"Registration failed: {res_b.text}"
    if res_b.status_code == 409:
        res_b = client.post("/auth/login", json={"email": email_b, "password": "PasswordBob123"})

    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["user"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Verify /auth/me for User A and User B
    me_a = client.get("/auth/me", headers=headers_a)
    assert me_a.status_code == 200 and me_a.json()["email"] == email_a, "User A /auth/me failed"

    me_b = client.get("/auth/me", headers=headers_b)
    assert me_b.status_code == 200 and me_b.json()["email"] == email_b, "User B /auth/me failed"
    print("   ✓ User registration, login, and /auth/me profile checks passed!")

    # 4. Test Multi-Tenant Data Isolation in Database Queries
    print("\n4. Testing Multi-Tenant Data Isolation...")
    db = SessionLocal()
    try:
        # Clear any prior test items for clean isolation check
        db.query(ClothingItem).filter(ClothingItem.user_id.in_([user_a_id, user_b_id])).delete()
        db.commit()

        # Insert a verified item for User A
        item_a = ClothingItem(
            user_id=user_a_id,
            image_hash="hash_user_a_item",
            file_path="storage/uploads/a.jpg",
            category="Top",
            sub_category="Hoodie",
            color="Black",
            material="Cotton",
            vibe="Streetwear",
            is_verified=True
        )
        db.add(item_a)
        db.commit()
        db.refresh(item_a)

        # Check User A's wardrobe endpoint
        wardrobe_a = client.get("/wardrobe", headers=headers_a).json()
        assert len(wardrobe_a) == 1, f"User A should see 1 item, got {len(wardrobe_a)}"
        assert wardrobe_a[0]["sub_category"] == "Hoodie"

        # Check User B's wardrobe endpoint (MUST BE EMPTY)
        wardrobe_b = client.get("/wardrobe", headers=headers_b).json()
        assert len(wardrobe_b) == 0, f"User B should see 0 items, got {len(wardrobe_b)} (Tenant data leak!)"

        # Check User B attempting to delete User A's item (MUST RETURN 404)
        delete_attempt = client.delete(f"/items/{item_a.id}", headers=headers_b)
        assert delete_attempt.status_code == 404, "User B should not be able to delete User A's item"

        # Check User A's stats vs User B's stats
        stats_a = client.get("/wardrobe/stats", headers=headers_a).json()
        stats_b = client.get("/wardrobe/stats", headers=headers_b).json()
        assert stats_a["total"] == 1 and stats_a["top_vibe"] == "Streetwear", f"Stats A incorrect: {stats_a}"
        assert stats_b["total"] == 0 and stats_b["top_vibe"] == "None", f"Stats B incorrect: {stats_b}"

        print("   ✓ Multi-tenant isolation verified: User data is completely segregated!")
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("🎉 ALL MULTI-TENANT AUTHENTICATION & SECURITY TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    test_auth_workflow()
