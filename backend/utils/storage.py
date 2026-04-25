import os
import hashlib
from pathlib import Path
from PIL import Image
from io import BytesIO
from utils.config import settings
from typing import List

# Get base directory for absolute paths
BASE_DIR = Path(__file__).resolve().parent.parent

def save_image_securely(image_bytes: bytes, original_filename: str) -> tuple[str, str]:
    """
    Saves an uploaded image with a hashed filename.
    Returns: (image_hash, relative_file_path)
    """
    file_hash = hashlib.sha256(image_bytes).hexdigest()
    ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
    filename = f"{file_hash}{ext}"
    
    storage_dir = BASE_DIR / settings.uploads_dir
    os.makedirs(storage_dir, exist_ok=True)
    
    file_path = storage_dir / filename
    if not file_path.exists():
        with open(file_path, "wb") as f:
            f.write(image_bytes)
            
    return file_hash, os.path.join(settings.uploads_dir, filename)

def create_item_thumbnail(
    original_image_bytes: bytes, 
    bounding_box: List[int], 
    item_id: int
) -> str:
    """
    Crops the original image using normalized coordinates [ymin, xmin, ymax, xmax].
    Saves a zoomed-in thumbnail for specific wardrobe items.
    """
    try:
        img = Image.open(BytesIO(original_image_bytes))
        width, height = img.size
        
        # [ymin, xmin, ymax, xmax] normalized to 1000
        ymin, xmin, ymax, xmax = bounding_box
        
        # Convert to pixel coordinates
        left = (xmin / 1000) * width
        top = (ymin / 1000) * height
        right = (xmax / 1000) * width
        bottom = (ymax / 1000) * height
        
        # Add a 10% padding to make the crop look "natural"
        pad_w = (right - left) * 0.1
        pad_h = (bottom - top) * 0.1
        
        crop_box = (
            max(0, left - pad_w),
            max(0, top - pad_h),
            min(width, right + pad_w),
            min(height, bottom + pad_h)
        )
        
        cropped_img = img.crop(crop_box)
        
        # Save thumbnail
        thumb_filename = f"thumb_item_{item_id}.jpg"
        storage_dir = BASE_DIR / settings.uploads_dir
        thumb_path = storage_dir / thumb_filename
        
        cropped_img.convert("RGB").save(thumb_path, "JPEG", quality=85)
        
        return os.path.join(settings.uploads_dir, thumb_filename)
    except Exception as e:
        print(f"Thumbnail creation failed: {e}")
        return "" # Fallback to original image if crop fails
