import os
import sys
import time
import json
from pathlib import Path

# Add the parent directory to path so we can import pipeline
sys.path.append(str(Path(__file__).parent.parent))

from pipeline.extract import extract_attributes, ExtractionError
from utils.config import settings

def run_evaluation(data_dir: str):
    image_folder = Path(data_dir)
    gold_file = image_folder / "metadata.json"
    
    if not gold_file.exists():
        print(f"Error: metadata.json not found. Run label_data.py first.")
        return

    with open(gold_file, "r") as f:
        gold_set = json.load(f)

    images = sorted(list(image_folder.glob("*.jpg")))
    
    print(f"\n--- Evaluation Harness ---")
    print("-" * 85)
    
    stats = {
        "tech_success": 0,
        "tp": 0, # True Positive: Correctly identified single item
        "tn": 0, # True Negative: Correctly rejected non-clothing or outfit
        "fp": 0, # False Positive: Accepted a non-clothing or outfit
        "fn": 0, # False Negative: Rejected a valid single item
        "semantic_error": 0, # Found item but wrong category
        "total_items": 0
    }
    
    total = len(images)

    for img_path in images:
        name = img_path.name
        truth = gold_set.get(name)
        if not truth: continue

        print(f"Testing {name:20}", end=" ", flush=True)
        
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            
            # Use extraction pipeline
            result = extract_attributes(img_bytes, "image/jpeg", name)
            stats["tech_success"] += 1
            stats["total_items"] += len(result.items)
            
            is_fashion = result.is_clothing
            truth_is_fashion = truth["expected_is_clothing"]
            
            # --- CASE 1: Expecting a REJECT (Non-clothing or Outfit/Rack) ---
            if not truth_is_fashion:
                if not is_fashion:
                    stats["tn"] += 1
                    status = "TRUE NEGATIVE (🚫 Correct Reject)"
                else:
                    stats["fp"] += 1
                    status = "FALSE POSITIVE (⚠️ Failed to Reject)"
            
            # --- CASE 2: Expecting a SUCCESS (Single Fashion Item) ---
            else:
                if not is_fashion:
                    stats["fn"] += 1
                    status = f"FALSE NEGATIVE (❌ Missed: {result.rejection_reason})"
                else:
                    # Check for category match
                    expected = truth["expected_category"].lower()
                    # In single-item mode, we check the first (and only) item
                    if result.items:
                        actual = result.items[0].category.lower()
                        if expected == actual or expected in actual:
                            stats["tp"] += 1
                            status = "TRUE POSITIVE (✅ Perfect Match)"
                        else:
                            stats["semantic_error"] += 1
                            status = f"SEMANTIC ERROR (❌ Wrong Cat: {actual})"
                    else:
                        stats["fn"] += 1
                        status = "FALSE NEGATIVE (❌ No items returned)"

            print(f"| {status}")

        except Exception as e:
            print(f"| 🚨 TECHNICAL CRASH")
        
        time.sleep(0.5)

    positives = sum(1 for img in gold_set.values() if img["expected_is_clothing"])
    negatives = total - positives

    print("\n" + "═" * 85)
    print(f"True Positives (Match):  {stats['tp']:2d} / {positives:2d} (Correct identification)")
    print(f"True Negatives (Reject): {stats['tn']:2d} / {negatives:2d} (Correct rejections)")
    print("-" * 85)
    print(f"False Positives:         {stats['fp']:2d}      (Accepted junk/outfits)")
    print(f"False Negatives:         {stats['fn']:2d}      (Rejected valid items)")
    print(f"Semantic Errors:         {stats['semantic_error']:2d}      (Wrong category)")
    print("═" * 85 + "\n")

if __name__ == "__main__":
    run_evaluation(settings.test_images_dir)
