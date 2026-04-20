# Design Document: Wardrobe.AI (OOTD App)

## 1. Project Overview
**Wardrobe.AI** is a digital wardrobe and styling assistant designed for high school and college students. It helps users digitize their physical closet and  "Inspo" boards to generate personalized outfit recommendations using Generative AI.

## 2. Core Requirements
### Domain Selection
*   **Domain:** Personal clothing items (flat-lays/selfies), clothing tags, and social media screenshots (Instagram/TikTok/Pinterest).
*   **Target Audience:** Students/Gen Z interested in fashion and outfit planning.

### User-Facing Features
*   **GUI:** A web-based interface for uploading images and managing the digital closet.
*   **Document Upload:** Support for uploading photos of clothes, tags, and inspiration screenshots.
*   **Structured Extraction:** Uses GenAI to extract data (Category, Color, Style, Material) into a structured JSON format.
*   **User-in-the-Loop:** Users can review and edit the AI-generated tags (e.g., correcting "Red" to "Burgundy" or changing "Formal" to "Streetwear").
*   **Learning from Corrections:** The system will track user edits to refine future classification (e.g., learning that this specific user categorizes "Oversized Blazers" as "Casual").
*   **Data Persistence:** A local database or JSON store to keep the user's closet data across sessions.
*   **Value-Add Tasks:** 
    *   **The Outfit Generator:** Secondary GenAI query that uses the extracted closet JSON to create outfits based on a specific prompt (e.g., "Pack for a 3-day trip to NYC in the fall").
    *   **Inspo Matcher:** Comparing "Inspo" screenshots against the user's actual closet to suggest similar items they already own.

## 3. Technical Constraints & Architecture
*   **Multi-Modality:** Handling diverse inputs (clear product shots vs. cluttered screenshots vs. text-heavy clothing tags).
*   **AI Provider:** Using **UCSD TritonGPT** (LiteLLM/OpenAI-compatible gateway) for multi-modal analysis.
*   **Nondeterminism Management:** Implementing standardized prompt schemas and multiple retries/validation logic to ensure consistent style tagging.
*   **Separable Architecture:** 
    *   `pipeline/`: Logic for image processing and AI extraction.
    *   `web/`: GUI for user interaction.
    *   `eval/`: Independent test harness to run the evaluation suite.
*   **Automation:** A CLI-driven test harness to evaluate extraction accuracy against a ground-truth dataset.

## 4. Evaluation Strategy
*   **Dataset:**
    *   **Positive Examples:** Clear clothing flat-lays, zoomed-in tag photos, and high-quality Pinterest screenshots.
    *   **Negative Examples:** Photos of non-clothing items (furniture, food), extremely blurry/dark photos, and "Out of Domain" documents (like receipts).
*   **Argument for Adequacy:** The suite is designed to test the system's ability to distinguish between styles (e.g., "Minimalist" vs "Maximalist") and its robustness against varied lighting and backgrounds commonly found in dorm rooms.

## 5. Future Scope
*   "Dupe" Finder: Linking extracted data to affordable alternatives on Depop or Poshmark.
*   Social Sharing: Exporting "Fit Check" graphics for TikTok/IG stories.
