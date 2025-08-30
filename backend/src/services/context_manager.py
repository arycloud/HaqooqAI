# src/services/context_manager.py
import os
import tiktoken
from datetime import datetime
from typing import List, Tuple
from src.database.supabase_client import supabase_client
import re
from dateutil.parser import isoparse
import logging

logger = logging.getLogger(__name__)

class ContextManager:
    def __init__(self, max_messages: int = 14, max_tokens: int = 6000):
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
        def _parse_iso_timestamp(ts) -> datetime:
            """
            Robust ISO timestamp parser for Supabase timestamps.
            - Accepts datetime objects and returns them unchanged.
            - Uses dateutil.isoparse first (handles many ISO variants).
            - Falls back to normalizing fractional seconds to 6 digits.
            - Replaces 'Z' with '+00:00' as a last resort.
            - On failure returns datetime.min to allow safe sorting.
            """
            if isinstance(ts, datetime):
                return ts
            if not ts:
                return datetime.min

            s = str(ts)
            try:
                return isoparse(s)
            except Exception:
                # Normalize fractional seconds to 6 digits, e.g. '...:46.62013+00:00' -> '...:46.062013+00:00'
                m = re.match(r'^(?P<base>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(?P<frac>\d+)(?P<tz>Z|[+-]\d{2}:\d{2})$', s)
                if m:
                    base = m.group('base')
                    frac = (m.group('frac') + "000000")[:6]
                    tz = m.group('tz').replace('Z', '+00:00')
                    try:
                        return datetime.fromisoformat(f"{base}.{frac}{tz}")
                    except Exception:
                        pass

                # Try simple replacement of 'Z' timezone
                try:
                    return datetime.fromisoformat(s.replace("Z", "+00:00"))
                except Exception:
                    logger.debug(f"Unable to parse timestamp '{s}', returning datetime.min")
                    return datetime.min
        
        # Sort by created_at (ensure ASC order)
        messages.sort(key=lambda m: _parse_iso_timestamp(m.get('created_at')))

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