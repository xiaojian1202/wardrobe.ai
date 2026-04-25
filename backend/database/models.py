from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.orm import DeclarativeBase
import datetime

class Base(DeclarativeBase):
    pass

class ClothingItem(Base):
    """
    Simplified SQLAlchemy model for a single-item wardrobe.
    """
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True) 
    
    image_hash = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False) 
    
    category = Column(String, nullable=True)
    sub_category = Column(String, nullable=True)
    color = Column(String, nullable=True)
    material = Column(String, nullable=True)
    vibe = Column(String, nullable=True)
    
    is_verified = Column(Boolean, default=False)
    original_ai_output = Column(JSON, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "sub_category": self.sub_category,
            "color": self.color,
            "material": self.material,
            "vibe": self.vibe,
            "is_verified": self.is_verified,
            "file_path": self.file_path
        }

class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    context_key = Column(String, nullable=False)
    original_value = Column(String, nullable=False)
    corrected_value = Column(String, nullable=False)
    occurrence_count = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
