"""Service for interacting with the Groq API."""

import logging
from typing import Optional, List, Dict, Any
from groq import Groq
from backend.config import settings
from backend.models.chat import ChatMessage, ChatMessageCreate

logger = logging.getLogger(__name__)


class GroqService:
    """Service for making requests to the Groq API."""
    
    def __init__(self):
        """Initialize the Groq client."""
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model_id = settings.MODEL_ID
    
    def generate_response(
        self,
        messages: List[Dict[str, Any]],
        model_id: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        top_p: float = 0.9,
        custom_instructions: Optional[str] = None
    ) -> ChatMessage:
        """
        Generate a response from the Groq API.
        
        Args:
            messages: List of message dictionaries (role, content)
            model_id: The model to use (defaults to configured model)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            top_p: Top-p sampling parameter
            custom_instructions: Optional system instructions
            
        Returns:
            ChatMessage with the assistant's response
        """
        try:
            # Add custom instructions as system message if provided
            if custom_instructions and not any(msg.get("role") == "system" for msg in messages):
                messages = [{"role": "system", "content": custom_instructions}] + messages
            
            # Make the API call
            response = self.client.chat.completions.create(
                model=model_id or self.model_id,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                stream=False
            )
            
            # Extract the response
            choice = response.choices[0]
            message = choice.message
            
            # Create a ChatMessage from the response
            chat_message = ChatMessage(
                id=f"msg_{response.id}",
                role="assistant",
                content=message.content or "",
                timestamp=response.created,
                token_count=response.usage.total_tokens if response.usage else None
            )
            
            return chat_message
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise Exception(f"Failed to generate response: {str(e)}")
    
    async def generate_response_async(
        self,
        messages: List[Dict[str, Any]],
        model_id: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        top_p: float = 0.9,
        custom_instructions: Optional[str] = None
    ) -> ChatMessage:
        """
        Generate a response asynchronously from the Groq API.
        
        Note: This is a synchronous wrapper. For true async, use the async Groq client.
        """
        return self.generate_response(
            messages=messages,
            model_id=model_id,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            custom_instructions=custom_instructions
        )
    
    def count_tokens(self, text: str) -> int:
        """
        Estimate token count for a given text.
        
        Note: This is a simple estimation. For accurate counting, use the tokenizer.
        """
        # Simple estimation: ~4 characters per token
        return len(text) // 4
