"""User settings models for the AI chatbot."""

from typing import Optional
from pydantic import BaseModel


class UserSettings(BaseModel):
    """User settings model."""
    id: str
    user_id: str
    model_id: str = "llama-3.3-70b-versatile"
    temperature: float = 0.7
    max_tokens: int = 4096
    top_p: float = 0.9
    custom_instructions: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserSettingsUpdate(BaseModel):
    """Model for updating user settings."""
    model_id: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    custom_instructions: Optional[str] = None
