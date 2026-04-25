# Design Document: Wardrobe.AI

## 1. Project Overview

 **Wardrobe.AI** is an intelligent digital wardrobe cataloger designed for Gen-Z users. It transforms raw clothing photos into a structured digital collection using multi-modal Generative AI (TritonGPT). The system prioritizes data integrity and user trust by implementing a "Single-Item" validation model, ensuring every entry in the digital closet is high-quality and accurately categorized.

## 2. Core Requirements & Implementation

### Domain Selection

- **Target:** Individual clothing pieces, footwear, and accessories.
- **Strategy:** To ensure good wardrobe data, the system enforces single-item uploads. Complex outfits or generalized items like a rack of shirts are rejected to maintain clean data and have consistent visualization for the user's digital closet.

### User-Facing Features

- **Dual-View GUI:** 
  - **The Scanner:** For uploading and identifying new fashion items.
  - **The Collection:** A visual gallery grid showcasing verified items.
- **Structured Extraction:** Uses **UCSD TritonGPT (api-llama-4-scout)** to extract `category`, `sub_category`, `color`, `material`, and `vibe`.
- **User-in-the-Loop:** Users review and edit AI drafts to prevent missing metadata or inccorect information.
- **Learning Loop:** The system detects semantic gaps between the AI's draft and the user's final truth. These corrections are persisted in a `user_preferences` table and dynamically injected into future prompts to personalize the AI's fashion vocabulary.
- **Data Persistence:** A relational SQLite database (SQLAlchemy ORM) manages the link between securely hashed image files and their fashion metadata.

## 3. Technical Architecture

- **AI Provider:** UCSD TritonGPT via OpenAI-compatible API.
- **Backend:** FastAPI with Pydantic for schema validation and SQLAlchemy for database management.
- **Frontend:** React + Vite + Tailwind CSS for a modern, responsive interface.
- **Security:**
  - **Image Hashing (SHA-256):** Prevents Path Traversal and deduplicates storage.
  - **Environment Safety:** Centralized Pydantic Settings ensure secrets are never hardcoded.
- **Separable Pipeline:** The extraction logic (`pipeline/extract.py`) is completely decoupled from the GUI, allowing for independent CLI-based evaluation.

## 4. Evaluation Strategy

### Dataset Composition

We curated a balanced dataset of **50 images** across four critical categories:

1. **Positive (20):** Clear shots of diverse clothing types.
2. **Bad (15):** Images with multiple fashion items are rejected.
3. **Noisy (11):** Images of fashion items with noisy data.
4. **Negative (10):** Non-clothing items.

## 5. Key Design Decisions

### Decision 1: The Pivot to Single-Item Validation

- **Concept:** Originally, the system attempted to decompose full outfits into individual items using smart cropping. 
- **Decision:** Moved to a strict Single Item rule. 
- **Rationale:** This decision was made by me to prioritize data quality and system reliability over complexity. By forcing users to upload individual pieces, we ensure the wardrobe remains clean while maintaining overall UX. Though it may be a painpoint because only single piece fashion items are allowed, limiting users from uploading outfits. 

### Decision 2: Active Learning via Dynamic Prompt Injection

- **Concept:** How to implement "Learning" without retraining the model.
- **Decision:** Implemented a system that compares AI drafts with user-verified truth, saves those corrections in a `user_preferences` table, and injects them into the system prompt of future requests.
- **Rationale:** This decision (Mixed Agent/User) allows for instant, localized learning that adapts to a user's unique style vocabulary (e.g., calling a jacket "outerwear" instead of "top") without the high cost and complexity of model fine-tuning.

### Decision 3: Canonical Taxonomy Alignment

- **Concept:** Overcoming semantic disagreement between AI and evaluation truth.
- **Decision:** We refactored both the AI extraction prompt and the evaluation harness to use simple categories like Upper-body, Lower-body, etc.
- **Rationale:** This decision (Agent-led, User-approved) provides an objective "Ground Truth" for accuracy measurement. It moved the project from subjective string matching to a standardized technical framework, resulting in a verifiable jump in semantic accuracy.

