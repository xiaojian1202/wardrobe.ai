import time
import threading
from collections import OrderedDict
from sqlalchemy.orm import Session
from database.models import UserPreference, ClothingItem
from typing import Dict, Any, Optional

# Thread-safe bounded LRU + TTL Cache
class BoundedTTLCache:
    def __init__(self, max_size: int = 500, ttl_seconds: int = 300):
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = threading.Lock()
        self._max_size = max_size
        self._ttl_seconds = ttl_seconds

    def get(self, key: str) -> Optional[str]:
        now = time.time()
        with self._lock:
            if key not in self._cache:
                return None
            data = self._cache[key]
            if now >= data["expiry"]:
                del self._cache[key]
                return None
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return data["context"]

    def set(self, key: str, context: str):
        now = time.time()
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = {
                "context": context,
                "expiry": now + self._ttl_seconds
            }
            # Evict oldest if capacity exceeded
            if len(self._cache) > self._max_size:
                self._cache.popitem(last=False)

    def invalidate(self, key: str):
        with self._lock:
            if key in self._cache:
                del self._cache[key]

_STYLE_CACHE = BoundedTTLCache(max_size=500, ttl_seconds=300)

def invalidate_style_cache(user_id: str):
    """Explicitly removes a user's context from the cache."""
    _STYLE_CACHE.invalidate(user_id)

def record_correction(db: Session, user_id: str, item_id: int, verified_data: dict):
    """
    Detects differences between AI draft and User truth.
    Saves them as persistent user preferences.
    """
    item = db.query(ClothingItem).filter(ClothingItem.id == item_id).first()
    if not item or not item.original_ai_output:
        return

    # Compare every fashion field
    fields = ['category', 'sub_category', 'color', 'material', 'vibe']
    original = item.original_ai_output
    changes_made = False

    for field in fields:
        orig_val = str(original.get(field, "")).lower().strip()
        corr_val = str(verified_data.get(field, "")).lower().strip()

        # Filter out empty or excessively long inputs
        if orig_val and corr_val and orig_val != corr_val and len(corr_val) <= 100:
            changes_made = True
            # Check if this preference already exists
            pref = db.query(UserPreference).filter(
                UserPreference.user_id == user_id,
                UserPreference.context_key == field,
                UserPreference.original_value == orig_val
            ).first()

            if pref:
                # If they keep making this correction, increase confidence
                if pref.corrected_value == corr_val:
                    pref.occurrence_count += 1
                else:
                    # If they changed their mind, update the target
                    pref.corrected_value = corr_val
                    pref.occurrence_count = 1
            else:
                # New preference discovered
                new_pref = UserPreference(
                    user_id=user_id,
                    context_key=field,
                    original_value=orig_val,
                    corrected_value=corr_val
                )
                db.add(new_pref)
    
    if changes_made:
        db.commit()
        invalidate_style_cache(user_id)

def _sanitize_for_prompt(value: str) -> str:
    """Strip newlines, control characters, and quote breaks."""
    return value.replace("\n", " ").replace("\r", " ").replace('"', "'").strip()[:80]

def get_user_style_context(db: Session, user_id: str) -> str:
    """
    Fetches established preferences and formats them as a structured prompt instruction.
    Uses a thread-safe bounded TTL cache to eliminate redundant database load.
    """
    cached_context = _STYLE_CACHE.get(user_id)
    if cached_context is not None:
        return cached_context

    # Cache miss or expired
    prefs = db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.occurrence_count >= 1
    ).all()

    if not prefs:
        _STYLE_CACHE.set(user_id, "")
        return ""

    context_lines = ["USER-SPECIFIC STYLE PREFERENCES:"]
    for p in prefs:
        orig = _sanitize_for_prompt(p.original_value)
        corr = _sanitize_for_prompt(p.corrected_value)
        context_lines.append(f"- When you see '{orig}', the user prefers you categorize it as '{corr}'.")
    
    context_str = "\n".join(context_lines)
    _STYLE_CACHE.set(user_id, context_str)
    return context_str
