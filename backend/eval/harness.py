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
    
    if not gold_file.exists():
        print(f"Error: metadata.json not found.")
        return

    with open(gold_file, "r") as f:
        gold_set = json.load(f)

    # 1. Discover and Filter Images
    all_images = sorted(list(image_folder.glob("*.jpg")))
    images_to_test = []

    for img in all_images:
        # Handle single file flag
        if file_filter and img.name != file_filter:
            continue
        # Handle category flag (e.g., 'negative' or 'positive')
        if category_filter and category_filter not in img.name:
            continue
        images_to_test.append(img)

    # 2. Handle random selection if limit is set
    if limit and limit < len(images_to_test):
        print(f"--- Randomly selecting {limit} images for this run ---")
        images_to_test = random.sample(images_to_test, limit)
    elif not file_filter: # Only sort if we aren't picking a specific file
        images_to_test = sorted(images_to_test)

    if not images_to_test:
        print(f"No matching images found for filters.")
        return

    print(f"\n--- FitCheck AI [PERFORMANCE AUDIT] ---")
    print(f"Testing {len(images_to_test)} images")
    print("-" * 85)
    
    stats = {"tp": 0, "tn": 0, "fp": 0, "fn": 0, "err": 0, "tech": 0}
    
    for img_path in images_to_test:
        name = img_path.name
        truth = gold_set.get(name)
        if not truth: continue

        print(f"{name:20}", end=" ", flush=True)
        
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            
            result = extract_attributes(img_bytes, "image/jpeg", name)
            stats["tech"] += 1
            
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

            print(f"| {status}")
        except KeyboardInterrupt:
            print("\n\n🛑 Evaluation stopped by user.")
            sys.exit(0)
        except Exception as e:
            print(f"| 🚨 CRASH: {str(e)[:20]}")
        
        time.sleep(0.5)

    print("\n" + "═" * 85)
    print(" Results")
    print("═" * 85)
    print(f"True Positives (Match):  {stats['tp']}      (Correct identification)")
    print(f"True Negatives (Reject): {stats['tn']}      (Correct rejections)")
    print("-" * 85)
    print(f"False Positives:         {stats['fp']}      (Missed fake clothes)")
    print(f"False Negatives:         {stats['fn']}      (Missed real clothes)")
    print(f"Semantic Errors:         {stats['err']}      (Wrong category)")
    print("═" * 85 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FitCheck AI Evaluation Harness")
    parser.add_argument("--file", type=str, help="Evaluate a single image file (e.g., positive_1.jpg)")
    parser.add_argument("--category", type=str, help="Filter by category (e.g., 'negative', 'positive', 'noisy')")
    parser.add_argument("--limit", type=int, help="Limit the number of images to test")
    parser.add_argument("--dir", type=str, default=settings.test_images_dir, help="Directory containing test images")
    
    args = parser.parse_args()
    run_evaluation(args.dir, file_filter=args.file, category_filter=args.category, limit=args.limit)
