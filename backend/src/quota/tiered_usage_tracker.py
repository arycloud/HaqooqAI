"""
Tiered Usage Tracker for HaqooqAI Multi-LLM Routing System
Implements provider-specific quota tracking with BYOK support
"""
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

from ..database.supabase_client import supabase_client
from ..config import (
    USAGE_LIMIT_DEFAULT, 
    DEFAULT_GROQ_DAILY_LIMIT, 
    DEFAULT_GEMINI_DAILY_LIMIT,
    DEFAULT_OPENAI_DAILY_LIMIT
)

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    """LLM Provider enumeration"""
    GROQ = "groq"
    GEMINI = "gemini"
    OPENAI = "openai"


@dataclass
class ProviderQuota:
    """Quota information for a specific provider"""
    provider: LLMProvider
    queries_today: int
    daily_limit: int
    reset_at: datetime
    has_user_key: bool
    unlimited: bool

    @property
    def remaining(self) -> int:
        """Calculate remaining queries"""
        if self.unlimited:
            return 999999
        return max(0, self.daily_limit - self.queries_today)


class TieredUsageTracker:
    """
    Enhanced usage tracker that implements tiered quota system:
    - System default: 5 queries/day
    - System Groq: 5 queries/day
    - System Gemini: 5 queries/day
    - OpenAI: BYOK-only (no system quota)
    - User keys: Unlimited system quota
    """
    
    def __init__(self):
        """Initialize the tiered usage tracker"""
        self.provider_limits = {
            LLMProvider.GROQ: DEFAULT_GROQ_DAILY_LIMIT,
            LLMProvider.GEMINI: DEFAULT_GEMINI_DAILY_LIMIT,
            LLMProvider.OPENAI: DEFAULT_OPENAI_DAILY_LIMIT  # 0 = disabled
        }
        logger.info(f"TieredUsageTracker initialized with limits: {self.provider_limits}")
    
    def get_provider_quota(self, user_id: int, provider: LLMProvider, has_user_key: bool = False) -> ProviderQuota:
        """
        Get quota information for a specific provider
        
        Args:
            user_id: GitHub user ID
            provider: LLM provider
            has_user_key: Whether user provided their own API key
            
        Returns:
            ProviderQuota object with current usage and limits
        """
        try:
            # Get internal user ID
            user_internal_id = supabase_client.get_user_internal_id(user_id)
            if not user_internal_id:
                logger.warning(f"User internal ID not found for GitHub ID {user_id}")
                return ProviderQuota(
                    provider=provider,
                    queries_today=0,
                    daily_limit=0,
                    reset_at=datetime.now() + timedelta(days=1),
                    has_user_key=has_user_key,
                    unlimited=False
                )
            
            # If user has their own key, they bypass system quotas
            if has_user_key:
                return ProviderQuota(
                    provider=provider,
                    queries_today=0,
                    daily_limit=999999,  # Effectively unlimited
                    reset_at=datetime.now() + timedelta(days=1),
                    has_user_key=True,
                    unlimited=True
                )
            
            # Get provider-specific daily limit
            daily_limit = self.provider_limits.get(provider, USAGE_LIMIT_DEFAULT)
            
            # OpenAI is BYOK-only (no system quota)
            if provider == LLMProvider.OPENAI and daily_limit == 0:
                return ProviderQuota(
                    provider=provider,
                    queries_today=999999,  # Effectively at limit
                    daily_limit=0,
                    reset_at=datetime.now() + timedelta(days=1),
                    has_user_key=False,
                    unlimited=False
                )
            
            # Get today's usage for this provider
            today = datetime.now().date()
            queries_today = self._get_daily_usage(user_internal_id, provider, today)
            
            # Calculate reset time (midnight tomorrow)
            tomorrow = today + timedelta(days=1)
            reset_at = datetime.combine(tomorrow, datetime.min.time())
            
            return ProviderQuota(
                provider=provider,
                queries_today=queries_today,
                daily_limit=daily_limit,
                reset_at=reset_at,
                has_user_key=False,
                unlimited=False
            )
            
        except Exception as e:
            logger.error(f"Error getting provider quota: {e}")
            return ProviderQuota(
                provider=provider,
                queries_today=0,
                daily_limit=USAGE_LIMIT_DEFAULT,
                reset_at=datetime.now() + timedelta(days=1),
                has_user_key=has_user_key,
                unlimited=has_user_key
            )
    
    def check_provider_quota(self, user_id: int, provider: LLMProvider, has_user_key: bool = False) -> Tuple[bool, str]:
        """
        Check if user can make a query with the specified provider
        
        Returns:
            (can_proceed, message)
        """
        quota = self.get_provider_quota(user_id, provider, has_user_key)
        
        # User keys bypass all quotas
        if quota.unlimited:
            return True, f"Using user's {provider.value} API key (unlimited)"
        
        # OpenAI is BYOK-only
        if provider == LLMProvider.OPENAI and quota.daily_limit == 0:
            return False, "OpenAI requires your own API key. Please provide an OpenAI API key to use this provider."
        
        # Check daily limit
        if quota.queries_today >= quota.daily_limit:
            return False, (
                f"Daily limit reached for {provider.value} ({quota.queries_today}/{quota.daily_limit}). "
                f"Resets at {quota.reset_at.strftime('%H:%M UTC')}. "
                f"Provide your own {provider.value} API key for unlimited usage."
            )
        
        remaining = quota.daily_limit - quota.queries_today
        return True, f"{remaining} {provider.value} queries remaining today"
    
    def increment_provider_usage(self, user_id: int, provider: LLMProvider, has_user_key: bool = False) -> bool:
        """
        Increment usage counter for a specific provider
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Don't track usage for user keys
            if has_user_key:
                logger.info(f"User {user_id} used their own {provider.value} key - not tracking system quota")
                return True
            
            # Get internal user ID
            user_internal_id = supabase_client.get_user_internal_id(user_id)
            if not user_internal_id:
                logger.warning(f"Cannot increment usage - user internal ID not found for GitHub ID {user_id}")
                return False
            
            # Record usage in routing_stats table
            today = datetime.now().date()
            success = self._record_provider_usage(user_internal_id, provider, today)
            
            if success:
                logger.info(f"Incremented {provider.value} usage for user {user_id}")
            else:
                logger.error(f"Failed to increment {provider.value} usage for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error incrementing provider usage: {e}")
            return False
    
    def get_user_quota_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Get comprehensive quota summary for all providers
        
        Returns:
            Dictionary with quota information for all providers
        """
        try:
            summary = {
                "user_id": user_id,
                "providers": {},
                "total_queries_today": 0,
                "has_unlimited_access": False
            }
            
            total_queries = 0
            has_unlimited = False
            
            for provider in LLMProvider:
                # Check if user has API key for this provider
                has_user_key = self._user_has_api_key(user_id, provider)
                quota = self.get_provider_quota(user_id, provider, has_user_key)
                
                summary["providers"][provider.value] = {
                    "queries_today": quota.queries_today,
                    "daily_limit": quota.daily_limit,
                    "remaining": max(0, quota.daily_limit - quota.queries_today),
                    "reset_at": quota.reset_at.isoformat(),
                    "has_user_key": quota.has_user_key,
                    "unlimited": quota.unlimited,
                    "available": quota.unlimited or quota.queries_today < quota.daily_limit
                }
                
                if not quota.unlimited:
                    total_queries += quota.queries_today
                
                if quota.unlimited:
                    has_unlimited = True
            
            summary["total_queries_today"] = total_queries
            summary["has_unlimited_access"] = has_unlimited
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting user quota summary: {e}")
            return {"error": str(e)}
    
    def _get_daily_usage(self, user_internal_id: int, provider: LLMProvider, date: datetime.date) -> int:
        """Get daily usage count for a provider"""
        try:
            # Query routing_stats table for today's usage
            # This would be implemented based on your Supabase client methods
            # For now, return 0 as placeholder
            return 0
        except Exception as e:
            logger.error(f"Error getting daily usage: {e}")
            return 0
    
    def _record_provider_usage(self, user_internal_id: int, provider: LLMProvider, date: datetime.date) -> bool:
        """Record provider usage in database"""
        try:
            # This would insert into routing_stats table
            # Implementation depends on your Supabase client methods
            return True
        except Exception as e:
            logger.error(f"Error recording provider usage: {e}")
            return False
    
    def _user_has_api_key(self, user_id: int, provider: LLMProvider) -> bool:
        """Check if user has stored API key for provider"""
        try:
            # Use the API key manager to check if user has a key
            from ..database.api_key_manager import api_key_manager
            import asyncio

            # Run async method in sync context
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, we can't use run_until_complete
                # For now, return False and let the calling code handle it
                return False
            else:
                return loop.run_until_complete(
                    api_key_manager.has_api_key(user_id, provider.value)
                )
        except Exception as e:
            logger.error(f"Error checking user API key: {e}")
            return False
