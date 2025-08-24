"""
Usage Quota Tracker for HaqooqAI Backend
Supabase-based quota management system
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from ..models.responses import QuotaInfo
from ..config import USAGE_LIMIT_DEFAULT
from ..database.supabase_client import supabase_client

logger = logging.getLogger(__name__)



class UsageTracker:
    """Supabase-based usage tracking system"""

    def __init__(self):
        self.default_limit = USAGE_LIMIT_DEFAULT
        self.db = supabase_client

        if not self.db.is_connected():
            logger.error("Supabase client not connected. Usage tracking will not work.")
        else:
            logger.info("UsageTracker initialized with Supabase backend")

    def _check_db_connection(self) -> bool:
        """Check if database connection is available"""
        if not self.db.is_connected():
            logger.error("Database connection not available")
            return False
        return True

    def _parse_reset_at(self, value):
        """Safely parse reset_at timestamp from Supabase"""
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except Exception:
                logger.warning(f"Unparsable reset_at format: {value}, using now()+24h fallback")
        # fallback
        return datetime.now() + timedelta(hours=24)
    
    def check_quota(self, user_id: int) -> QuotaInfo:
        """
        Check user's current quota status

        Args:
            user_id: GitHub user ID

        Returns:
            QuotaInfo: Current quota information
        """
        if not self._check_db_connection():
            # Return default quota if DB is unavailable
            return QuotaInfo(
                remaining=0,
                limit=self.default_limit,
                reset_at=datetime.now() + timedelta(hours=24),
                has_api_key=False,
                unlimited=False
            )

        try:
            # Get usage data from database
            usage_data = self.db.get_user_usage(user_id)

            # Check if user has API key (unlimited access)
            has_api_key = self.db.has_user_api_key(user_id)
            unlimited = has_api_key

            # Calculate remaining quota
            if unlimited:
                remaining = 999999  # Effectively unlimited
                limit = 999999
            else:
                limit = self.default_limit
                remaining = max(limit - usage_data["query_count"], 0)

            # reset_at = datetime.fromisoformat(usage_data["reset_at"].replace("Z", "+00:00"))
            reset_at = self._parse_reset_at(usage_data.get("reset_at"))

            return QuotaInfo(
                remaining=remaining,
                limit=limit,
                reset_at=reset_at,
                has_api_key=has_api_key,
                unlimited=unlimited
            )

        except Exception as e:
            logger.error(f"Error checking quota for user {user_id}: {e}")
            # Return safe default on error
            return QuotaInfo(
                remaining=0,
                limit=self.default_limit,
                reset_at=datetime.now() + timedelta(hours=24),
                has_api_key=False,
                unlimited=False
            )

    def increment_usage(self, user_id: int) -> QuotaInfo:
        """
        Increment user's usage count

        Args:
            user_id: GitHub user ID

        Returns:
            QuotaInfo: Updated quota information
        """
        if not self._check_db_connection():
            logger.error("Cannot increment usage - database unavailable")
            return self.check_quota(user_id)

        try:
            # Only increment if user doesn't have unlimited access
            if not self.db.has_user_api_key(user_id):
                self.db.increment_user_usage(user_id)
                logger.info(f"Incremented usage for user {user_id}")

            return self.check_quota(user_id)

        except Exception as e:
            logger.error(f"Error incrementing usage for user {user_id}: {e}")
            return self.check_quota(user_id)

    def save_api_key(self, user_id: int, api_key: str) -> bool:
        """
        Save user's Groq API key to database

        Args:
            user_id: GitHub user ID
            api_key: Groq API key

        Returns:
            bool: Success status
        """
        if not self._check_db_connection():
            logger.error("Cannot save API key - database unavailable")
            return False

        try:
            return self.db.save_user_api_key(user_id, api_key)
        except Exception as e:
            logger.error(f"Error saving API key for user {user_id}: {e}")
            return False

    def get_api_key(self, user_id: int) -> Optional[str]:
        """
        Get user's stored API key from database

        Args:
            user_id: GitHub user ID

        Returns:
            Optional[str]: API key if exists
        """
        if not self._check_db_connection():
            return None

        try:
            return self.db.get_user_api_key(user_id)
        except Exception as e:
            logger.error(f"Error getting API key for user {user_id}: {e}")
            return None

    def remove_api_key(self, user_id: int) -> bool:
        """
        Remove user's API key from database

        Args:
            user_id: GitHub user ID

        Returns:
            bool: Success status
        """
        if not self._check_db_connection():
            logger.error("Cannot remove API key - database unavailable")
            return False

        try:
            return self.db.delete_user_api_key(user_id)
        except Exception as e:
            logger.error(f"Error removing API key for user {user_id}: {e}")
            return False

    def get_usage_stats(self) -> Dict[str, Any]:
        """
        Get overall usage statistics from database

        Returns:
            Dict: Usage statistics
        """
        if not self._check_db_connection():
            return {
                "total_users": 0,
                "total_queries": 0,
                "users_with_api_keys": 0,
                "active_users_24h": 0,
                "error": "Database unavailable"
            }

        try:
            return self.db.get_usage_stats()
        except Exception as e:
            logger.error(f"Error getting usage stats: {e}")
            return {
                "total_users": 0,
                "total_queries": 0,
                "users_with_api_keys": 0,
                "active_users_24h": 0,
                "error": str(e)
            }
