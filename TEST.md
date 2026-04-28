# Testing Plan

This document outlines a testing strategy.

---

## 1. Backend Testing (Python / FastAPI)

### 1.1 Extraction Pipeline (`backend/pipeline/extract.py`)

- **Normalization Test:** Verify `_normalize_to_jpeg` correctly resizes high-res images to 400px and converts HEIC/PNG to JPEG.
- **JSON Parsing Test:** Test `_extract_json_block` with various AI outputs (markdown-wrapped JSON, conversational preamble, malformed JSON).
- **Prompt Injection Test:** Verify that the "Visual Audit" protocol correctly rejects non-fashion prompts.
- **Model Compatibility:** Verify `_build_client` correctly loads environment variables and initializes the OpenAI client with proper timeouts.

### 1.2 Learning Loop (`backend/pipeline/learning.py`)

- **Correction Detection:** Verify `record_correction` correctly identifies differences between AI draft and user verification.
- **Preference Persistence:** Ensure corrections are saved to the `user_preferences` table with incrementing `occurrence_count`.
- **Context Propagation:** Verify `get_user_style_context` generates the correct system prompt instructions based on stored preferences.

### 1.3 Persistence & Storage (`backend/database/` & `backend/utils/storage.py`)

- **Image Hashing:** Verify `save_image_securely` generates consistent SHA-256 hashes and prevents duplicate file writes.
- **Path Traversal Prevention:** Ensure uploaded filenames are sanitized and stored via hash to prevent directory escape.
- **Schema Integrity:** Verify all `ClothingItem` columns (including nullable attributes) handle missing data without `IntegrityError`.
- **Atomic Transactions:** Ensure DB commits and file writes are synchronized.

### 1.4 API Integration (`backend/main.py`)

- **Endpoint Validation:**
  - `POST /scan`: Validates file types, handles AI failures, and saves 'Draft' records.
  - `POST /items/{id}/verify`: Correctly updates records and marks `is_verified=True`.
  - `GET /wardrobe`: Returns only verified items.
  - `GET /wardrobe/stats`: Correctly aggregates vibes, colors, and categories.
  - `DELETE /items/{id}`: Successfully removes records from the database.
- **CORS Middleware:** Verify allowed origins match the frontend environment.

---

## 2. Frontend Testing (React / Vite)

### 2.1 API Service (`frontend/src/services/api.js`)

- **Error Mapping:** Verify that backend error messages (422, 502) are correctly mapped to user-friendly strings.
- **Image URL Construction:** Ensure `getImageUrl` correctly prefixes paths with the backend's `BASE_URL`.
- **Async Handling:** Verify all functions handle network timeouts and rejections gracefully.

### 2.2 Component & Page Logic

- **Scanner Flow (`Home.jsx`):**
  - Test "Change Image" resets file state.
  - Verify "Initialize Vision" triggers loading state and locks verification form.
  - Ensure verification form inputs update local state before calling API.
- **Wardrobe Experience (`Wardrobe.jsx`):**
  - **Scroll Lock:** Verify background scrolling is disabled when the detail modal is open.
  - **Delete Confirmation:** Ensure the confirmation overlay prevents accidental deletions.
  - **Search/Filter:** Verify filtering by vibe or sub-category updates the visible grid in real-time.
- **Dashboard (`StyleDashboard.jsx`):** Ensure the stats cards correctly display data passed from the parent page.

---

## 3. End-to-End (E2E) User Use Cases

### 3.1 Standard Use

1. User selects a single clothing image.
2. User clicks "Upload".
3. AI returns accurate tags.
4. User clicks "Verify".
5. Item appears in Wardrobe with correct stats.

### 3.2 User Corrections

1. User scans a puffer jacket; AI says "upper-body".
2. User corrects it to "outerwear" and verifies.
3. User scans a second Jacket.
4. AI **automatically** returns "outerwear" in the first draft.

### 3.3 Safety Use Case

1. User uploads a photo of a dog.
2. System correctly rejects with: "This doesn't look like clothing."
3. User tries to upload a `.txt` file.
4. Frontend blocks selection; Backend returns 400.

---

## 4. Performance & Reliability

- **Concurrent Requests:** Verify the backend handles multiple simultaneous uploads without thread-lock (SQLite `check_same_thread=False`).
- **Payload Limits:** Test with 10MB+ images to ensure 400px downsampling prevents connection drops.
- **Stability:** Run the `eval/harness.py` across the full 50-image set to confirm 100% technical reliability.

