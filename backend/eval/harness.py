import os
import sys
import time
import json
import argparse
import random
from pathlib import Path

# Add the parent directory to path so we can import pipeline
sys.path.append(str(Path(__file__).parent.parent))

from pipeline.extract import extract_attributes, ExtractionError
from utils.config import settings

def run_evaluation(data_dir: str, file_filter: str = None, category_filter: str = None, limit: int = None):
    image_folder = Path(data_dir)
    gold_file = image_folder / "metadata.json"
    
    # 1. Discover Images
    # Support multiple formats: jpg, jpeg, png, webp, heic
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.heic']
    all_images = []
    for ext in extensions:
        all_images.extend(list(image_folder.glob(ext)))
        all_images.extend(list(image_folder.glob(ext.upper())))
    
    all_images = sorted(list(set(all_images))) # Deduplicate and sort
    
    # 2. Handle Single File Path Override
    images_to_test = []
    if file_filter:
        filter_path = Path(file_filter)
        # If user provides a direct path that exists
        if filter_path.exists() and filter_path.is_file():
            images_to_test = [filter_path]
        else:
            # Fallback: Search for filename in the data_dir
            for img in all_images:
                if img.name == file_filter:
                    images_to_test.append(img)
                    break
    else:
        images_to_test = all_images

    # 3. Apply Category Filter
    if category_filter and not file_filter:
        images_to_test = [img for img in images_to_test if category_filter in img.name]

    # 4. Handle random selection if limit is set
    if limit and limit < len(images_to_test):
        print(f"--- Randomly selecting {limit} images for this run ---")
        images_to_test = random.sample(images_to_test, limit)
    elif not file_filter: 
        images_to_test = sorted(images_to_test)

    if not images_to_test:
        print(f"No matching images found for filters.")
        return

    # Load Ground Truth if available
    gold_set = {}
    if gold_file.exists():
        with open(gold_file, "r") as f:
            gold_set = json.load(f)

    print(f"\n--- FitCheck AI [PERFORMANCE AUDIT] ---")
    print(f"Testing {len(images_to_test)} image(s)")
    print("-" * 85)
    
    stats = {"tp": 0, "tn": 0, "fp": 0, "fn": 0, "err": 0, "tech": 0}
    
    for img_path in images_to_test:
        name = img_path.name
        truth = gold_set.get(name)

        print(f"{name:20}", end=" ", flush=True)
        
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            
            # Extract mime type
            ext = img_path.suffix.lower()[1:]
            mime_type = f"image/{'jpeg' if ext == 'jpg' else ext}"
            
            result = extract_attributes(img_bytes, mime_type, name)
            stats["tech"] += 1
            
            # Evaluation logic (requires truth)
            if truth:
                is_fashion = result.is_clothing
                truth_fashion = truth["expected_is_clothing"]
                
                if not truth_fashion:
                    if not is_fashion:
                        stats["tn"] += 1
                        status = "TRUE NEGATIVE (🚫 Correct Reject)"
                    else:
                        stats["fp"] += 1
                        status = "FALSE POSITIVE (⚠️ Hallucination)"
                else:
                    if not is_fashion:
                        stats["fn"] += 1
                        status = f"FALSE NEGATIVE (❌ Missed: {result.rejection_reason})"
                    else:
                        expected = truth["expected_category"].lower()
                        actual = result.items[0].category.lower() if result.items else "none"
                        if expected == actual or expected in actual:
                            stats["tp"] += 1
                            status = "TRUE POSITIVE (✅ Perfect Match)"
                        else:
                            stats["err"] += 1
                            status = f"SEMANTIC ERROR (❌ Wrong Cat: {actual})"
            else:
                # No truth available, just show result
                cat = result.items[0].category if result.items else "none"
                status = f"EXTRACTED: {cat} (Is Clothing: {result.is_clothing})"

            print(f"| {status}")
        except KeyboardInterrupt:
            print("\n\n🛑 Evaluation stopped by user.")
            sys.exit(0)
        except Exception as e:
            print(f"| 🚨 CRASH: {str(e)[:40]}")
        
        if len(images_to_test) > 1:
            time.sleep(0.5)

    print("\n" + "═" * 85)
    print(" SUMMARY")
    print("═" * 85)
    if any(s > 0 for s in [stats['tp'], stats['tn'], stats['fp'], stats['fn']]):
        print(f"Matches (TP): {stats['tp']} | Rejects (TN): {stats['tn']} | Errors: {stats['err']}")
    print(f"Total Processed: {len(images_to_test)}")
    print("═" * 85 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FitCheck AI Evaluation Harness")
    parser.add_argument("--file", type=str, help="Evaluate a single image file (filename or direct path)")
    parser.add_argument("--category", type=str, help="Filter by category substring")
    parser.add_argument("--limit", type=int, help="Limit number of images")
    parser.add_argument("--dir", type=str, default=settings.test_images_dir, help="Directory containing test images")
    
    args = parser.parse_args()
    run_evaluation(args.dir, file_filter=args.file, category_filter=args.category, limit=args.limit)
