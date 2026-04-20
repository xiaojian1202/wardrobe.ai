# Gemini Project Constraints

*This file contains persistent instructions for AI agents working on FitCheck AI.*

## Development Guidelines
*   **Language:** Python for backend/pipeline, React/TypeScript for the GUI.
*   **AI Integration:** Use **UCSD TritonGPT** (via `openai` Python library).
*   **Access & Configuration:**
*   Endpoint: `https://api.tritonai.ucsd.edu/v1/`
*   Auth: `TRITON_API_KEY` and `TRITON_BASE_URL` in `.env`.
*   Models: Prefer `gpt-4o` or `gpt-4-vision-preview` for multi-modal      tasks.                                                                            *   **Privacy:** Adhere to UCSD's data policies—no P3/P4 data. Never store real user photos in public repos; use placeholders for demos.
*   **Code Style:** Follow PEP 8 for Python and Airbnb Style Guide for React. All code should be modular and easily configurable by the user. Ensure that all code is at production level, matching industry standards with big tech like Google.
*   **Access** Any and all agents are restricted from directly accessing API keys or .env files at all times.
*   **Building** Always ask the user what to build or how to build and never suggest or build right away without user confirmation.
