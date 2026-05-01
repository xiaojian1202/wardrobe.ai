from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional

from pipeline.extract import ExtractionError, extract_attributes, ExtractionResult
from pipeline.learning import record_correction, get_user_style_context
from utils.config import settings
from utils.storage import save_image_securely, create_item_thumbnail
from database.session import engine, get_db
from database.models import Base, ClothingItem, UserPreference
from pydantic import BaseModel

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitCheck AI API",
    version="0.3.0",
    description="Intelligent fashion scanner with active learning loop.",
)

# Placeholder user ID for the assignment (until Auth is added)
DEFAULT_USER_ID = "guest_user_123"

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
    if not file.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    contents = await file.read()
    image_hash, relative_path = save_image_securely(contents, file.filename)

    # 1. Deduplication
    existing_items = db.query(ClothingItem).filter(ClothingItem.image_hash == image_hash).all()
    if existing_items:
        return {
            "is_duplicate": True,
            "items": [item.to_dict() for item in existing_items]
        }

    # 2. FETCH LEARNED CONTEXT (The 'Learning Loop' at work)
    user_style_notes = get_user_style_context(db, DEFAULT_USER_ID)

    # 3. AI Extraction with Context
    try:
        extraction = extract_attributes(
            image_bytes=contents,
            mime_type=file.content_type,
            filename=file.filename,
            user_context=user_style_notes # Propagation of user feedback
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

    # 4. Persist multiple items
    created_items = []
    for item_data in extraction.items:
        new_item = ClothingItem(
            user_id=DEFAULT_USER_ID,
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
    db: Session = Depends(get_db)
):
    """
    Scans multiple clothing images and returns extracted attributes for each.
    """
    results = []
    user_style_notes = get_user_style_context(db, DEFAULT_USER_ID)

    for file in files:
        if not file.filename:
            results.append({"filename": "unknown", "status": "error", "detail": "Filename is missing."})
            continue

        try:
            contents = await file.read()
            image_hash, relative_path = save_image_securely(contents, file.filename)

            # 1. Deduplication
            existing_items = db.query(ClothingItem).filter(ClothingItem.image_hash == image_hash).all()
            if existing_items:
                results.append({
                    "filename": file.filename,
                    "status": "duplicate",
                    "items": [item.to_dict() for item in existing_items]
                })
                continue

            # 2. AI Extraction
            try:
                extraction = extract_attributes(
                    image_bytes=contents,
                    mime_type=file.content_type,
                    filename=file.filename,
                    user_context=user_style_notes
                )
            except ExtractionError as error:
                results.append({"filename": file.filename, "status": "error", "detail": str(error)})
                continue

            if not extraction.is_clothing or not extraction.items:
                results.append({
                    "filename": file.filename, 
                    "status": "error", 
                    "detail": extraction.rejection_reason or "Not identified as clothing."
                })
                continue

            # 3. Persist
            created_items = []
            for item_data in extraction.items:
                new_item = ClothingItem(
                    user_id=DEFAULT_USER_ID,
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

            results.append({
                "filename": file.filename,
                "status": "success",
                "items": [item.to_dict() for item in created_items]
            })

        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "detail": str(e)})

    return results

@app.post("/items/{item_id}/verify")
async def verify_item(
    item_id: int, 
    request: VerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Saves user truth and records corrections to improve future scans.
    """
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # RECORD CORRECTION (The 'Learning Loop' capturing feedback)
    record_correction(db, DEFAULT_USER_ID, item_id, request.model_dump())

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
async def get_verified_wardrobe(db: Session = Depends(get_db)):
    items = db.query(ClothingItem).filter(ClothingItem.is_verified == True).all()
    return [item.to_dict() for item in items]

@app.get("/debug/preferences")
async def get_learned_preferences(db: Session = Depends(get_db)):
    """Debug endpoint to see what the system has learned about the user."""
    prefs = db.query(UserPreference).filter(UserPreference.user_id == DEFAULT_USER_ID).all()
    return prefs

@app.get("/wardrobe/stats")
async def get_wardrobe_stats(db: Session = Depends(get_db)):
    """Aggregates data for the Style Persona dashboard."""
    items = db.query(ClothingItem).filter(ClothingItem.is_verified == True).all()
    
    if not items:
        return {"total": 0, "top_vibe": "None", "top_color": "None", "top_category": "None"}
        
    # Simple aggregation logic
    vibes = {}
    colors = {}
    categories = {}
    
    for item in items:
        vibes[item.vibe] = vibes.get(item.vibe, 0) + 1
        colors[item.color] = colors.get(item.color, 0) + 1
        categories[item.category] = categories.get(item.category, 0) + 1
        
    return {
        "total": len(items),
        "top_vibe": max(vibes, key=vibes.get) if vibes else "None",
        "top_color": max(colors, key=colors.get) if colors else "None",
        "top_category": max(categories, key=categories.get) if categories else "None"
    }

@app.delete("/items/{item_id}")
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Deletes an item from the database."""
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": item_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.api_host, port=settings.api_port, reload=True)
