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
You are a wardrobe cataloger. Your goal is to identify SINGLE clothing items based on the PRIMARY FOCUS of the image.

### RULES:
1. PRIMARY FOCUS RULE: If the image clearly focuses on one specific item (by size, framing, or intent), you MUST extract ONLY that item. Ignore incidental background elements that do not compete for attention (e.g., a tiny bit of a hanger, a distant wall, or blurred-out background objects).
2. CLUTTER & MULTI-ITEM REJECTION: If the image contains multiple DISTINCT items that are clearly visible and compete for attention (e.g., a pile of accessories, a shelf of shoes, or a cluttered table where items are overlapping or packed together), you MUST set "is_clothing" to false and "rejection_reason" to "multiple_items". We prioritize clean, single-item cataloging over cluttered or busy scenes.
3. DEFINITION OF A SINGLE ITEM: A natural pair designed to be worn together (e.g., a pair of shoes, pair of earrings, pair of socks) or a matching set presented as a single logical product (e.g., a jewelry set) MUST be treated as ONE single item.
4. STRICT OUTFIT REJECTION: If the image contains multiple DISTINCT types of clothing items without a single clear focal point (e.g., a full-body mirror selfie showing a top and bottom equally, or a flat lay of an entire outfit), you MUST set "is_clothing" to false and "rejection_reason" to "multiple_items". We cannot catalog outfits.
5. REJECTION LOGIC:
   - If it is an outfit, a cluttered scene, or multiple unrelated items: set "is_clothing": false and "rejection_reason": "multiple_items".
   - If non-clothing (pets, food, room): set "is_clothing": false and "rejection_reason": "not_clothing".
6. ACCEPTANCE: Only accept if the image has ONE clear primary piece of clothing, footwear, accessory, pair, or set that is prominently featured and easily distinguishable from any background elements.

### OUTPUT FORMAT:
Output ONLY a valid JSON object. Do not include any conversational text or markdown formatting outside the JSON.

### CATEGORIES:
Map to one of: [upper-body, lower-body, full-body, footwear, accessory]

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
        # Optimized for token reduction while maintaining extraction accuracy
        img.thumbnail((384, 384), Image.Resampling.LANCZOS)
        if img.mode != "RGB": img = img.convert("RGB")
        buffer = BytesIO()
        # quality=60 + optimize=True significantly reduces payload size
        img.save(buffer, format="JPEG", quality=60, optimize=True)
        return buffer.getvalue()
    except Exception as e:
        raise ExtractionError(f"Format failed: {str(e)}")

def _extract_json_block(raw_text: str) -> dict[str, Any]:
    # 1. Try to find content inside markdown code blocks first
    code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
    if code_block_match:
        content = code_block_match.group(1)
    else:
        # 2. Fallback to finding the first { and last }
        json_match = re.search(r"(\{.*\})", raw_text, re.DOTALL)
        if not json_match:
            raise ExtractionError(f"No JSON found in response: {raw_text[:100]}...")
        content = json_match.group(1)
    
    try:
        # Clean up common LLM artifacts like trailing commas before parsing
        # (Very basic cleanup, json.loads is still primary)
        cleaned_content = re.sub(r",\s*([\]}])", r"\1", content)
        return json.loads(cleaned_content)
    except json.JSONDecodeError as e:
        # Final attempt with original content if cleanup failed/was unnecessary
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise ExtractionError(f"Malformed JSON: {str(e)}")

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
        try:
            return ExtractionResult.model_validate(_extract_json_block(response.choices[0].message.content))
        except Exception as ve:
            raise ve
    except Exception as error:
        raise ExtractionError(f"Extraction failed: {str(error)}")
