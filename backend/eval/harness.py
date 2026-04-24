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
        print(f"Error: Missing ground truth file at {gold_file}. Run label_data.py first.")
        return

    with open(gold_file, "r") as f:
        gold_set = json.load(f)

    images = sorted(list(image_folder.glob("*.jpg")))
    if not images:
        print(f"No images found in {data_dir}")
        return

    print(f"\n--- FitCheck AI Accuracy Evaluation ---")
    print(f"Dataset Size: {len(images)} images")
    print("-" * 50)
    
    stats = {
        "technical_success": 0,
        "classification_correct": 0, # Clothing vs Non-clothing
        "category_correct": 0,       # Shirt vs Pant
        "failures": 0
    }
    
    for img_path in images:
        name = img_path.name
        truth = gold_set.get(name)
        
        if not truth:
            print(f"Skipping {name}: No ground truth found.")
            continue

        print(f"Testing {name:20}", end=" ", flush=True)
        
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            
            start_time = time.time()
            result = extract_attributes(img_bytes, "image/jpeg", name)
            duration = time.time() - start_time
            
            stats["technical_success"] += 1
            
            # 1. Check Clothing Classification Accuracy
            is_correct = result.is_clothing == truth["expected_is_clothing"]
            if is_correct: stats["classification_correct"] += 1
            
            # 2. Check Category Accuracy (Only if it was supposed to be clothing)
            category_match = "N/A"
            if truth["expected_is_clothing"]:
                # Loose match (e.g., 'tops' matches 'top')
                match = truth["expected_category"].lower() in result.category.lower() or \
                        result.category.lower() in truth["expected_category"].lower()
                if match: 
                    stats["category_correct"] += 1
                    category_match = "MATCH"
                else:
                    category_match = "MISS"

            status_icon = "✅" if is_correct else "❌"
            print(f"{status_icon} ({duration:.1f}s) | Class: {'OK' if is_correct else 'FAIL'} | Cat: {category_match}")

        except Exception as e:
            print(f"🚨 Technical Failure: {type(e).__name__}")
            stats["failures"] += 1
        
        # Rate limit safety for TritonAI
        time.sleep(1)

    # Calculate Metrics
    total = len(images)
    print("\n" + "=" * 50)
    print("ACCURACY SCORECARD")
    print("=" * 50)
    print(f"Technical Reliability: {(stats['technical_success']/total)*100:6.1f}% (Crashes: {stats['failures']})")
    print(f"Domain Accuracy:       {(stats['classification_correct']/total)*100:6.1f}% (Clothing vs Other)")
    
    # Category accuracy is only measured on actual clothing items
    positives = sum(1 for img in gold_set.values() if img["expected_is_clothing"])
    if positives > 0:
        print(f"Semantic Accuracy:     {(stats['category_correct']/positives)*100:6.1f}% (Category detection)")
    
    print("=" * 50 + "\n")

if __name__ == "__main__":
    run_evaluation(settings.test_images_dir)
