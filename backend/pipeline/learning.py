from sqlalchemy.orm import Session
from database.models import UserPreference, ClothingItem
from typing import List

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

    for field in fields:
        orig_val = original.get(field, "").lower().strip()
        corr_val = verified_data.get(field, "").lower().strip()

        # If they differ, we have a correction!
        if orig_val and corr_val and orig_val != corr_val:
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
    
    db.commit()

def get_user_style_context(db: Session, user_id: str) -> str:
    """
    Fetches established preferences and formats them as a system prompt instruction.
    Only includes preferences with high confidence (occurrence > 1).
    """
    prefs = db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.occurrence_count >= 1 # Lowered to 1 for immediate demo feedback
    ).all()

    if not prefs:
        return ""

    context_lines = ["USER-SPECIFIC STYLE PREFERENCES:"]
    for p in prefs:
        context_lines.append(f"- When you see '{p.original_value}', the user prefers you categorize it as '{p.corrected_value}'.")
    
    return "\n".join(context_lines)
