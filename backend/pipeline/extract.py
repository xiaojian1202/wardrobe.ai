import base64
import json
import re
from io import BytesIO
from typing import Any, List, Optional

import httpx
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

class FashionItem(BaseModel):
    category: str 
    sub_category: str 
    color: str
    material: str
    vibe: str

class ExtractionResult(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)
    is_clothing: bool
    rejection_reason: Optional[str] = None # Why was it rejected?
    items: List[FashionItem]

PROMPT = """
You are a wardrobe cataloger. Your goal is to identify SINGLE clothing items.

### RULES:
1. SINGLE ITEM ONLY: If the image contains multiple distinct items (an OUTFIT) or a collection of items (a RACK/PILE), you MUST set "is_clothing" to false.
2. REJECTION LOGIC:
   - If multiple items are present: set "is_clothing": false and "rejection_reason": "multiple_items".
   - If non-clothing (pets, food, room): set "is_clothing": false and "rejection_reason": "not_clothing".
3. ACCEPTANCE: Only accept if the image is focused on ONE specific piece of clothing, footwear, or accessory.

### CATEGORIES:
Map to one of: [upper-body, lower-body, full-body, footwear, accessory, outfit]

JSON Schema:
{
  "is_clothing": boolean,
  "rejection_reason": "none | multiple_items | not_clothing",
  "items": [
    {
      "category": "string",
      "sub_category": "string",
      "color": "string",
      "material": "string",
      "vibe": "string"
    }
  ]
}
""".strip()

FALLBACK_VALUES = ExtractionResult(is_clothing=False, items=[])

def _normalize_to_jpeg(image_bytes: bytes) -> bytes:
    try:
        img = Image.open(BytesIO(image_bytes))
        img.thumbnail((512, 512), Image.Resampling.LANCZOS) # High-speed thumb
        if img.mode != "RGB": img = img.convert("RGB")
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=75)
        return buffer.getvalue()
    except Exception as e:
        raise ExtractionError(f"Format failed: {str(e)}")

def _extract_json_block(raw_text: str) -> dict[str, Any]:
    match = re.search(r"(\{.*\})", raw_text.strip(), re.DOTALL)
    if not match: raise ExtractionError("No JSON found.")
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        raise ExtractionError("Malformed JSON.")

def _build_client() -> tuple[OpenAI, str]:
    base_url = settings.triton_base_url
    if not base_url.endswith("/"): base_url += "/"
    client = OpenAI(api_key=settings.triton_api_key, base_url=base_url, timeout=60.0)
    return client, settings.triton_model

def extract_attributes(image_bytes: bytes, mime_type: str, filename: str, user_context: str = "") -> ExtractionResult:
    try:
        jpeg_bytes = _normalize_to_jpeg(image_bytes)
        client, model_name = _build_client()
        image_base64 = base64.b64encode(jpeg_bytes).decode("utf-8")
        
        full_prompt = PROMPT
        if user_context:
            full_prompt = f"{user_context}\n\n{PROMPT}"
            
        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": [{"type": "text", "text": full_prompt}, {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}]}]
        )
        return ExtractionResult.model_validate(_extract_json_block(response.choices[0].message.content))
    except Exception as error:
        raise ExtractionError(f"Extraction failed: {str(error)}")
