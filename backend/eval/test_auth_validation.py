import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)

INVALID_EMAILS = [
    "user@domain",              # Missing Top-Level Domain (TLD)
    "@domain.com",              # Missing local user part
    "user@.com",                # Missing domain label
    "user name@domain.com",     # Whitespace in address
    "user@domain..com",         # Consecutive dots in domain
    "plainaddress",             # No @ symbol
    "user@domain.c",            # TLD too short (under 2 chars)
]

VALID_EMAILS = [
    "user@domain.com",
    "john.doe@company.org",
    "test+filter@sub.domain.co.uk",
    "fashion_ai@ucsd.edu",
]

def test_invalid_email_registration_rejected():
    for email in INVALID_EMAILS:
        res = client.post("/auth/register", json={"email": email, "password": "Password123!"})
        assert res.status_code == 400, (
            f"Expected HTTP 400 for invalid email '{email}', got {res.status_code}: {res.text}"
        )
        assert "valid email" in res.json().get("detail", "").lower(), (
            f"Expected error detail to mention valid email for '{email}', got: {res.text}"
        )

def test_invalid_email_login_rejected():
    for email in INVALID_EMAILS:
        res = client.post("/auth/login", json={"email": email, "password": "Password123!"})
        assert res.status_code == 400, (
            f"Expected HTTP 400 for invalid login email '{email}', got {res.status_code}: {res.text}"
        )

def test_valid_email_registration_accepted():
    import uuid
    for email in VALID_EMAILS:
        unique_email = f"{uuid.uuid4().hex[:6]}_{email}"
        res = client.post("/auth/register", json={"email": unique_email, "password": "Password123!"})
        assert res.status_code == 200, (
            f"Expected HTTP 200 for valid email '{unique_email}', got {res.status_code}: {res.text}"
        )
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email.lower()

if __name__ == "__main__":
    print("Testing invalid email registrations...")
    test_invalid_email_registration_rejected()
    print("Testing invalid email logins...")
    test_invalid_email_login_rejected()
    print("Testing valid email registrations...")
    test_valid_email_registration_accepted()
    print("🎉 ALL EMAIL VALIDATION TESTS PASSED!")
