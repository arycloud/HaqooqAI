"""
Supabase Client for HaqooqAI Backend
Handles all database operations using Supabase
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
from dateutil import parser
from ..config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY
from ..config import USERS_TABLE, USAGE_TABLE, API_KEYS_TABLE

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase client for database operations"""

    def __init__(self):
        """Initialize Supabase client"""
        self.url = SUPABASE_URL
        self.key = SUPABASE_KEY
        self.service_key = SUPABASE_SERVICE_KEY

        if not self.url or not self.key:
            logger.error("Supabase URL and KEY are required")
            self.client = None
            self.service_client = None
        else:
            try:
                # Regular client for normal operations
                self.client: Client = create_client(self.url, self.key)

                # Service client for admin operations (if service key provided)
                if self.service_key:
                    self.service_client: Client = create_client(self.url, self.service_key)
                else:
                    self.service_client = self.client

                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None
                self.service_client = None

    def is_connected(self) -> bool:
        """Check if Supabase client is connected"""
        return self.client is not None

    async def check_connection(self) -> Dict[str, Any]:
        """Check Supabase connection health"""
        if not self.client:
            return {"status": "unhealthy", "error": "Client not initialized"}

        try:
            # Try a simple query to test connection
            result = self.client.table(USERS_TABLE).select("count", count="exact").limit(1).execute()

            return {
                "status": "healthy",
                "connected": True,
                "url": self.url,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "connected": False,
                "timestamp": datetime.now().isoformat()
            }

    # User Management Methods

    def create_or_update_user(self, github_id: int, username: str, email: Optional[str] = None) -> Dict[str, Any]:
        """Create or update user in database"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            user_data = {
                "github_id": github_id,
                "username": username,
                "email": email,
                "updated_at": datetime.now().isoformat(),
                "last_login": datetime.now().isoformat()
            }

            # Use service client to bypass RLS
            result = self.service_client.table(USERS_TABLE).upsert(
                user_data,
                on_conflict="github_id"
            ).execute()

            if result.data:
                logger.info(f"User {username} (ID: {github_id}) created/updated successfully")
                return result.data[0]
            else:
                raise Exception("No data returned from upsert operation")

        except Exception as e:
            logger.error(f"Error creating/updating user {github_id}: {e}")
            raise

    def get_user_by_github_id(self, github_id: int) -> Optional[Dict[str, Any]]:
        """Get user by GitHub ID"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            result = self.service_client.table(USERS_TABLE).select("*").eq("github_id", github_id).execute()

            if result.data:
                return result.data[0]
            return None

        except Exception as e:
            logger.error(f"Error getting user {github_id}: {e}")
            raise

    # Usage Tracking Methods

    def get_user_usage(self, github_id: int) -> Dict[str, Any]:
        """Get user's current usage information"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Get current usage record
            result = self.service_client.table(USAGE_TABLE).select("*").eq("github_id", github_id).execute()

            now = datetime.now()

            if result.data:
                usage_data = result.data[0]
                reset_at_str = usage_data["reset_at"]

                # Handle different datetime formats from Supabase
                # if reset_at_str.endswith('Z'):
                #     reset_at = datetime.fromisoformat(reset_at_str.replace("Z", "+00:00"))
                # elif '+' in reset_at_str or reset_at_str.endswith('00:00'):
                #     reset_at = datetime.fromisoformat(reset_at_str)
                # else:
                #     # Assume UTC if no timezone info
                #     reset_at = datetime.fromisoformat(reset_at_str + "+00:00")

                reset_at = parser.isoparse(reset_at_str)

                # Make now timezone-aware for comparison
                if now.tzinfo is None:
                    from datetime import timezone
                    now = now.replace(tzinfo=timezone.utc)

                # Check if quota should be reset
                if now >= reset_at:
                    # Reset quota
                    updated_data = {
                        "github_id": github_id,
                        "query_count": 0,
                        "reset_at": (now + timedelta(hours=24)).isoformat(),
                        "updated_at": now.isoformat()
                    }

                    self.service_client.table(USAGE_TABLE).upsert(
                        updated_data,
                        on_conflict="github_id"
                    ).execute()

                    return updated_data
                else:
                    return usage_data
            else:
                # Ensure user exists before creating usage record
                user_exists = self.get_user_by_github_id(github_id)
                if not user_exists:
                    # Create a basic user record if it doesn't exist
                    self.create_or_update_user(
                        github_id=github_id,
                        username=f"user_{github_id}",
                        email=None
                    )

                # Create new usage record
                new_usage = {
                    "github_id": github_id,
                    "query_count": 0,
                    "reset_at": (now + timedelta(hours=24)).isoformat(),
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat()
                }

                result = self.service_client.table(USAGE_TABLE).insert(new_usage).execute()
                return result.data[0] if result.data else new_usage

        except Exception as e:
            logger.error(f"Error getting usage for user {github_id}: {e}")
            raise

    def increment_user_usage(self, github_id: int) -> Dict[str, Any]:
        """Increment user's query count"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Get current usage
            current_usage = self.get_user_usage(github_id)

            # Increment count
            updated_usage = {
                "github_id": github_id,
                "query_count": current_usage["query_count"] + 1,
                "reset_at": current_usage["reset_at"],
                "updated_at": datetime.now().isoformat()
            }

            result = self.service_client.table(USAGE_TABLE).upsert(
                updated_usage,
                on_conflict="github_id"
            ).execute()

            logger.info(f"Incremented usage for user {github_id} to {updated_usage['query_count']}")
            return result.data[0] if result.data else updated_usage

        except Exception as e:
            logger.error(f"Error incrementing usage for user {github_id}: {e}")
            raise

    # API Key Management Methods

    def save_user_api_key(self, github_id: int, api_key: str) -> bool:
        """Save user's API key (encrypted/hashed in production)"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Ensure user exists before saving API key
            user_exists = self.get_user_by_github_id(github_id)
            if not user_exists:
                # Create a basic user record if it doesn't exist
                self.create_or_update_user(
                    github_id=github_id,
                    username=f"user_{github_id}",
                    email=None
                )

            # In production, you should encrypt/hash the API key
            # For backward compatibility, we'll use the new column name
            api_key_data = {
                "github_id": github_id,
                "encrypted_key": api_key,  # Use new column name
                "provider": "groq",  # Default to groq for backward compatibility
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }

            result = self.service_client.table(API_KEYS_TABLE).upsert(
                api_key_data,
                on_conflict="github_id,provider"  # Use composite key for upsert
            ).execute()

            logger.info(f"API key saved for user {github_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving API key for user {github_id}: {e}")
            return False

    def get_user_api_key(self, github_id: int) -> Optional[str]:
        """Get user's API key"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Try to get the key with the new structure (default to groq for backward compatibility)
            result = self.service_client.table(API_KEYS_TABLE).select("encrypted_key").eq("github_id", github_id).eq("provider", "groq").execute()

            if result.data:
                return result.data[0]["encrypted_key"]
            
            return None

        except Exception as e:
            logger.error(f"Error getting API key for user {github_id}: {e}")
            return None

    def delete_user_api_key(self, github_id: int) -> bool:
        """Delete user's API key"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Delete all keys for the user (new structure)
            result = self.service_client.table(API_KEYS_TABLE).delete().eq("github_id", github_id).execute()
            logger.info(f"API key deleted for user {github_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting API key for user {github_id}: {e}")
            return False

    def has_user_api_key(self, github_id: int) -> bool:
        """Check if user has an API key"""
        return self.get_user_api_key(github_id) is not None

    # Statistics Methods

    # Conversation Management Methods

    def get_user_internal_id(self, github_id: int) -> Optional[int]:
        """Get user's internal ID from GitHub ID"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            logger.info(f"Looking up user internal ID for GitHub ID: {github_id}")
            result = self.service_client.table(USERS_TABLE).select("id").eq("github_id", github_id).single().execute()
            user_id = result.data["id"] if result.data else None
            logger.info(f"Found user internal ID {user_id} for GitHub ID {github_id}")
            return user_id
        except Exception as e:
            logger.error(f"Error getting user internal ID for GitHub ID {github_id}: {e}")
            return None

    def get_user_conversations(self, user_id: int, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Get user's internal ID first
            user_internal_id = self.get_user_internal_id(user_id)
            if not user_internal_id:
                return []

            # result = self.service_client.table("conversations").select("*").eq("user_id", user_internal_id).order("updated_at", desc=True).execute()
            result = self.service_client.table("conversations") \
                .select("*") \
                .eq("user_id", user_internal_id) \
                .order("updated_at", desc=True) \
                .range(offset, offset + limit - 1) \
                .execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching conversations: {e}")
            return []

    def create_conversation(self, user_internal_id: int, title: str) -> Dict[str, Any]:
        """Create a new conversation"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            result = self.service_client.table("conversations").insert({
                "user_id": user_internal_id,
                "title": title
            }).execute()

            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to create conversation")
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise e

    def get_conversation_with_messages(self, conversation_id: str,
                                       user_internal_id: int,
                                       limit: int = 50,
                                       offset: int = 0) -> Optional[Dict[str, Any]]:
        """Get a conversation with all its messages"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Get conversation
            # conv_result = self.service_client.table("conversations").select("*").eq("id", conversation_id).eq("user_id", user_internal_id).single().execute()
            conv_result = self.service_client.table("conversations") \
                .select("*") \
                .eq("id", conversation_id) \
                .eq("user_id", user_internal_id) \
                .single() \
                .execute()
            if not conv_result.data:
                return None

            # Get messages
            # msg_result = self.service_client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
            msg_result = self.service_client.table("messages") \
                .select("*") \
                .eq("conversation_id", conversation_id) \
                .order("created_at", desc=False) \
                .range(offset, offset + limit - 1) \
                .execute()
            conversation = conv_result.data
            conversation["messages"] = msg_result.data if msg_result.data else []

            return conversation
        except Exception as e:
            logger.error(f"Error fetching conversation with messages: {e}")
            return None

    def verify_conversation_ownership(self, conversation_id: str, user_internal_id: int) -> bool:
        """Verify that a conversation belongs to a user"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            result = self.service_client.table("conversations").select("id").eq("id", conversation_id).eq("user_id", user_internal_id).execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            logger.error(f"Error verifying conversation ownership: {e}")
            return False

    def create_message(self, conversation_id: str, role: str, content: str, sources: Optional[List] = None, disclaimer: Optional[str] = None, llm_provider: Optional[str] = None, query_tokens: Optional[int] = None, routing_reason: Optional[str] = None, using_user_key: Optional[bool] = None, processing_time_ms: Optional[int] = None) -> Dict[str, Any]:
        """Create a new message in a conversation"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            message_data = {
                "conversation_id": conversation_id,
                "role": role,
                "content": content
            }

            if sources:
                message_data["sources"] = sources

            # Only include disclaimer if it's not None and not empty
            if disclaimer and disclaimer.strip():
                message_data["disclaimer"] = disclaimer

            if llm_provider:
                message_data["llm_provider"] = llm_provider

            if query_tokens is not None:
                message_data["query_tokens"] = query_tokens

            if routing_reason:
                message_data["routing_reason"] = routing_reason

            if using_user_key is not None:
                message_data["using_user_key"] = using_user_key

            if processing_time_ms is not None:
                message_data["processing_time_ms"] = processing_time_ms

            # Log the data we're trying to insert
            import json
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Attempting to insert message for conversation {conversation_id}")
            logger.debug(f"Inserting message data: {json.dumps(message_data, default=str, indent=2)}")

            result = self.service_client.table("messages").insert(message_data).execute()

            if result.data:
                logger.info(f"Successfully inserted message with ID: {result.data[0].get('id')}")
                return result.data[0]
            else:
                logger.error("Failed to create message - no data returned from Supabase")
                raise Exception("Failed to create message - no data returned from Supabase")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating message for conversation {conversation_id}: {e}", exc_info=True)
            raise e

    def update_conversation(self, conversation_id: str, user_internal_id: int, title: str) -> Optional[Dict[str, Any]]:
        """Update a conversation's title"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # First verify ownership
            if not self.verify_conversation_ownership(conversation_id, user_internal_id):
                return None

            # Update the conversation
            result = self.service_client.table("conversations").update({
                "title": title,
                "updated_at": "now()"
            }).eq("id", conversation_id).eq("user_id", user_internal_id).execute()

            if result.data:
                return result.data[0]
            else:
                return None
        except Exception as e:
            logger.error(f"Error updating conversation: {e}")
            raise e

    def delete_conversation(self, conversation_id: str, user_internal_id: int) -> bool:
        """Delete a conversation and its messages"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Delete messages first
            self.service_client.table("messages") \
                .delete() \
                .eq("conversation_id", conversation_id) \
                .execute()

            # Then delete conversation
            result = self.service_client.table("conversations") \
                .delete() \
                .eq("id", conversation_id) \
                .eq("user_id", user_internal_id) \
                .execute()

            return bool(result.data and len(result.data) > 0)
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False

    def get_usage_stats(self) -> Dict[str, Any]:
        """Get overall usage statistics"""
        if not self.service_client:
            raise Exception("Supabase service client not initialized")

        try:
            # Get total users
            users_result = self.service_client.table(USERS_TABLE).select("count", count="exact").execute()
            total_users = users_result.count if users_result.count else 0

            # Get total queries
            usage_result = self.service_client.table(USAGE_TABLE).select("query_count").execute()
            total_queries = sum(row["query_count"] for row in usage_result.data) if usage_result.data else 0

            # Get users with API keys
            api_keys_result = self.service_client.table(API_KEYS_TABLE).select("count", count="exact").execute()
            users_with_keys = api_keys_result.count if api_keys_result.count else 0

            # Get active users (users with queries > 0)
            active_users_result = self.service_client.table(USAGE_TABLE).select("count", count="exact").gt("query_count", 0).execute()
            active_users = active_users_result.count if active_users_result.count else 0

            return {
                "total_users": total_users,
                "total_queries": total_queries,
                "users_with_api_keys": users_with_keys,
                "active_users_24h": active_users,
                "timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting usage stats: {e}")
            return {
                "total_users": 0,
                "total_queries": 0,
                "users_with_api_keys": 0,
                "active_users_24h": 0,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


# Global Supabase client instance
supabase_client = SupabaseClient()
