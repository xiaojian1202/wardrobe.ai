from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.orm import DeclarativeBase
import datetime

class Base(DeclarativeBase):
    pass

class ClothingItem(Base):
    """
    SQLAlchemy model for a wardrobe item.
    Designed for scalability to PostgreSQL and robust security.
    """
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True) # Placeholder for auth in future
    
    # Image Storage
    image_hash = Column(String, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    
    # Extracted Attributes (after verification)
    category = Column(String, nullable=False)
    sub_category = Column(String, nullable=False)
    color = Column(String, nullable=False)
    material = Column(String, nullable=False)
    vibe = Column(String, nullable=False)
    
    # Learning Loop Data
    is_verified = Column(Boolean, default=False)
    original_ai_output = Column(JSON, nullable=True) # Tracks corrections for AI learning

    def to_dict(self):
        """Helper to convert to a dictionary for API responses."""
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
