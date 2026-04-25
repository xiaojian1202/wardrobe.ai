import os
import requests
import time
from pathlib import Path

# Final set of verified, high-availability image URLs
DATA_SOURCES = {
    "positive": [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
        "https://images.unsplash.com/photo-1515347619252-60a4bdad358d?w=800",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800",
        "https://images.unsplash.com/photo-1533055640609-24b498dfd74c?w=800",
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800",
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800",
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800",
        "https://images.unsplash.com/photo-1539106609512-7179667ad9f0?w=800",
        "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800",
        "https://images.unsplash.com/photo-1576566582419-1707921a938c?w=800",
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
        "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800"
    ],
    "noisy": [
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800",
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800",
        "https://images.unsplash.com/photo-1479064566235-aa6a00b63805?w=800",
        "https://images.unsplash.com/photo-1560243563-062bff001d68?w=800",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
        "https://images.unsplash.com/photo-1519748771451-a94c59ad3a75?w=800",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
        "https://images.unsplash.com/photo-1445205170230-053b830c6050?w=800"
    ],
    "bad": [
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800",
        "https://images.unsplash.com/photo-1534349762230-e0cadf78f5db?w=800",
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
        "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
        "https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=800",
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800",
        "https://images.unsplash.com/photo-1511130523524-df533532d00f?w=800",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
        "https://images.unsplash.com/photo-1501127122-f385ca6ddd95?w=800"
    ],
    "negative": [
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=800",
        "https://images.unsplash.com/photo-1464380573004-8ca85a08751a?w=800",
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
        "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=800"
    ]
}

def collect():
    save_dir = Path(__file__).parent.parent / "data" / "test_images"
    os.makedirs(save_dir, exist_ok=True)
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    print(f"--- Finalizing 50 Curated Reference Images ---")
    
    count = 0
    for category, urls in DATA_SOURCES.items():
        print(f"\nProcessing {category}...")
        for i, url in enumerate(urls):
            try:
                filename = f"{category}_{i+1}.jpg"
                filepath = save_dir / filename
                
                time.sleep(0.3)
                response = requests.get(url, headers=headers, timeout=15)
                if response.status_code == 200:
                    with open(filepath, "wb") as f:
                        f.write(response.content)
                    print(f"  ✓ {filename}")
                    count += 1
                else:
                    print(f"  ✗ {filename} (HTTP {response.status_code})")
            except Exception as e:
                print(f"  ✗ {filename}: {e}")
                
    print(f"\n--- Complete: {count} images in {save_dir} ---")

if __name__ == "__main__":
    collect()
