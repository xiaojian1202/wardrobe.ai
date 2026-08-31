# Wardrobe.AI

> An intelligent, single-item digital wardrobe cataloger powered by multi-modal Generative AI (UCSD TritonGPT / OpenAI-compatible Vision API).

[![Frontend: React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-blue)](https://react.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20AsyncEngine-009688)](https://fastapi.tiangolo.com/)
[![State: TanStack Query](https://img.shields.io/badge/State-TanStack%20Query%20v5-FF4154)](https://tanstack.com/query/latest)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC)](https://tailwindcss.com/)

---

## 🌟 Overview & Key Capabilities

- **Strict Single-Item Vision Protocol**: High-precision boundary validation that rejects cluttered or multi-piece outfits to maintain clean taxonomy.
- **Parallel Asynchronous Batch Ingestion**: Concurrent multi-image scanning bounded by `asyncio.Semaphore(5)` for sub-second processing.
- **Active Learning Feedback Loop**: Automatically captures user verifications to inject personalized style vocabulary into future AI prompts via a thread-safe `BoundedTTLCache`.
- **Strictly-Typed React 19 + TypeScript**: Full TypeScript migration with TanStack Query caching, optimistic UI updates, and instant rollback.
- **Luxury Neumorphic Design & Theme Modes**: Light (Warm Cream & Espresso), Dark (Obsidian & Radiant Amber), and System mode toggle with 60fps micro-interactions.
- **Database Indexing & Native SQL Aggregations**: Sub-millisecond queries with composite B-Tree indexing on `(user_id, is_verified)`.
- **Content-Addressed Storage**: SHA-256 image hashing to prevent duplicate files and path traversal risks.

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python**: 3.11+ (Python 3.11 – 3.14 supported)
- **Node.js**: 18+ and **npm** 9+
- **Triton AI API Key** (or OpenAI-compatible Vision API endpoint)

---

### 1. Backend Setup (FastAPI + Async Engine)

Open a terminal and start the backend service:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
```

> **Configuration**: Edit `backend/.env` to configure your credentials:
> ```env
> TRITON_API_KEY=your_actual_api_key_here
> TRITON_BASE_URL=https://api.tritonai.ucsd.edu/v1/
> TRITON_MODEL=gpt-4o
> ```

```bash
# 5. Initialize the database schema
python reinit_db.py

# 6. Start the FastAPI async server
python main.py
```

The API server will start on [http://localhost:8000](http://localhost:8000) (Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)).

---

### 2. Frontend Setup (React 19 + TypeScript + Vite)

In a **separate terminal window**, run the frontend web application:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```

The web application is accessible at [http://localhost:5173](http://localhost:5173).

#### Frontend Production Build & Quality Checks

```bash
cd frontend

# Run TypeScript compilation check and Vite production bundle
npm run build

# Run ESLint validation
npm run lint
```

---

## 📊 Performance, Tests & Evaluation Harness

### Run Automated Backend Performance Test

Verify cache eviction, SQL aggregations, and API health:

```bash
cd backend
source venv/bin/activate
python eval/test_performance.py
```

### Run Multi-Modal Accuracy Audit

Test single-item extraction accuracy across the 50-image benchmark dataset:

```bash
cd backend
source venv/bin/activate

# Run full evaluation across all categories
python eval/harness.py

# Test a single specific image
python eval/harness.py --file positive_1.jpg

# Test a subset by category (positive, negative, noisy, bad)
python eval/harness.py --category negative

# Limit the number of samples
python eval/harness.py --limit 10
```

---

## 📁 Repository Structure

```text
wardrobe.ai/
├── backend/
│   ├── main.py                  # FastAPI route handlers & parallel batch endpoints
│   ├── config.py                # Pydantic BaseSettings environment loader
│   ├── database/
│   │   ├── models.py            # Indexed SQLAlchemy models (ClothingItem, UserPreference)
│   │   └── session.py           # SQLite connection & sessionmaker
│   ├── pipeline/
│   │   ├── extract.py           # AsyncOpenAI inference & threadpool image normalization
│   │   └── learning.py          # BoundedTTLCache & dynamic prompt injection
│   ├── eval/
│   │   ├── harness.py           # Multi-category accuracy benchmark CLI
│   │   └── test_performance.py  # Cache, SQL, and API integration test harness
│   ├── requirements.txt         # Backend Python dependencies
│   └── reinit_db.py             # Database reset & seeding utility
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx       # Brand header & ThemeToggle
│   │   │   ├── StyleDashboard.tsx # Style analytics with Neumorphic slabs
│   │   │   ├── DebugForm.tsx    # Raw vision metadata inspector
│   │   │   └── ui/              # Button & ThemeToggle primitives
│   │   ├── context/             # Light / Dark / System theme provider
│   │   ├── hooks/               # TanStack Query hooks (useWardrobe, useBatchScan, etc.)
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Vision Scanner & Batch Review Queue
│   │   │   └── Wardrobe.tsx     # Wardrobe Gallery, Search, and Edit Modal
│   │   ├── services/api.ts      # Type-safe API client
│   │   ├── types/index.ts       # Canonical TypeScript models
│   │   ├── index.css            # Neumorphic dual-shadow tokens & theme palette
│   │   └── main.tsx             # React 19 root
│   ├── tsconfig.json            # Strict TypeScript configuration
│   └── package.json             # Frontend dependencies & scripts
└── README.md                    # Developer setup & documentation
```

---

## 🛠️ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `npm error ENOENT: no such file or directory, open '.../package.json'` | Running `npm run dev` in root directory instead of `frontend/` | Run `cd frontend && npm run dev` |
| `Scanning failed: 401 Unauthorized` | Missing or invalid API key in `backend/.env` | Check `TRITON_API_KEY` in `backend/.env` |
| `Database locked` or `Table missing` | Database uninitialized | Run `python reinit_db.py` in `backend/` |
| Port `8000` or `5173` already in use | Stale process running | Stop existing process with `lsof -ti:8000 \| xargs kill -9` |
