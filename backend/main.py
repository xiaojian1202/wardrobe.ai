from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

from pipeline.extract import ExtractionError, extract_attributes
from utils.config import settings
from utils.storage import save_image_securely
from database.session import engine, get_db
from database.models import Base, ClothingItem

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitCheck AI API",
    version="0.1.0",
    description="Secure image scanning and wardrobe persistence API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the 'storage' directory as static files
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/scan")
async def scan_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
) -> dict[str, object]:
    """
    1. Validates and saves the image securely.
    2. Extracts fashion attributes via TritonAI.
    3. Persists the 'Initial AI Draft' to the database.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use JPEG, PNG, WEBP, or HEIC.",
        )

    contents = await file.read()
    
    # 1. Save Image Securely (Prevents Path Traversal)
    image_hash, relative_path = save_image_securely(contents, file.filename)

    # 2. Extract Attributes via AI
    try:
        extracted = extract_attributes(
            image_bytes=contents,
            mime_type=file.content_type,
            filename=file.filename,
        )
    except ExtractionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not extracted.is_clothing:
        raise HTTPException(
            status_code=422,
            detail="No clothing detected. Please upload a clear fashion image."
        )

    # 3. Check if this image has already been scanned (Duplicate Prevention)
    existing_item = db.query(ClothingItem).filter(ClothingItem.image_hash == image_hash).first()
    
    if existing_item:
        # If it exists, return the current state (either draft or verified)
        return {
            "id": existing_item.id,
            "filename": file.filename,
            "extracted": {
                "category": existing_item.category,
                "sub_category": existing_item.sub_category,
                "color": existing_item.color,
                "material": existing_item.material,
                "vibe": existing_item.vibe,
            },
            "is_verified": existing_item.is_verified,
            "message": "Retrieving existing record from closet."
        }

    # 4. Persist to Database as a new 'Draft'
    new_item = ClothingItem(
        user_id="guest_user_123",
        image_hash=image_hash,
        file_path=relative_path,
        category=extracted.category,
        sub_category=extracted.sub_category,
        color=extracted.color,
        material=extracted.material,
        vibe=extracted.vibe,
        is_verified=False,
        original_ai_output=extracted.model_dump()
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "id": new_item.id,
        "filename": file.filename,
        "extracted": extracted.model_dump(),
        "is_verified": new_item.is_verified
    }

@app.get("/items", response_model=List[dict])
async def get_items(db: Session = Depends(get_db)):
    """Fetch all items in the closet (both drafts and verified)."""
    items = db.query(ClothingItem).all()
    return [item.to_dict() for item in items]

from pydantic import BaseModel

class VerificationRequest(BaseModel):
    category: str
    sub_category: str
    color: str
    material: str
    vibe: str

@app.post("/items/{item_id}/verify")
async def verify_item(
    item_id: int, 
    request: VerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Updates a draft item with user-verified attributes and marks it final.
    This completes the 'User-in-the-Loop' flow.
    """
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update attributes with user inputs
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
async def get_verified_wardrobe(db: Session = Depends(get_db)):
    """Returns only verified items for the main Wardrobe gallery."""
    items = db.query(ClothingItem).filter(ClothingItem.is_verified == True).all()
    return [item.to_dict() for item in items]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=settings.api_host, 
        port=settings.api_port, 
        reload=True
    )
