# Wardrobe.AI

Wardrobe.AI is an intelligent digital wardrobe cataloger designed for Gen-Z users. It transforms raw clothing photos into a structured digital collection using multi-modal Generative AI (UCSD TritonGPT).

---

## 🌟 Key Features

- **Single-Item Extraction:** Fashion metadata extraction (Category, Material, Vibe) optimized for single-piece cataloging.
- **Active Learning Loop:** The system detects user corrections and propagates them to future AI prompts, personalizing the extraction vocabulary over time.
- **User Preference:** Interactive verification where users can refine AI drafts before they enter the wardrobe.
- **Secure Persistence:** SHA-256 image hashing to prevent Path Traversal and ensure storage deduplication.
- **Performance Evaluation:** Integrated CLI test harness for accuracy scoring against canonical taxonomies.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Triton AI API Key (configured in `backend/.env`)

### 1. Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initializing the database (Required for first run)
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

```bash
cd backend
source venv/bin/activate
python eval/harness.py
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

