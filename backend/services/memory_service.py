"""Service for managing conversation memory and context."""

import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.database.models import DBChatMessage
from backend.models.chat import ChatMessage
import json

logger = logging.getLogger(__name__)


class MemoryService:
    """Service for managing conversation memory."""
    
    def __init__(self, max_memory_tokens: int = 8000, memory_window: int = 10):
        """
        Initialize the memory service.
        
        Args:
            max_memory_tokens: Maximum tokens to keep in memory
            memory_window: Number of recent messages to consider for context
        """
        self.max_memory_tokens = max_memory_tokens
        self.memory_window = memory_window
        # In-memory storage for conversation context (in production, use Redis or similar)
        self.conversation_memory: Dict[str, List[Dict[str, Any]]] = {}
        self.user_profiles: Dict[str, Dict[str, Any]] = {}
    
    def update_memory(
        self,
        db: Session,
        user_id: str,
        user_message: str,
        assistant_response: str
    ) -> None:
        """
        Update the conversation memory with new messages.
        
        Args:
            db: Database session
            user_id: The user ID
            user_message: The user's message
            assistant_response: The assistant's response
        """
        try:
            # Initialize user memory if not exists
            if user_id not in self.conversation_memory:
                self.conversation_memory[user_id] = []
            
            # Add the exchange to memory
            exchange = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_message": user_message,
                "assistant_response": assistant_response
            }
            self.conversation_memory[user_id].append(exchange)
            
            # Trim memory if too large
            if len(self.conversation_memory[user_id]) > self.memory_window:
                self.conversation_memory[user_id] = self.conversation_memory[user_id][-self.memory_window:]
            
            # Update user profile based on conversation
            self._update_user_profile(user_id, user_message, assistant_response)
            
        except Exception as e:
            logger.error(f"Error updating memory: {e}")
            raise
    
    def _update_user_profile(
        self,
        user_id: str,
        user_message: str,
        assistant_response: str
    ) -> None:
        """Update user profile based on conversation."""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = {
                "interaction_count": 0,
                "preferences": {},
                "frequent_topics": [],
                "last_interaction": None
            }
        
        profile = self.user_profiles[user_id]
        profile["interaction_count"] += 1
        profile["last_interaction"] = datetime.utcnow().isoformat()
        
        # Simple topic extraction (in production, use NLP)
        message_lower = user_message.lower()
        if "code" in message_lower or "programming" in message_lower:
            if "programming" not in profile["frequent_topics"]:
                profile["frequent_topics"].append("programming")
        if "help" in message_lower or "question" in message_lower:
            if "help" not in profile["frequent_topics"]:
                profile["frequent_topics"].append("help")
    
    def get_conversation_context(
        self,
        user_id: str,
        max_tokens: int = 2000
    ) -> List[Dict[str, str]]:
        """
        Get relevant conversation context for a user.
        
        Args:
            user_id: The user ID
            max_tokens: Maximum tokens to include in context
            
        Returns:
            List of message dictionaries for context
        """
        if user_id not in self.conversation_memory:
            return []
        
        context = []
        token_count = 0
        
        # Get recent exchanges
        exchanges = self.conversation_memory[user_id][-self.memory_window:]
        
        for exchange in reversed(exchanges):
            # Add user message
            user_msg = exchange["user_message"]
            user_token_count = len(user_msg) // 4  # Simple estimation
            
            if token_count + user_token_count > max_tokens:
                break
            
            context.append({"role": "user", "content": user_msg})
            token_count += user_token_count
            
            # Add assistant response
            assistant_msg = exchange["assistant_response"]
            assistant_token_count = len(assistant_msg) // 4
            
            if token_count + assistant_token_count > max_tokens:
                break
            
            context.append({"role": "assistant", "content": assistant_msg})
            token_count += assistant_token_count
        
        # Reverse to maintain chronological order
        return context[::-1]
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get the user profile."""
        return self.user_profiles.get(user_id, {})
    
    def generate_contextual_prompt(
        self,
        user_id: str,
        current_message: str,
        max_context_tokens: int = 2000
    ) -> str:
        """
        Generate a contextual prompt based on conversation history.
        
        Args:
            user_id: The user ID
            current_message: The current user message
            max_context_tokens: Maximum tokens for context
            
        Returns:
            Contextual prompt string
        """
        context = self.get_conversation_context(user_id, max_context_tokens)
        
        if not context:
            return current_message
        
        # Build context string
        context_parts = []
        for msg in context:
            role = msg["role"].capitalize()
            content = msg["content"]
            context_parts.append(f"{role}: {content}")
        
        context_str = "\n".join(context_parts)
        
        # Add current message
        full_prompt = f"{context_str}\n\nUser: {current_message}"
        
        return full_prompt
    
    def clear_memory(self, user_id: str) -> None:
        """Clear memory for a user."""
        if user_id in self.conversation_memory:
            del self.conversation_memory[user_id]
        if user_id in self.user_profiles:
            del self.user_profiles[user_id]
    
    def get_memory_stats(self, user_id: str) -> Dict[str, Any]:
        """Get memory statistics for a user."""
        return {
            "exchanges": len(self.conversation_memory.get(user_id, [])),
            "profile": self.user_profiles.get(user_id, {}),
            "max_window": self.memory_window
        }
