# src/services/context_manager.py
import os
import tiktoken
from datetime import datetime
from typing import List, Tuple
from src.database.supabase_client import supabase_client


class ContextManager:
    def __init__(self, max_messages: int = 10, max_tokens: int = 4000):
        self.max_messages = int(os.getenv('MAX_CONTEXT_MESSAGES', max_messages))
        self.max_tokens = int(os.getenv('MAX_CONTEXT_TOKENS', max_tokens))
        self.encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")  # Proxy for Mixtral token counting

    async def get_chat_history(self, conversation_id: str, user_id: int) -> List[Tuple[str, str]]:
        """
        Fetches and processes conversation history as LangChain-compatible chat_history list.
        - Fetches messages via supabase_client.get_conversation_with_messages.
        - Sorts by created_at ASC.
        - Takes last max_messages, builds [('human', content), ('ai', content)] list (oldest to newest).
        - Truncates if exceeding max_tokens.
        - Maps 'user'/'assistant' roles to 'human'/'ai' for LangChain.
        """
        # Get internal user ID (as in your main.py)
        user_internal_id = supabase_client.get_user_internal_id(user_id)
        if not user_internal_id:
            logger.warning(f"User internal ID not found for GitHub ID {user_id}")
            return []

        # Fetch conversation with messages (your existing method)
        conversation = supabase_client.get_conversation_with_messages(conversation_id, user_internal_id)
        if not conversation or not conversation.get('messages'):
            return []

        messages = conversation['messages']
        # Sort by created_at (ensure ASC order)
        messages.sort(key=lambda m: datetime.fromisoformat(m['created_at']))

        # Take last max_messages
        recent_messages = messages[-self.max_messages:]

        chat_history = []
        current_tokens = 0

        # Build from oldest to newest
        for msg in recent_messages:
            role = "human" if msg['role'] == "user" else "ai"  # LangChain expects 'human'/'ai'
            msg_str = f"{role}: {msg['content']}"  # Simple prefix for token counting
            msg_tokens = len(self.encoding.encode(msg_str))

            if current_tokens + msg_tokens > self.max_tokens:
                break  # Truncate

            chat_history.append((role, msg['content']))  # Append tuple (role, content)
            current_tokens += msg_tokens

        return chat_history