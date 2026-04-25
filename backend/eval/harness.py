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
        print(f"Error: Run label_data.py first.")
        return

    with open(gold_file, "r") as f:
        gold_set = json.load(f)

    images = sorted(list(image_folder.glob("*.jpg")))
    
    print(f"\n--- FitCheck AI [CANONICAL EVALUATION] ---")
    print("-" * 75)
    
    stats = {"tech": 0, "domain": 0, "semantic": 0, "fails": 0}
    total = len(images)

    for img_path in images:
        name = img_path.name
        truth = gold_set.get(name)
        if not truth: continue

        print(f"{name:20}", end=" ", flush=True)
        
        try:
            with open(img_path, "rb") as f:
                img_bytes = f.read()
            
            result = extract_attributes(img_bytes, "image/jpeg", name)
            stats["tech"] += 1
            
            is_correct_domain = result.is_clothing == truth["expected_is_clothing"]
            if is_correct_domain: stats["domain"] += 1
            
            status = "N/A"
            if truth["expected_is_clothing"]:
                expected = truth["expected_category"]
                # Match if expected category is in ANY of the AI's extracted items
                found = any(expected == item.category.lower() for item in result.items)
                
                if found:
                    stats["semantic"] += 1
                    status = "✅ MATCH"
                else:
                    ai_cats = [it.category for it in result.items]
                    status = f"❌ MISS (AI: {', '.join(ai_cats)})"
            else:
                status = "🚫 REJECTED" if is_correct_domain else "⚠️ FALSE POSITIVE"

            print(f"| {status}")

        except Exception as e:
            print(f"| 🚨 FAIL: {str(e)[:40]}")
            stats["fails"] += 1
        
        time.sleep(0.5)

    positives = sum(1 for img in gold_set.values() if img["expected_is_clothing"])
    print("\n" + "=" * 75)
    print(f"FINAL SCORECARD (DeepFashion Taxonomy)")
    print(f"Domain Accuracy:   {(stats['domain']/total)*100:.1f}%")
    print(f"Semantic Accuracy: {(stats['semantic']/positives)*100:.1f}%")
    print(f"Reliability:       {(stats['tech']/total)*100:.1f}%")
    print("=" * 75 + "\n")

if __name__ == "__main__":
    run_evaluation(settings.test_images_dir)
