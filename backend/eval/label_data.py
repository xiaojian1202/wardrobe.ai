import json
import os
from pathlib import Path

def generate_canonical_gold_set():
    """
    Hardcodes the ground truth using DeepFashion canonical categories.
    """
    data_dir = Path(__file__).parent.parent / "data" / "test_images"
    gold_file = data_dir / "metadata.json"
    
    # Mapping to DeepFashion Canonical Categories:
    # [upper-body, lower-body, full-body, footwear, accessory]
    TRUTH = {
        # Positives
        "positive_1.jpg": "upper-body", "positive_2.jpg": "lower-body", "positive_3.jpg": "upper-body",
        "positive_4.jpg": "upper-body", "positive_5.jpg": "full-body", "positive_6.jpg": "full-body",
        "positive_7.jpg": "footwear", "positive_8.jpg": "upper-body", "positive_9.jpg": "upper-body",
        "positive_10.jpg": "upper-body", "positive_11.jpg": "accessory", "positive_12.jpg": "upper-body",
        "positive_13.jpg": "upper-body", "positive_14.jpg": "upper-body", "positive_15.jpg": "upper-body",
        "positive_16.jpg": "upper-body", "positive_17.jpg": "upper-body", "positive_18.jpg": "upper-body",
        "positive_19.jpg": "upper-body", "positive_20.jpg": "upper-body",
        
        # Accessories
        "accessory1.jpg": "accessory", "accessory2.jpg": "accessory", "accessory3.jpg": "accessory",
        "accessory4.jpg": "accessory", "accessory5.jpg": "accessory", "accessory6.jpg": "accessory",
        "accessory7.jpg": "accessory", "accessory8.jpg": "accessory",

        # Inspo 
        "inspo_1.jpg": "upper-body", "inspo_2.jpg": "upper-body", "inspo_3.jpg": "upper-body", 
        "inspo_4.jpg": "upper-body", "inspo_5.jpg": "upper-body", "inspo_6.jpg": "upper-body",
        "inspo_7.jpg": "upper-body", "inspo_8.jpg": "upper-body", "inspo_9.jpg": "full-body",
        "inspo_10.jpg": "upper-body",

        # Low Quality
        "low_quality_1.jpg": "upper-body", "low_quality_2.jpg": "upper-body", "low_quality_3.jpg": "upper-body",
        "low_quality_4.jpg": "upper-body", "low_quality_5.jpg": "upper-body", "low_quality_6.jpg": "lower-body",
        "low_quality_7.jpg": "upper-body", "low_quality_8.jpg": "upper-body", "low_quality_9.jpg": "upper-body",
        "low_quality_10.jpg": "upper-body"
    }

    gold_set = {}
    images = sorted(list(data_dir.glob("*.jpg")))
    
    for img in images:
        name = img.name
        is_neg = "negative" in name
        
        gold_set[name] = {
            "expected_is_clothing": not is_neg,
            "expected_category": TRUTH.get(name, "unknown") if not is_neg else "unknown"
        }
    
    with open(gold_file, "w") as f:
        json.dump(gold_set, f, indent=2)
    
    print(f"✓ Created Canonical Ground Truth at {gold_file}")

if __name__ == "__main__":
    generate_canonical_gold_set()
