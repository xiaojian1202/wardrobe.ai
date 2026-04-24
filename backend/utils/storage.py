import os
import hashlib
from pathlib import Path
from utils.config import settings

# Get base directory for absolute paths
BASE_DIR = Path(__file__).resolve().parent.parent

def save_image_securely(image_bytes: bytes, original_filename: str) -> tuple[str, str]:
    """
    Saves an uploaded image with a hashed filename to prevent Path Traversal
    and name collisions.
    
    Returns:
        tuple: (image_hash, relative_file_path)
    """
    # 1. Generate unique hash for the file content
    file_hash = hashlib.sha256(image_bytes).hexdigest()
    
    # 2. Extract extension securely
    ext = os.path.splitext(original_filename)[1].lower()
    if not ext:
        ext = ".jpg" # Fallback
    
    filename = f"{file_hash}{ext}"
    
    # 3. Define permanent storage path
    storage_dir = BASE_DIR / settings.uploads_dir
    os.makedirs(storage_dir, exist_ok=True)
    
    file_path = storage_dir / filename
    
    # 4. Save file if it doesn't already exist
    if not file_path.exists():
        with open(file_path, "wb") as f:
            f.write(image_bytes)
            
    # Return relative path for database storage
    relative_path = os.path.join(settings.uploads_dir, filename)
    
    return file_hash, relative_path
