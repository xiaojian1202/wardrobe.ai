import asyncio
from typing import List, Optional
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from database.models import Base, ClothingItem, UserPreference, User
from database.session import engine, get_db
from pipeline.extract import ExtractionError, extract_attributes, ExtractionResult
from pipeline.learning import record_correction, get_user_style_context
from utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from utils.config import settings
from utils.storage import save_image_securely, create_item_thumbnail

# Maximum allowed upload size (10 MB) to protect against memory exhaustion
MAX_UPLOAD_SIZE = 10 * 1024 * 1024
MAX_BATCH_CONCURRENCY = 5

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitCheck AI API",
    version="1.0.0",
    description="High-performance intelligent fashion scanner with multi-tenant auth and active learning loop.",
)

# Placeholder guest user ID for backward compatibility
DEFAULT_USER_ID = "guest_user_123"

security = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory="storage"), name="storage")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class VerificationRequest(BaseModel):
    category: str
    sub_category: str
    color: str
    material: str
    vibe: str

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts the authenticated user from the Bearer JWT token.
    Falls back to a persistent guest user when unauthenticated for demo / legacy compatibility.
    """
    if credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == payload["sub"]).first()
            if user:
                return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Guest user fallback
    guest = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not guest:
        guest = User(
            id=DEFAULT_USER_ID,
            email="guest@fitcheck.ai",
            hashed_password="guest_disabled_password"
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)
    return guest

async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Strict authentication dependency requiring a valid JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await get_current_user(credentials=credentials, db=db)

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def is_valid_email(email: str) -> bool:
    """Validate email address format following strict RFC-like structure."""
    if not email or len(email) > 320:
        return False
    if not EMAIL_REGEX.match(email):
        return False
    domain = email.split("@")[-1]
    labels = domain.split(".")
    if len(labels) < 2 or any(len(label) == 0 for label in labels):
        return False
    if len(labels[-1]) < 2:
        return False
    return True

@app.post("/auth/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user and return JWT access token."""
    email_clean = request.email.strip().lower()
    if not is_valid_email(email_clean):
        raise HTTPException(
            status_code=400, 
            detail="A valid email address is required (e.g. user@example.com)."
        )
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    hashed_pw = hash_password(request.password)
    new_user = User(
        id=str(uuid.uuid4()),
        email=email_clean,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user.to_dict()
    }

@app.post("/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate existing user credentials and return JWT token."""
    email_clean = request.email.strip().lower()
    if not is_valid_email(email_clean):
        raise HTTPException(
            status_code=400,
            detail="A valid email address is required (e.g. user@example.com)."
        )
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@app.get("/auth/me")
async def get_me(current_user: User = Depends(require_auth)):
    """Returns the authenticated user's profile."""
    return current_user.to_dict()

@app.post("/scan")
async def scan_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum allowed limit (10MB).")

    image_hash, relative_path = save_image_securely(contents, file.filename)

    # 1. Deduplication per user
    existing_items = db.query(ClothingItem).filter(
        ClothingItem.user_id == current_user.id,
        ClothingItem.image_hash == image_hash
    ).all()
    if existing_items:
        return {
            "is_duplicate": True,
            "items": [item.to_dict() for item in existing_items]
        }

    # 2. FETCH LEARNED CONTEXT (The 'Learning Loop' at work)
    user_style_notes = get_user_style_context(db, current_user.id)

    # 3. Non-blocking Async AI Extraction with Context
    try:
        extraction = await extract_attributes(
            image_bytes=contents,
            mime_type=file.content_type or "image/jpeg",
            filename=file.filename,
            user_context=user_style_notes
        )
    except ExtractionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not extraction.is_clothing or not extraction.items:
        reason = extraction.rejection_reason
        if reason == "multiple_items":
            msg = "Multiple items detected. Please upload a photo of a single fashion piece for your wardrobe."
        elif reason == "not_clothing":
            msg = "This doesn't look like a fashion item. Please upload a clear photo of an individual fashion item."
        else:
            msg = "Identification failed. Please ensure the image shows one single fashion item."
            
        raise HTTPException(status_code=422, detail=msg)

    # 4. Persist items for current user
    created_items = []
    for item_data in extraction.items:
        new_item = ClothingItem(
            user_id=current_user.id,
            image_hash=image_hash,
            file_path=relative_path,
            category=item_data.category,
            sub_category=item_data.sub_category,
            color=item_data.color,
            material=item_data.material,
            vibe=item_data.vibe,
            is_verified=False,
            original_ai_output=item_data.model_dump()
        )
        db.add(new_item)
        created_items.append(new_item)
    
    db.commit()
    for item in created_items:
        db.refresh(item)

    return {
        "is_duplicate": False,
        "items": [item.to_dict() for item in created_items],
        "learned_context_applied": bool(user_style_notes)
    }

@app.post("/batch-scan")
async def batch_scan_images(
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scans multiple clothing images in parallel with bounded concurrency and user isolation.
    """
    if not files:
        return []

    user_style_notes = get_user_style_context(db, current_user.id)
    semaphore = asyncio.Semaphore(MAX_BATCH_CONCURRENCY)

    # Read and hash files asynchronously first
    preprocessed_files = []
    for file in files:
        if not file.filename:
            preprocessed_files.append({"filename": "unknown", "error": "Filename is missing."})
            continue

        contents = await file.read()
        if len(contents) > MAX_UPLOAD_SIZE:
            preprocessed_files.append({"filename": file.filename, "error": "File exceeds 10MB limit."})
            continue

        image_hash, relative_path = save_image_securely(contents, file.filename)
        preprocessed_files.append({
            "filename": file.filename,
            "contents": contents,
            "content_type": file.content_type or "image/jpeg",
            "image_hash": image_hash,
            "relative_path": relative_path
        })

    async def _extract_single(item_info: dict) -> dict:
        if "error" in item_info:
            return {"filename": item_info["filename"], "status": "error", "detail": item_info["error"]}

        # Check for existing duplicate for current user
        existing_items = db.query(ClothingItem).filter(
            ClothingItem.user_id == current_user.id,
            ClothingItem.image_hash == item_info["image_hash"]
        ).all()
        if existing_items:
            return {
                "filename": item_info["filename"],
                "status": "duplicate",
                "items": [it.to_dict() for it in existing_items]
            }

        async with semaphore:
            try:
                extraction = await extract_attributes(
                    image_bytes=item_info["contents"],
                    mime_type=item_info["content_type"],
                    filename=item_info["filename"],
                    user_context=user_style_notes
                )
            except ExtractionError as err:
                return {"filename": item_info["filename"], "status": "error", "detail": str(err)}
            except Exception as err:
                return {"filename": item_info["filename"], "status": "error", "detail": f"Inference failed: {str(err)}"}

        if not extraction.is_clothing or not extraction.items:
            return {
                "filename": item_info["filename"],
                "status": "error",
                "detail": extraction.rejection_reason or "Not identified as clothing."
            }

        return {
            "filename": item_info["filename"],
            "status": "success",
            "extraction": extraction,
            "image_hash": item_info["image_hash"],
            "relative_path": item_info["relative_path"]
        }

    # Execute all extraction tasks concurrently
    extraction_results = await asyncio.gather(*[_extract_single(f) for f in preprocessed_files])

    # Persist successful items in database in a single transaction
    final_results = []
    items_to_persist = []

    for res in extraction_results:
        if res.get("status") == "success" and "extraction" in res:
            created_for_res = []
            for item_data in res["extraction"].items:
                new_item = ClothingItem(
                    user_id=current_user.id,
                    image_hash=res["image_hash"],
                    file_path=res["relative_path"],
                    category=item_data.category,
                    sub_category=item_data.sub_category,
                    color=item_data.color,
                    material=item_data.material,
                    vibe=item_data.vibe,
                    is_verified=False,
                    original_ai_output=item_data.model_dump()
                )
                db.add(new_item)
                created_for_res.append(new_item)
                items_to_persist.append(new_item)

            final_results.append({
                "filename": res["filename"],
                "status": "success",
                "_temp_items": created_for_res
            })
        else:
            final_results.append(res)

    if items_to_persist:
        db.commit()
        for item in items_to_persist:
            db.refresh(item)

    # Format final dictionary responses
    output = []
    for res in final_results:
        if "_temp_items" in res:
            output.append({
                "filename": res["filename"],
                "status": "success",
                "items": [item.to_dict() for item in res["_temp_items"]]
            })
        else:
            output.append(res)

    return output

@app.post("/items/{item_id}/verify")
async def verify_item(
    item_id: int, 
    request: VerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Saves user truth and records corrections to improve future scans for current user.
    """
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id,
        ClothingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Record correction in active learning loop
    record_correction(db, current_user.id, item_id, request.model_dump())

    # Update attributes
    item.category = request.category
    item.sub_category = request.sub_category
    item.color = request.color
    item.material = request.material
    item.vibe = request.vibe
    item.is_verified = True
    
    db.commit()
    db.refresh(item)
    return {"status": "verified", "item": item.to_dict()}

@app.get("/wardrobe", response_model=List[dict])
async def get_verified_wardrobe(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(ClothingItem).filter(
        ClothingItem.user_id == current_user.id,
        ClothingItem.is_verified == True
    ).order_by(ClothingItem.id.desc()).all()
    return [item.to_dict() for item in items]

@app.get("/debug/preferences")
async def get_learned_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Debug endpoint to inspect active learned preferences for current user."""
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()
    return prefs

@app.get("/wardrobe/stats")
async def get_wardrobe_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Aggregates wardrobe statistics using native SQL COUNT and GROUP BY queries per user.
    """
    total_count = db.query(func.count(ClothingItem.id)).filter(
        ClothingItem.user_id == current_user.id,
        ClothingItem.is_verified == True
    ).scalar() or 0

    if total_count == 0:
        return {"total": 0, "top_vibe": "None", "top_color": "None", "top_category": "None"}

    # Top Vibe aggregation
    top_vibe_row = db.query(
        ClothingItem.vibe, 
        func.count(ClothingItem.id).label("cnt")
    ).filter(
        ClothingItem.user_id == current_user.id,
        ClothingItem.is_verified == True,
        ClothingItem.vibe.isnot(None),
        ClothingItem.vibe != ""
    ).group_by(ClothingItem.vibe).order_by(desc("cnt")).first()

    # Top Color aggregation
    top_color_row = db.query(
        ClothingItem.color, 
        func.count(ClothingItem.id).label("cnt")
    ).filter(
        ClothingItem.user_id == current_user.id,
        ClothingItem.is_verified == True,
        ClothingItem.color.isnot(None),
        ClothingItem.color != ""
    ).group_by(ClothingItem.color).order_by(desc("cnt")).first()

    # Top Category aggregation
    top_cat_row = db.query(
        ClothingItem.category, 
        func.count(ClothingItem.id).label("cnt")
    ).filter(
        ClothingItem.user_id == current_user.id,
        ClothingItem.is_verified == True,
        ClothingItem.category.isnot(None),
        ClothingItem.category != ""
    ).group_by(ClothingItem.category).order_by(desc("cnt")).first()

    return {
        "total": total_count,
        "top_vibe": top_vibe_row[0] if top_vibe_row and top_vibe_row[0] else "None",
        "top_color": top_color_row[0] if top_color_row and top_color_row[0] else "None",
        "top_category": top_cat_row[0] if top_cat_row and top_cat_row[0] else "None"
    }

@app.delete("/items/{item_id}")
async def delete_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes an item from the database with tenant validation."""
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id,
        ClothingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": item_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.api_host, port=settings.api_port, reload=True)
