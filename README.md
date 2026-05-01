# Wardrobe.AI

Wardrobe.AI is a digital wardrobe cataloger primarily targetted for Gen-Z users. It transforms raw clothing photos into a structured digital collection using multi-modal Generative AI.

**[Watch the Demo Video](https://youtu.be/LGtXzNncL9U)**

---

## 🌟 Key Features

- **Batch Processing & Sequential Verification:** Support for multi-file uploads with a dedicated "Verification Queue" to streamline high-volume cataloging while maintaining human-in-the-loop quality.
- **Strict Single-Item Extraction:** Fashion metadata extraction (Category, Material, Vibe) optimized for single-piece cataloging.
- **Active Learning Loop:** The system detects user corrections and propagates them to future AI prompts, personalizing the extraction vocabulary over time.
- **User-in-the-Loop:** Interactive verification station where users can refine AI drafts before they saving to the wardrobe.
- **Secure Persistence:** SHA-256 image hashing to prevent Path Traversal and ensure storage deduplication.
- **Professional Performance Audit:** Integrated CLI test harness for accuracy scoring.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Triton AI API Key (configured in `backend/.env`)

### 1. Backend Setup (FastAPI)

Navigate to the backend directory and set up your environment:

```bash
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy the example file and add your credentials
cp .env.example .env
```

> **Note:** Open `.env` and replace `your_api_key_here` and `model_name_here` with your actual Triton AI credentials.

```bash
# Initializing the database
python reinit_db.py

# Running the server
python main.py
```

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

*App is available at [http://localhost:5173](http://localhost:5173)*

---

## 📊 Performance & Evaluation

The system is evaluated against a curated dataset of 50 images, including low-quality mobile shots and non-clothing negative examples.

### Run Accuracy Audit

The evaluation harness supports targeted testing via CLI flags:

```bash
# Run full evaluation
python eval/harness.py

# Test a single specific image
python eval/harness.py --file positive_1.jpg

# Test a subset by category (e.g., negative, noisy, positive)
python eval/harness.py --category negative

# Limit the number of tests to perform
python eval/harness.py --limit 10
```

### Evaluation Definitions

- **True Positive:** Correctly identified a single clothing item.
- **True Negative:** Correctly rejected a non-clothing item or a complex outfit.
- **False Positive:** Incorrectly accepted a non-clothing item (Hallucination).
- **Semantic Error:** Both agreed it was clothing, but AI assigned the wrong category.

---

## 📁 Project Structure

- `backend/pipeline/`: AI extraction and Active Learning logic.
- `backend/database/`: SQLAlchemy models and session management.
- `backend/eval/`: Evaluation harness and data collection scripts.
- `frontend/src/pages/`: Modular Scanner (Home) and Collection (Wardrobe) views.
- `transcripts/`: Documentation of AI agent development sessions.

---

## 📝 Reviewer FAQ

#### a. Summary

**Wardrobe.AI** is a digital wardrobe cataloger designed for Gen-Z users to transform raw clothing photos into a structured digital collection. The project takes **image documents** (JPEG, PNG, WEBP, and HEIC) and presents a **web-based GUI** featuring a "Scanner" for identifying new items and a "Collection" gallery for browsing the verified wardrobe. It extracts structured fashion metadata—including **category, sub-category, color, material, and vibe**—while enforcing a strict "Single-Item" rule to ensure every entry in the digital closet is a high-quality, individual piece.

#### b. GUI/backend interface

The programmatic interface between the GUI and the backend is a RESTful API endpoint.

- **URL Routes:** `/scan` (single) and `/batch-scan` (multiple).
- **HTTP Method:** `POST`
- **Parameters:** A `file` (or multiple `files`) parameter containing the image(s), sent as `multipart/form-data`.
- **API Call:** The frontend (React) calls this via the `api.scanImage(file)` or `api.batchScanImages(files)` services (found in `frontend/src/services/api.js`), which use the browser's `fetch` API.
- **Backend Implementation:** The FastAPI server receives these in `backend/main.py`. The batch endpoint iterates through the files, initiating the AI extraction pipeline for each and returning a collection of drafts for the frontend's Verification Queue.


#### c. User data in the prompt

User data has a direct effect on the extraction prompt through an **Active Learning Loop**.

- **Mechanism:** When a user verifies or corrects the AI-extracted attributes, the system records the difference between the AI's draft and the user's correction in a `user_preferences` table (handled in `backend/pipeline/learning.py`).
- **Prompt Injection:** In `backend/pipeline/extract.py`, the `extract_attributes` function calls `get_user_style_context`, which fetches these saved corrections and formats them into a "USER-SPECIFIC STYLE PREFERENCES" block. This context is then **templated directly into the top of the system prompt** (e.g., *“When you see 'jacket', the user prefers you categorize it as 'outerwear'”*), allowing the LLM to personalize future extractions based on the user's specific vocabulary and feedback.

