import uuid
import datetime
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Index
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class User(Base):
    """
    User model for multi-tenant authentication and profile management.
    """
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ClothingItem(Base):
    """
    SQLAlchemy model for a single-item wardrobe with performance indexes.
    """
    __tablename__ = "clothing_items"
    __table_args__ = (
        Index("ix_clothing_items_user_verified", "user_id", "is_verified"),
    )

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
