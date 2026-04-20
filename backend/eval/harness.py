import os
import sys
import time
from pathlib import Path

# Add the parent directory to path so we can import pipeline
sys.path.append(str(Path(__file__).parent.parent))

from pipeline.extract import extract_attributes, ExtractionError
from utils.config import settings

def run_evaluation(data_dir: str):
    image_folder = Path(data_dir)
    images = list(image_folder.glob("*"))
    
    if not images:
        print(f"No images found in {data_dir}")
        return

    print(f"--- Starting Evaluation on {len(images)} images ---")
    
    success_count = 0
    for img_path in images:
        if img_path.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp', '.heic']:
            continue
            
        print(f"Scanning {img_path.name}...", end=" ", flush=True)
        
        attempts = 0
        max_attempts = 2
        while attempts < max_attempts:
            try:
                with open(img_path, "rb") as f:
                    img_bytes = f.read()
                
                # Simplified mime type for test
                ext = img_path.suffix[1:].lower()
                mime_type = f"image/{'jpeg' if ext == 'jpg' else ext}"
                
                start_time = time.time()
                result = extract_attributes(img_bytes, mime_type, img_path.name)
                duration = time.time() - start_time

                if not result.is_clothing:
                    print(f"🚫 Rejected: Not a fashion item ({duration:.2f}s)")
                else:
                    print(f"✅ Success ({duration:.2f}s)")
                    print(f"   Result: {result.category} | {result.vibe}")
                    success_count += 1

                break # Exit retry loop on success
            except Exception as e:
                attempts += 1
                if attempts < max_attempts:
                    print(f" (Retrying due to: {type(e).__name__})...", end="", flush=True)
                    time.sleep(3) # Wait longer before retry
                else:
                    print(f"❌ Failed: {str(e)}")
        
        # Add a delay between different images to be kind to the API
        time.sleep(2)

    print(f"\n--- Evaluation Complete ---")
    print(f"Passed: {success_count}/{len(images)}")

if __name__ == "__main__":
    # You can pass a custom folder as an argument
    test_dir = sys.argv[1] if len(sys.argv) > 1 else settings.test_images_dir
    run_evaluation(test_dir)
