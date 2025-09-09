"""
Encryption utilities for secure API key storage
Uses AES-256 encryption with PBKDF2 key derivation
"""
import os
import base64
import hashlib
import logging
from typing import Tuple, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class APIKeyEncryption:
    """Handles encryption and decryption of API keys"""
    
    def __init__(self):
        """Initialize encryption with master key from environment"""
        self.master_key = self._get_master_key()
        
    def _get_master_key(self) -> str:
        """Get or generate master encryption key"""
        master_key = os.getenv("API_KEY_ENCRYPTION_KEY")
        
        if not master_key:
            # Generate a new key for development/testing
            # In production, this should be set as an environment variable
            master_key = base64.urlsafe_b64encode(os.urandom(32)).decode()
            logger.warning("No API_KEY_ENCRYPTION_KEY found, using generated key. Set this in production!")
            
        return master_key
    
    def _derive_key(self, salt: bytes) -> bytes:
        """Derive encryption key from master key and salt"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        # Fix: Don't base64 encode the derived key, KDF already returns correct bytes
        return kdf.derive(self.master_key.encode())
    
    def encrypt_api_key(self, api_key: str, user_id: int, provider: str) -> str:
        """
        Encrypt an API key for storage
        
        Args:
            api_key: The API key to encrypt
            user_id: User's GitHub ID (used in salt)
            provider: Provider name (used in salt)
            
        Returns:
            Base64-encoded encrypted data with salt
        """
        try:
            # Create a unique salt for this user/provider combination
            salt_data = f"{user_id}:{provider}:{self.master_key[:8]}".encode()
            salt = hashlib.sha256(salt_data).digest()[:16]  # 16 bytes salt
            
            # Derive encryption key
            key = self._derive_key(salt)
            fernet = Fernet(key)
            
            # Encrypt the API key
            encrypted_key = fernet.encrypt(api_key.encode())
            
            # Combine salt and encrypted data
            combined = salt + encrypted_key
            
            # Return base64 encoded result
            return base64.urlsafe_b64encode(combined).decode()
            
        except Exception as e:
            logger.error(f"Failed to encrypt API key for user {user_id}, provider {provider}: {e}")
            raise ValueError("Failed to encrypt API key")
    
    def decrypt_api_key(self, encrypted_data: str, user_id: int, provider: str) -> str:
        """
        Decrypt an API key from storage
        
        Args:
            encrypted_data: Base64-encoded encrypted data with salt
            user_id: User's GitHub ID (used in salt)
            provider: Provider name (used in salt)
            
        Returns:
            Decrypted API key
        """
        try:
            # Decode base64 data
            combined = base64.urlsafe_b64decode(encrypted_data.encode())
            
            # Extract salt and encrypted data
            salt = combined[:16]
            encrypted_key = combined[16:]
            
            # Derive encryption key
            key = self._derive_key(salt)
            fernet = Fernet(key)
            
            # Decrypt the API key
            decrypted_key = fernet.decrypt(encrypted_key)
            
            return decrypted_key.decode()
            
        except Exception as e:
            logger.error(f"Failed to decrypt API key for user {user_id}, provider {provider}: {e}")
            raise ValueError("Failed to decrypt API key")
    
    def validate_encrypted_key(self, encrypted_data: str, user_id: int, provider: str) -> bool:
        """
        Validate that encrypted data can be decrypted
        
        Args:
            encrypted_data: Base64-encoded encrypted data
            user_id: User's GitHub ID
            provider: Provider name
            
        Returns:
            True if data can be decrypted, False otherwise
        """
        try:
            decrypted = self.decrypt_api_key(encrypted_data, user_id, provider)
            return len(decrypted) > 0
        except:
            return False


class APIKeyValidator:
    """Validates API keys by making test calls to provider APIs"""
    
    @staticmethod
    async def validate_groq_key(api_key: str) -> Tuple[bool, Optional[str]]:
        """
        Validate Groq API key by making a test call
        
        Returns:
            (is_valid, error_message)
        """
        try:
            import httpx
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # Make a simple test call to Groq API
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers=headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return True, None
                elif response.status_code == 401:
                    return False, "Invalid API key"
                else:
                    return False, f"API error: {response.status_code}"
                    
        except Exception as e:
            logger.warning(f"Groq key validation failed: {e}")
            return False, "Unable to validate key"
    
    @staticmethod
    async def validate_openai_key(api_key: str) -> Tuple[bool, Optional[str]]:
        """
        Validate OpenAI API key by making a test call
        
        Returns:
            (is_valid, error_message)
        """
        try:
            import httpx
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # Make a simple test call to OpenAI API
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers=headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return True, None
                elif response.status_code == 401:
                    return False, "Invalid API key"
                else:
                    return False, f"API error: {response.status_code}"
                    
        except Exception as e:
            logger.warning(f"OpenAI key validation failed: {e}")
            return False, "Unable to validate key"
    
    @staticmethod
    async def validate_gemini_key(api_key: str) -> Tuple[bool, Optional[str]]:
        """
        Validate Gemini API key by making a test call
        
        Returns:
            (is_valid, error_message)
        """
        try:
            import httpx
            
            # Make a simple test call to Gemini API
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return True, None
                elif response.status_code == 400:
                    return False, "Invalid API key"
                else:
                    return False, f"API error: {response.status_code}"
                    
        except Exception as e:
            logger.warning(f"Gemini key validation failed: {e}")
            return False, "Unable to validate key"
    
    @classmethod
    async def validate_key(cls, provider: str, api_key: str) -> Tuple[bool, Optional[str]]:
        """
        Validate API key for any provider
        
        Args:
            provider: Provider name (groq, gemini, openai)
            api_key: API key to validate
            
        Returns:
            (is_valid, error_message)
        """
        if provider == "groq":
            return await cls.validate_groq_key(api_key)
        elif provider == "openai":
            return await cls.validate_openai_key(api_key)
        elif provider == "gemini":
            return await cls.validate_gemini_key(api_key)
        else:
            return False, f"Unknown provider: {provider}"


# Global encryption instance
encryption = APIKeyEncryption()