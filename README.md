# FitCheck AI (Document Scanner Assignment)

This project is built for the [UCSD CSE 115/215 Document Scanner Assignment](https://ucsd-cse-115-215.github.io/sp26/assignments/doc-scanner-assignment.html).

FitCheck AI is a full-stack image scanning app for clothing analysis.

- **Backend:** FastAPI (`backend/`)
- **Frontend:** Vite + React + Tailwind CSS (`frontend/`)
- **AI Extraction:** UCSD TritonGPT API (OpenAI-compatible)

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- A Triton AI API key

## 1) Project Setup

```bash
git clone <your-repo-url>
cd fitcheck-ai
```

### Backend setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` (Note: `.env` is ignored by git):

```env
TRITON_API_KEY=your_api_key_here
TRITON_BASE_URL=https://api.tritonai.ucsd.edu/v1/
TRITON_MODEL=claude-opus-4-6-v1
```

### Frontend setup (Vite + React)

```bash
cd frontend
npm install
```

## 2) Running the App

### Start Backend
```bash
cd backend
source venv/bin/activate
python main.py
```
*Backend runs at `http://localhost:8000`*

### Start Frontend
```bash
cd frontend
npm run dev
```
*Frontend runs at `http://localhost:5173`*

## 3) Testing & Evaluation

### Automated Test Harness
The assignment requires an automated evaluation. Run it via:
```bash
cd backend
source venv/bin/activate
python eval/harness.py
```

### Manual Testing
1. Open `http://localhost:5173`.
2. Upload a clothing-related image (JPEG/PNG/WEBP/HEIC).
3. Click **Start Scan**.
4. Review, edit, and click **Verify**.

## Project Structure
- `backend/pipeline/`: AI extraction logic and normalization.
- `backend/utils/config.py`: Centralized Pydantic settings.
- `backend/eval/`: Independent test harness for evaluation.
- `frontend/src/services/api.js`: Abstracted API interaction logic.

## Troubleshooting
- **Connection Error:** Ensure `TRITON_API_KEY` is valid and you have a stable internet connection.
- **Invalid Format:** Ensure the image is JPEG, PNG, WEBP, or HEIC.
- **Non-Clothing Rejected:** The AI is trained to reject non-fashion items (e.g., pets, food).
