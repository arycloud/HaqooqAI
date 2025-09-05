"""
Enhanced database manager for multi-provider API key operations
Handles CRUD operations with encryption and proper error handling
"""
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from .supabase_client import supabase_client
from ..utils.encryption import encryption
from ..models.responses import ProviderStatus

logger = logging.getLogger(__name__)


class APIKeyManager:
    """Manages multi-provider API key storage and retrieval"""
    
    def __init__(self):
        """Initialize the API key manager"""
        self.db = supabase_client
        self.encryption = encryption
    
    async def store_api_key(self, user_id: int, provider: str, api_key: str) -> bool:
        """
        Store or update an encrypted API key for a user and provider
        
        Args:
            user_id: User's GitHub ID
            provider: Provider name (groq, gemini, openai)
            api_key: Plain text API key to encrypt and store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get internal user ID
            user_internal_id = self.db.get_user_internal_id(user_id)
            if not user_internal_id:
                logger.error(f"User internal ID not found for GitHub ID {user_id}")
                return False
            
            # Encrypt the API key
            encrypted_key = self.encryption.encrypt_api_key(api_key, user_id, provider)
            
            # Prepare data for upsert
            data = {
                "github_id": user_id,
                "provider": provider,
                "encrypted_key": encrypted_key,
                "updated_at": datetime.now().isoformat()
            }
            
            # Use upsert to handle both insert and update
            result = self.db.client.table("api_keys").upsert(
                data,
                on_conflict="github_id,provider"
            ).execute()
            
            if result.data:
                logger.info(f"Successfully stored {provider} API key for user {user_id}")
                return True
            else:
                logger.error(f"Failed to store {provider} API key for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error storing API key for user {user_id}, provider {provider}: {e}")
            return False
    
    async def get_api_key(self, user_id: int, provider: str) -> Optional[str]:
        """
        Retrieve and decrypt an API key for a user and provider
        
        Args:
            user_id: User's GitHub ID
            provider: Provider name
            
        Returns:
            Decrypted API key or None if not found
        """
        try:
            # Query the database
            result = self.db.client.table("api_keys").select("encrypted_key").eq(
                "github_id", user_id
            ).eq("provider", provider).execute()
            
            if not result.data:
                return None
            
            encrypted_key = result.data[0]["encrypted_key"]
            
            # Decrypt the API key
            decrypted_key = self.encryption.decrypt_api_key(encrypted_key, user_id, provider)
            
            return decrypted_key
            
        except Exception as e:
            logger.error(f"Error retrieving API key for user {user_id}, provider {provider}: {e}")
            return None
    
    async def delete_api_key(self, user_id: int, provider: str) -> bool:
        """
        Delete an API key for a user and provider
        
        Args:
            user_id: User's GitHub ID
            provider: Provider name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.db.client.table("api_keys").delete().eq(
                "github_id", user_id
            ).eq("provider", provider).execute()
            
            if result.data:
                logger.info(f"Successfully deleted {provider} API key for user {user_id}")
                return True
            else:
                logger.warning(f"No {provider} API key found to delete for user {user_id}")
                return True  # Consider it successful if nothing to delete
                
        except Exception as e:
            logger.error(f"Error deleting API key for user {user_id}, provider {provider}: {e}")
            return False
    
    async def get_user_providers(self, user_id: int) -> List[ProviderStatus]:
        """
        Get all configured providers for a user
        
        Args:
            user_id: User's GitHub ID
            
        Returns:
            List of ProviderStatus objects
        """
        try:
            # Get all API keys for the user
            result = self.db.client.table("api_keys").select(
                "provider, encrypted_key, updated_at"
            ).eq("github_id", user_id).execute()
            
            configured_providers = {}
            for row in result.data:
                provider = row["provider"]
                encrypted_key = row["encrypted_key"]
                updated_at = datetime.fromisoformat(row["updated_at"].replace('Z', '+00:00'))
                
                # Validate that the encrypted key can be decrypted
                is_valid = self.encryption.validate_encrypted_key(encrypted_key, user_id, provider)
                
                configured_providers[provider] = ProviderStatus(
                    provider=provider,
                    configured=True,
                    valid=is_valid,
                    last_validated=updated_at
                )
            
            # Add status for all supported providers
            all_providers = ["groq", "gemini", "openai"]
            provider_statuses = []
            
            for provider in all_providers:
                if provider in configured_providers:
                    provider_statuses.append(configured_providers[provider])
                else:
                    provider_statuses.append(ProviderStatus(
                        provider=provider,
                        configured=False,
                        valid=False,
                        last_validated=None
                    ))
            
            return provider_statuses
            
        except Exception as e:
            logger.error(f"Error getting providers for user {user_id}: {e}")
            # Return default status for all providers
            return [
                ProviderStatus(
                    provider=provider,
                    configured=False,
                    valid=False,
                    last_validated=None
                )
                for provider in ["groq", "gemini", "openai"]
            ]
    
    async def get_provider_status(self, user_id: int, provider: str) -> ProviderStatus:
        """
        Get status for a specific provider
        
        Args:
            user_id: User's GitHub ID
            provider: Provider name
            
        Returns:
            ProviderStatus object
        """
        try:
            result = self.db.client.table("api_keys").select(
                "encrypted_key, updated_at"
            ).eq("github_id", user_id).eq("provider", provider).execute()
            
            if not result.data:
                return ProviderStatus(
                    provider=provider,
                    configured=False,
                    valid=False,
                    last_validated=None
                )
            
            row = result.data[0]
            encrypted_key = row["encrypted_key"]
            updated_at = datetime.fromisoformat(row["updated_at"].replace('Z', '+00:00'))
            
            # Validate that the encrypted key can be decrypted
            is_valid = self.encryption.validate_encrypted_key(encrypted_key, user_id, provider)
            
            return ProviderStatus(
                provider=provider,
                configured=True,
                valid=is_valid,
                last_validated=updated_at
            )
            
        except Exception as e:
            logger.error(f"Error getting status for user {user_id}, provider {provider}: {e}")
            return ProviderStatus(
                provider=provider,
                configured=False,
                valid=False,
                last_validated=None
            )
    
    async def has_api_key(self, user_id: int, provider: str) -> bool:
        """
        Check if user has an API key for a specific provider
        
        Args:
            user_id: User's GitHub ID
            provider: Provider name
            
        Returns:
            True if user has a key for the provider
        """
        try:
            result = self.db.client.table("api_keys").select("id").eq(
                "github_id", user_id
            ).eq("provider", provider).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error checking API key existence for user {user_id}, provider {provider}: {e}")
            return False
    
    async def get_all_user_keys(self, user_id: int) -> Dict[str, str]:
        """
        Get all API keys for a user (for use in API calls)
        
        Args:
            user_id: User's GitHub ID
            
        Returns:
            Dictionary mapping provider names to decrypted API keys
        """
        try:
            result = self.db.client.table("api_keys").select(
                "provider, encrypted_key"
            ).eq("github_id", user_id).execute()
            
            keys = {}
            for row in result.data:
                provider = row["provider"]
                encrypted_key = row["encrypted_key"]
                
                try:
                    decrypted_key = self.encryption.decrypt_api_key(encrypted_key, user_id, provider)
                    keys[provider] = decrypted_key
                except Exception as e:
                    logger.warning(f"Failed to decrypt {provider} key for user {user_id}: {e}")
                    continue
            
            return keys
            
        except Exception as e:
            logger.error(f"Error getting all keys for user {user_id}: {e}")
            return {}


# Global API key manager instance
api_key_manager = APIKeyManager()
