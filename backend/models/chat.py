"""Chat and message models for the AI chatbot."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single message in a chat conversation."""
    id: str
    role: str  # "user" or "assistant" or "system"
    content: str
    timestamp: datetime
    token_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class ChatBase(BaseModel):
    """Base chat model."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    user_id: Optional[str] = None


class ChatCreate(BaseModel):
    """Model for creating a new chat."""
    title: str = "New Chat"
    user_id: Optional[str] = None
    system_prompt: Optional[str] = None


class ChatUpdate(BaseModel):
    """Model for updating a chat."""
    title: Optional[str] = None
    system_prompt: Optional[str] = None


class Chat(ChatBase):
    """Full chat model with messages."""
    messages: List[ChatMessage] = Field(default_factory=list)
    system_prompt: Optional[str] = None
    
    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    """Model for creating a new message."""
    role: str
    content: str
    token_count: Optional[int] = None
