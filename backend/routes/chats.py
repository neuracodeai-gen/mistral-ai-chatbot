"""API routes for chat operations."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.models.chat import Chat, ChatCreate, ChatUpdate, ChatMessage, ChatMessageCreate
from backend.models.settings import UserSettings
from backend.services.chat_service import ChatService
from backend.services.settings_service import SettingsService
from backend.database.database import get_db
from backend.config import settings

router = APIRouter(prefix="/chats", tags=["chats"])
security = HTTPBearer()


def get_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Extract user ID from bearer token."""
    if credentials:
        # In production, validate the token and extract user ID
        # For now, we'll use the token as user_id for simplicity
        return credentials.credentials
    return None


@router.post("/", response_model=Chat, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_create: ChatCreate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> Chat:
    """Create a new chat session."""
    chat_service = ChatService()
    return chat_service.create_chat(db, chat_create, user_id)


@router.get("/", response_model=List[Chat])
async def list_chats(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> List[Chat]:
    """List all chat sessions."""
    chat_service = ChatService()
    return chat_service.list_chats(db, user_id, skip, limit)


@router.get("/{chat_id}", response_model=Chat)
async def get_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> Chat:
    """Get a specific chat session."""
    chat_service = ChatService()
    chat = chat_service.get_chat(db, chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.put("/{chat_id}", response_model=Chat)
async def update_chat(
    chat_id: str,
    chat_update: ChatUpdate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> Chat:
    """Update a chat session."""
    chat_service = ChatService()
    chat = chat_service.update_chat(db, chat_id, chat_update, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> None:
    """Delete a chat session."""
    chat_service = ChatService()
    success = chat_service.delete_chat(db, chat_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat not found")


@router.get("/{chat_id}/messages", response_model=List[ChatMessage])
async def get_messages(
    chat_id: str,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> List[ChatMessage]:
    """Get all messages for a chat."""
    chat_service = ChatService()
    messages = chat_service.get_messages(db, chat_id, user_id)
    return messages


@router.post("/{chat_id}/messages", response_model=ChatMessage, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: str,
    message_create: ChatMessageCreate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> ChatMessage:
    """Send a message to a chat and get a response."""
    chat_service = ChatService()
    settings_service = SettingsService()
    
    # Get user settings
    user_settings = None
    if user_id:
        user_settings = settings_service.get_or_create_settings(db, user_id)
    
    # Send the message
    response = chat_service.send_message(
        db, 
        chat_id, 
        message_create.content,
        user_id,
        user_settings
    )
    
    if not response:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return response


@router.post("/{chat_id}/messages/stream")
async def stream_message(
    chat_id: str,
    message_create: ChatMessageCreate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
):
    """Send a message and stream the response (SSE endpoint)."""
    from fastapi import Response
    import json
    
    chat_service = ChatService()
    settings_service = SettingsService()
    
    # Get user settings
    user_settings = None
    if user_id:
        user_settings = settings_service.get_or_create_settings(db, user_id)
    
    # Get the chat
    chat = chat_service.get_chat(db, chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Add user message to database
    user_msg = chat_service.add_message(
        db, 
        chat_id, 
        message_create,
        user_id
    )
    
    # For now, we'll return a simple streaming response
    # In production, implement actual streaming with Groq
    
    def generate_stream():
        # This is a placeholder for streaming
        # In production, use Groq's streaming API
        yield f"data: {json.dumps({'role': 'assistant', 'content': 'Thinking...', 'done': False})}\n\n"
        yield f"data: {json.dumps({'role': 'assistant', 'content': 'Processing your request...', 'done': False})}\n\n"
        
        # Generate actual response
        response = chat_service.send_message(
            db,
            chat_id,
            message_create.content,
            user_id,
            user_settings
        )
        
        if response:
            yield f"data: {json.dumps({'role': 'assistant', 'content': response.content, 'done': True})}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return Response(generate_stream(), media_type="text/event-stream")
