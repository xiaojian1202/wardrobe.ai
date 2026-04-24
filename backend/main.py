from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional

from pipeline.extract import ExtractionError, extract_attributes, ExtractionResult
from utils.config import settings
from utils.storage import save_image_securely
from database.session import engine, get_db
from database.models import Base, ClothingItem
from pydantic import BaseModel

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitCheck AI API",
    version="0.2.0",
    description="Multi-item image scanning and wardrobe persistence API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory="storage"), name="storage")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}

class VerificationRequest(BaseModel):
    category: str
    sub_category: str
    color: str
    material: str
    vibe: str

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/scan")
async def scan_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    1. Validates and saves the image securely.
    2. Extracts a list of fashion items via TritonAI.
    3. Persists each item as a 'Draft' to the database.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    contents = await file.read()
    image_hash, relative_path = save_image_securely(contents, file.filename)

    # 1. Deduplication: Check if this image was scanned before
    existing_items = db.query(ClothingItem).filter(ClothingItem.image_hash == image_hash).all()
    if existing_items:
        return {
            "is_duplicate": True,
            "items": [item.to_dict() for item in existing_items]
        }

    # 2. AI Extraction
    try:
        extraction = extract_attributes(
            image_bytes=contents,
            mime_type=file.content_type,
            filename=file.filename,
        )
    except ExtractionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not extraction.is_clothing or not extraction.items:
        raise HTTPException(
            status_code=422,
            detail="No clothing detected. Please upload a clear fashion image."
        )

    # 3. Persist multiple items
    created_items = []
    for item_data in extraction.items:
        new_item = ClothingItem(
            user_id="guest_user_123",
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
        "items": [item.to_dict() for item in created_items]
    }

@app.post("/items/{item_id}/verify")
async def verify_item(
    item_id: int, 
    request: VerificationRequest,
    db: Session = Depends(get_db)
):
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

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
    items = db.query(ClothingItem).filter(ClothingItem.is_verified == True).all()
    return [item.to_dict() for item in items]

@app.get("/items", response_model=List[dict])
async def get_all_items(db: Session = Depends(get_db)):
    items = db.query(ClothingItem).all()
    return [item.to_dict() for item in items]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.api_host, port=settings.api_port, reload=True)
