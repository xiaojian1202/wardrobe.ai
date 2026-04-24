import base64
import json
import re
from io import BytesIO
from typing import Any

import httpx
from dotenv import load_dotenv
from openai import OpenAI, APIConnectionError, APITimeoutError
from PIL import Image
from pillow_heif import register_heif_opener
from pydantic import BaseModel, ConfigDict, ValidationError

# Import the centralized configuration
from utils.config import settings

# Register HEIF opener so Pillow can read .heic files
register_heif_opener()

class ExtractionError(Exception):
    """Raised when the multi-modal extraction pipeline fails."""

class ClothingAttributes(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)
    is_clothing: bool
    category: str
    sub_category: str
    color: str
    material: str
    vibe: str

PROMPT = """
Analyze the uploaded fashion image and return ONLY a valid JSON object.

Step 1: Determine if the image contains clothing, footwear, accessories, or fashion inspiration.
Step 2: If it is NOT fashion-related, set "is_clothing" to false and all other fields to "unknown".
Step 3: If multiple items are present (e.g., a rack, a closet, or an outfit), focus on the MOST PROMINENT or CENTRAL item. If no single item dominates, provide a generalized summary of the collection.

JSON Schema:
{
  "is_clothing": boolean,
  "category": "string",
  "sub_category": "string",
  "color": "string",
  "material": "string",
  "vibe": "string"
}

Rules:
- Be concise.
- Use "unknown" for unclear fields.
- If multiple colors exist, list the primary one or "multi-color".
- No markdown, no commentary.
""".strip()

FALLBACK_VALUES = ClothingAttributes(
    is_clothing=False,
    category="unknown",
    sub_category="unknown",
    color="unknown",
    material="unknown",
    vibe="unknown",
)

def _normalize_to_jpeg(image_bytes: bytes) -> bytes:
    """Resizes and converts image to a small JPEG to ensure gateway compatibility."""
    try:
        img = Image.open(BytesIO(image_bytes))
        
        # Downsample to max 1024px to reduce payload size significantly
        max_size = 1024
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        if img.mode != "RGB":
            img = img.convert("RGB")
        
        buffer = BytesIO()
        # Quality 75 is plenty for AI vision and keeps the file size tiny
        img.save(buffer, format="JPEG", quality=75, optimize=True)
        return buffer.getvalue()
    except Exception as e:
        raise ExtractionError(f"Format processing failed: {str(e)}")

def _extract_json_block(raw_text: str) -> dict[str, Any]:
    """
    Robust JSON extraction using Regex. 
    Handles cases where the model includes conversational text or triple backticks.
    """
    cleaned = raw_text.strip()
    
    # Try to find the outermost curly braces using Regex
    # This handles preamble text or markdown blocks effectively
    match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # Fallback if regex fails, try manual stripping
        json_str = cleaned
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()

    try:
        # Parse the JSON string
        return json.loads(json_str)
    except json.JSONDecodeError as error:
        raise ExtractionError(f"Malformed JSON in model response: {str(error)}")

def _build_client() -> tuple[OpenAI, str]:
    """
    Creates the client using centralized settings.
    """
    base_url = settings.triton_base_url
    if not base_url.endswith("/"):
        base_url += "/"

    client = OpenAI(
        api_key=settings.triton_api_key, 
        base_url=base_url,
        timeout=120.0
    )
    return client, settings.triton_model

def _fallback_from_filename(filename: str) -> ClothingAttributes:
    normalized = filename.lower()
    guesses = FALLBACK_VALUES.model_copy(deep=True)
    
    # Simple keyword-based inference for fallback
    if any(x in normalized for x in ["jacket", "jeans", "shirt", "dress", "pant", "top", "shoe"]):
        guesses.is_clothing = True

    if "dress" in normalized: guesses.category = "dress"
    elif any(x in normalized for x in ["shirt", "tee", "top"]): guesses.category = "top"
    elif any(x in normalized for x in ["jean", "pant", "trouser"]): guesses.category = "bottom"
    if "black" in normalized: guesses.color = "black"
    return guesses

def extract_attributes(
    image_bytes: bytes,
    mime_type: str,
    filename: str,
) -> ClothingAttributes:
    try:
        # Step 1: Normalize and shrink image
        jpeg_bytes = _normalize_to_jpeg(image_bytes)
        
        # Step 2: Prepare client and payload
        client, model_name = _build_client()
        image_base64 = base64.b64encode(jpeg_bytes).decode("utf-8")
        
        # Step 3: API call
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            },
                        },
                    ],
                }
            ]
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ExtractionError("Empty response from AI.")
            
        payload = _extract_json_block(content)
        return ClothingAttributes.model_validate(payload)

    except (APIConnectionError, APITimeoutError) as e:
        fallback = _fallback_from_filename(filename)
        if fallback.is_clothing: 
            return fallback
        raise ExtractionError(f"Connection failed: {str(e)}")
    except Exception as error:
        fallback = _fallback_from_filename(filename)
        if fallback.is_clothing:
            return fallback
        raise ExtractionError(f"Extraction failed: {str(error)}")
