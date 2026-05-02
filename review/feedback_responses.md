# Feedback Responses

## 1. Image Optimization for Cost and Latency Reduction

### **Suggestion**
*“One suggestion I have that could keep the accuracy but improve the cost is to compress and lower the resolution of the user’s image. This would decrease the image tokens that are passed to the LLM for analysis and you could find a good compromise between utilizing a more compressed image and sacrificing on the accuracy.”*

### **Action Taken**
We have implemented a optimization pipeline to reduce both the token cost of LLM calls and the latency of UI rendering.

- **LLM Extraction Optimization (`backend/pipeline/extract.py`):**
    - **Reduced Resolution:** The extraction pipeline now resizes images to a maximum dimension of **384x384** pixels (previously 512x512). Since vision models often process images in 512px tiles, staying under this limit ensures the entire image fits within a single tile, minimizing token usage.
    - **Increased Compression:** The JPEG quality for extraction has been reduced to **60**. This significantly reduces the base64-encoded payload size.
    - **Entropy Optimization:** Enabled JPEG optimization (`optimize=True`) to further strip metadata and improve compression efficiency.

- **Storage/UI Optimization (`backend/utils/storage.py`):**
    - **Thumbnail Quality:** Reduced thumbnail JPEG quality to **75** and enabled optimization. This speeds up the rendering of the Verification Queue and the Wardrobe gallery without noticeable visual degradation for the user.

---

## 2. In-Memory Caching for Style Context

### **Suggestion**
*“I would implement caching for the get_user_style_context function. As the user provides more feedback, the context block grows and the database query becomes slower... add an in-memory cache keyed by user_id with a TTL of a few minutes, invalidated only when a new correction is written.”*

### **Action Taken**
We have implemented a TTL-based in-memory caching layer for the Active Learning Loop in `backend/pipeline/learning.py`.

- **Caching Mechanism:**
    - The `get_user_style_context` function now checks a global `_STYLE_CONTEXT_CACHE` before querying the database.
    - The cache has a **5-minute TTL (Time-To-Live)** to ensure memory efficiency and eventual consistency.
    - This is particularly beneficial for **Batch Scans**, where multiple images are processed in a single request—turning $N$ redundant database queries into 1.

- **Intelligent Invalidation:**
    - The cache is **explicitly invalidated** whenever a user submits a new correction via `record_correction`.
    - This ensures that if a user corrects a "outerwear" to "jacket," the very next scan will immediately pick up that correction, maintaining the nature of the learning loop without the overhead of repeated database round-trips for every scan.
