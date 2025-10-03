"""
Conversation Management System for HaqooqAI Backend
Handles conversation limits, message counting, and summarization
"""
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from dataclasses import dataclass

from ..config import MAX_CONVERSATION_MESSAGES
from .context_manager import ContextManager

logger = logging.getLogger(__name__)


@dataclass
class ConversationStats:
    """Statistics about a conversation"""
    message_count: int
    user_messages: int
    assistant_messages: int
    total_tokens: int
    needs_summarization: bool
    can_accept_new_message: bool


class ConversationManager:
    """Manages conversation limits and message counting"""

    def __init__(self):
        """Initialize the conversation manager"""
        self.max_messages = MAX_CONVERSATION_MESSAGES
        self.context_manager = ContextManager()

    def _get_supabase_client(self):
        """Get the appropriate supabase client (mock or real)"""
        # Import the global variable that gets replaced in testing mode
        import sys
        if 'src.main' in sys.modules:
            # If main module is loaded, use its supabase_client (which might be mock)
            main_module = sys.modules['src.main']
            if hasattr(main_module, 'supabase_client'):
                return main_module.supabase_client

        # Fallback to original import
        from ..database.supabase_client import supabase_client
        return supabase_client
    
    def get_conversation_stats(self, conversation_id: str, user_id: int) -> ConversationStats:
        """
        Get comprehensive statistics about a conversation
        
        Args:
            conversation_id: UUID of the conversation
            user_id: GitHub user ID
            
        Returns:
            ConversationStats object with conversation metrics
        """
        try:
            supabase_client = self._get_supabase_client()

            # Get internal user ID
            user_internal_id = supabase_client.get_user_internal_id(user_id)
            if not user_internal_id:
                logger.warning(f"User internal ID not found for GitHub ID {user_id}")
                return ConversationStats(0, 0, 0, 0, False, True)

            # Get conversation with messages
            conversation = supabase_client.get_conversation_with_messages(conversation_id, user_internal_id)
            if not conversation or not conversation.get('messages'):
                return ConversationStats(0, 0, 0, 0, False, True)
            
            messages = conversation['messages']
            message_count = len(messages)
            user_messages = sum(1 for msg in messages if msg['role'] == 'user')
            assistant_messages = sum(1 for msg in messages if msg['role'] == 'assistant')
            
            # Calculate total tokens (approximate)
            total_tokens = 0
            for msg in messages:
                total_tokens += len(self.context_manager.encoding.encode(msg['content']))
            
            # Determine if summarization is needed
            needs_summarization = message_count >= self.max_messages
            can_accept_new_message = message_count < self.max_messages
            
            return ConversationStats(
                message_count=message_count,
                user_messages=user_messages,
                assistant_messages=assistant_messages,
                total_tokens=total_tokens,
                needs_summarization=needs_summarization,
                can_accept_new_message=can_accept_new_message
            )
            
        except Exception as e:
            logger.error(f"Error getting conversation stats: {e}")
            return ConversationStats(0, 0, 0, 0, False, True)
    
    def check_conversation_limit(self, conversation_id: str, user_id: int) -> Tuple[bool, str]:
        """
        Check if conversation can accept new messages
        
        Returns:
            (can_continue, message)
        """
        stats = self.get_conversation_stats(conversation_id, user_id)
        
        if not stats.can_accept_new_message:
            return False, (
                f"This conversation has reached the maximum limit of {self.max_messages} messages. "
                "Please start a new conversation to continue. You can create a new conversation "
                "from the conversation list."
            )
        
        # Warning when approaching limit
        if stats.message_count >= self.max_messages * 0.8:  # 80% of limit
            remaining = self.max_messages - stats.message_count
            return True, (
                f"Note: This conversation is approaching the message limit. "
                f"You have {remaining} messages remaining before needing to start a new conversation."
            )
        
        return True, ""
    
    async def summarize_conversation_if_needed(self, conversation_id: str, user_id: int) -> bool:
        """
        Summarize conversation if it's approaching the limit
        
        This is a placeholder for future implementation of conversation summarization.
        For now, we'll just log when summarization would be needed.
        
        Returns:
            True if summarization was performed or not needed, False if error
        """
        try:
            stats = self.get_conversation_stats(conversation_id, user_id)
            
            if stats.needs_summarization:
                logger.info(
                    f"Conversation {conversation_id} needs summarization: "
                    f"{stats.message_count} messages (limit: {self.max_messages})"
                )
                
                # TODO: Implement actual summarization logic
                # This would involve:
                # 1. Taking the first half of messages
                # 2. Generating a summary using LLM
                # 3. Replacing old messages with summary
                # 4. Keeping recent messages for context
                
                return True
            
            return True
            
        except Exception as e:
            logger.error(f"Error in conversation summarization check: {e}")
            return False
    
    def get_conversation_health_info(self, conversation_id: str, user_id: int) -> Dict[str, Any]:
        """
        Get health information about a conversation for monitoring
        
        Returns:
            Dictionary with conversation health metrics
        """
        try:
            stats = self.get_conversation_stats(conversation_id, user_id)
            
            # Calculate health score (0-100)
            health_score = 100
            if stats.message_count > self.max_messages * 0.8:
                health_score = max(0, 100 - ((stats.message_count / self.max_messages) * 100))
            
            return {
                "conversation_id": conversation_id,
                "message_count": stats.message_count,
                "user_messages": stats.user_messages,
                "assistant_messages": stats.assistant_messages,
                "total_tokens": stats.total_tokens,
                "max_messages": self.max_messages,
                "usage_percentage": (stats.message_count / self.max_messages) * 100,
                "health_score": health_score,
                "needs_summarization": stats.needs_summarization,
                "can_accept_new_message": stats.can_accept_new_message,
                "status": "healthy" if health_score > 80 else "warning" if health_score > 50 else "critical"
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation health info: {e}")
            return {
                "conversation_id": conversation_id,
                "error": str(e),
                "status": "error"
            }
    
    def get_user_conversation_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Get summary of all conversations for a user
        
        Returns:
            Dictionary with user's conversation statistics
        """
        try:
            supabase_client = self._get_supabase_client()

            # Get internal user ID
            user_internal_id = supabase_client.get_user_internal_id(user_id)
            if not user_internal_id:
                return {"error": "User not found"}

            # Get all conversations for user
            conversations = supabase_client.get_user_conversations(user_internal_id)
            
            total_conversations = len(conversations)
            total_messages = 0
            conversations_near_limit = 0
            conversations_at_limit = 0
            
            for conv in conversations:
                conv_stats = self.get_conversation_stats(conv['id'], user_id)
                total_messages += conv_stats.message_count
                
                if conv_stats.message_count >= self.max_messages:
                    conversations_at_limit += 1
                elif conv_stats.message_count >= self.max_messages * 0.8:
                    conversations_near_limit += 1
            
            return {
                "user_id": user_id,
                "total_conversations": total_conversations,
                "total_messages": total_messages,
                "conversations_at_limit": conversations_at_limit,
                "conversations_near_limit": conversations_near_limit,
                "average_messages_per_conversation": total_messages / max(total_conversations, 1),
                "max_messages_per_conversation": self.max_messages
            }
            
        except Exception as e:
            logger.error(f"Error getting user conversation summary: {e}")
            return {"error": str(e)}
