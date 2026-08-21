"""Service for managing chat sessions and messages."""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import DBChat, DBChatMessage
from backend.models.chat import Chat, ChatMessage, ChatCreate, ChatUpdate, ChatMessageCreate
from backend.models.settings import UserSettings
from .groq_service import GroqService
from .memory_service import MemoryService
import uuid

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing chat sessions."""
    
    def __init__(self):
        """Initialize the chat service."""
        self.groq_service = GroqService()
        self.memory_service = MemoryService()
    
    def create_chat(self, db: Session, chat_create: ChatCreate, user_id: Optional[str] = None) -> Chat:
        """Create a new chat session."""
        try:
            db_chat = DBChat(
                id=str(uuid.uuid4()),
                title=chat_create.title,
                user_id=user_id or chat_create.user_id,
                system_prompt=chat_create.system_prompt,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(db_chat)
            db.commit()
            db.refresh(db_chat)
            
            return Chat.from_orm(db_chat)
        except Exception as e:
            logger.error(f"Error creating chat: {e}")
            db.rollback()
            raise
    
    def get_chat(self, db: Session, chat_id: str, user_id: Optional[str] = None) -> Optional[Chat]:
        """Get a chat by ID."""
        try:
            query = db.query(DBChat).filter(DBChat.id == chat_id)
            if user_id:
                query = query.filter(DBChat.user_id == user_id)
            
            db_chat = query.first()
            if not db_chat:
                return None
            
            return Chat.from_orm(db_chat)
        except Exception as e:
            logger.error(f"Error getting chat: {e}")
            raise
    
    def list_chats(
        self, 
        db: Session, 
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Chat]:
        """List all chats for a user."""
        try:
            query = db.query(DBChat)
            if user_id:
                query = query.filter(DBChat.user_id == user_id)
            
            query = query.order_by(DBChat.updated_at.desc())
            query = query.offset(skip).limit(limit)
            
            db_chats = query.all()
            return [Chat.from_orm(db_chat) for db_chat in db_chats]
        except Exception as e:
            logger.error(f"Error listing chats: {e}")
            raise
    
    def update_chat(self, db: Session, chat_id: str, chat_update: ChatUpdate, user_id: Optional[str] = None) -> Optional[Chat]:
        """Update a chat."""
        try:
            query = db.query(DBChat).filter(DBChat.id == chat_id)
            if user_id:
                query = query.filter(DBChat.user_id == user_id)
            
            db_chat = query.first()
            if not db_chat:
                return None
            
            if chat_update.title is not None:
                db_chat.title = chat_update.title
            if chat_update.system_prompt is not None:
                db_chat.system_prompt = chat_update.system_prompt
            
            db_chat.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_chat)
            
            return Chat.from_orm(db_chat)
        except Exception as e:
            logger.error(f"Error updating chat: {e}")
            db.rollback()
            raise
    
    def delete_chat(self, db: Session, chat_id: str, user_id: Optional[str] = None) -> bool:
        """Delete a chat."""
        try:
            query = db.query(DBChat).filter(DBChat.id == chat_id)
            if user_id:
                query = query.filter(DBChat.user_id == user_id)
            
            db_chat = query.first()
            if not db_chat:
                return False
            
            db.delete(db_chat)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Error deleting chat: {e}")
            db.rollback()
            raise
    
    def add_message(self, db: Session, chat_id: str, message_create: ChatMessageCreate, user_id: Optional[str] = None) -> Optional[ChatMessage]:
        """Add a message to a chat."""
        try:
            query = db.query(DBChat).filter(DBChat.id == chat_id)
            if user_id:
                query = query.filter(DBChat.user_id == user_id)
            
            db_chat = query.first()
            if not db_chat:
                return None
            
            db_message = DBChatMessage(
                id=str(uuid.uuid4()),
                chat_id=chat_id,
                role=message_create.role,
                content=message_create.content,
                timestamp=datetime.utcnow(),
                token_count=message_create.token_count
            )
            db.add(db_message)
            db_chat.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_message)
            
            return ChatMessage.from_orm(db_message)
        except Exception as e:
            logger.error(f"Error adding message: {e}")
            db.rollback()
            raise
    
    def get_messages(self, db: Session, chat_id: str, user_id: Optional[str] = None) -> List[ChatMessage]:
        """Get all messages for a chat."""
        try:
            query = db.query(DBChat).filter(DBChat.id == chat_id)
            if user_id:
                query = query.filter(DBChat.user_id == user_id)
            
            db_chat = query.first()
            if not db_chat:
                return []
            
            return [ChatMessage.from_orm(msg) for msg in db_chat.messages]
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            raise
    
    def send_message(
        self,
        db: Session,
        chat_id: str,
        user_message: str,
        user_id: Optional[str] = None,
        user_settings: Optional[UserSettings] = None
    ) -> Optional[ChatMessage]:
        """
        Send a message to a chat and get a response.
        
        This is the main method for the chatbot functionality.
        """
        try:
            # Get the chat
            chat = self.get_chat(db, chat_id, user_id)
            if not chat:
                return None
            
            # Get existing messages
            existing_messages = self.get_messages(db, chat_id, user_id)
            
            # Prepare messages for the API
            api_messages = []
            
            # Add system prompt if exists
            if chat.system_prompt:
                api_messages.append({"role": "system", "content": chat.system_prompt})
            
            # Add custom instructions from user settings
            if user_settings and user_settings.custom_instructions:
                api_messages.append({"role": "system", "content": user_settings.custom_instructions})
            
            # Add existing messages
            for msg in existing_messages:
                api_messages.append({"role": msg.role, "content": msg.content})
            
            # Add the new user message
            api_messages.append({"role": "user", "content": user_message})
            
            # Add user message to database
            user_chat_message = self.add_message(
                db, 
                chat_id, 
                ChatMessageCreate(
                    role="user",
                    content=user_message,
                    token_count=self.groq_service.count_tokens(user_message)
                ),
                user_id
            )
            
            # Get settings
            temperature = user_settings.temperature if user_settings else 0.7
            max_tokens = user_settings.max_tokens if user_settings else 4096
            top_p = user_settings.top_p if user_settings else 0.9
            model_id = user_settings.model_id if user_settings else None
            custom_instructions = user_settings.custom_instructions if user_settings else None
            
            # Generate response
            response_message = self.groq_service.generate_response(
                messages=api_messages,
                model_id=model_id,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                custom_instructions=custom_instructions
            )
            
            # Add response to database
            assistant_chat_message = self.add_message(
                db,
                chat_id,
                ChatMessageCreate(
                    role="assistant",
                    content=response_message.content,
                    token_count=response_message.token_count
                ),
                user_id
            )
            
            # Update memory
            self.memory_service.update_memory(
                db, 
                user_id or "default",
                user_message,
                response_message.content
            )
            
            return assistant_chat_message
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise
