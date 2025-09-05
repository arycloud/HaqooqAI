"""
Multi-Provider API Key Management Routes
Comprehensive CRUD operations for Groq, Gemini, and OpenAI API keys
"""
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from datetime import datetime

from ..models.requests import ApiKeyCreateRequest, ApiKeyDeleteRequest
from ..models.responses import (
    ApiKeyResponse, ApiKeyListResponse, ProviderStatus, 
    ErrorResponse
)
from ..auth.github_auth import GitHubAuthService
from ..database.api_key_manager import api_key_manager
from ..utils.encryption import APIKeyValidator
# from ..quota.tiered_usage_tracker import TieredUsageTracker

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()
security = HTTPBearer()

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[int, Dict[str, Any]] = {}


def check_rate_limit(user_id: int) -> bool:
    """
    Check if user is within rate limits (10 operations per minute)
    
    Args:
        user_id: User's GitHub ID
        
    Returns:
        True if within limits, False otherwise
    """
    now = datetime.now()
    
    if user_id not in rate_limit_storage:
        rate_limit_storage[user_id] = {
            "count": 1,
            "window_start": now
        }
        return True
    
    user_data = rate_limit_storage[user_id]
    
    # Reset window if more than 1 minute has passed
    if (now - user_data["window_start"]).total_seconds() > 60:
        rate_limit_storage[user_id] = {
            "count": 1,
            "window_start": now
        }
        return True
    
    # Check if within limit
    if user_data["count"] >= 10:
        return False
    
    # Increment count
    user_data["count"] += 1
    return True


async def get_auth_service() -> GitHubAuthService:
    """Dependency to get auth service"""
    return GitHubAuthService()


async def authenticate_user(request: ApiKeyCreateRequest, auth_service: GitHubAuthService = Depends(get_auth_service)):
    """Authenticate user and check rate limits"""
    # Validate GitHub token
    try:
        user = await auth_service.validate_token(request.github_token)
        if user.github_id != request.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="GitHub token does not match user ID"
            )
    except Exception as e:
        logger.warning(f"Authentication failed for user {request.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid GitHub token"
        )
    
    # Check rate limits
    if not check_rate_limit(request.user_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 operations per minute."
        )
    
    return user


@router.post("/api-keys", response_model=ApiKeyResponse)
async def create_or_update_api_key(
    request: ApiKeyCreateRequest,
    user = Depends(authenticate_user)
):
    """
    Add or update an API key for a specific provider
    
    - **provider**: LLM provider (groq, gemini, openai)
    - **api_key**: The API key to store (will be encrypted)
    - **github_token**: GitHub token for authentication
    - **user_id**: User's GitHub ID
    
    Returns provider status and success confirmation.
    Performs upsert operation (update if exists, insert if new).
    """
    try:
        # Validate API key format (already done by Pydantic, but double-check)
        if request.provider == "groq" and not request.api_key.startswith("gsk_"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Groq API key format (must start with gsk_)"
            )
        elif request.provider == "openai" and not request.api_key.startswith("sk-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OpenAI API key format (must start with sk-)"
            )
        
        # Optional: Validate API key by making a test call
        try:
            is_valid, error_msg = await APIKeyValidator.validate_key(request.provider, request.api_key)
            if not is_valid:
                logger.warning(f"API key validation failed for {request.provider}: {error_msg}")
                # Don't fail the request, just log the warning
                # Some users might have keys that work but fail our test
        except Exception as e:
            logger.warning(f"API key validation error for {request.provider}: {e}")
        
        # Store the encrypted API key
        success = await api_key_manager.store_api_key(
            user_id=request.user_id,
            provider=request.provider,
            api_key=request.api_key
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store API key"
            )
        
        logger.info(f"Successfully stored {request.provider} API key for user {request.user_id}")
        
        return ApiKeyResponse(
            status="success",
            message=f"{request.provider.title()} API key stored successfully",
            provider=request.provider,
            configured=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error storing API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/api-keys", response_model=ApiKeyListResponse)
async def list_user_api_keys(
    github_token: str,
    user_id: int,
    auth_service: GitHubAuthService = Depends(get_auth_service)
):
    """
    List all configured providers for the authenticated user
    
    - **github_token**: GitHub token for authentication
    - **user_id**: User's GitHub ID
    
    Returns list of provider statuses. Never returns actual API key values.
    """
    try:
        # Authenticate user
        try:
            user = await auth_service.validate_token(github_token)
            if user.github_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="GitHub token does not match user ID"
                )
        except Exception as e:
            logger.warning(f"Authentication failed for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub token"
            )
        
        # Check rate limits
        if not check_rate_limit(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Maximum 10 operations per minute."
            )
        
        # Get provider statuses
        providers = await api_key_manager.get_user_providers(user_id)
        total_configured = sum(1 for p in providers if p.configured)
        
        logger.info(f"Retrieved provider list for user {user_id}: {total_configured} configured")
        
        return ApiKeyListResponse(
            status="success",
            providers=providers,
            total_configured=total_configured
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing API keys for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/api-keys/{provider}", response_model=ApiKeyResponse)
async def delete_api_key(
    provider: str,
    request: ApiKeyDeleteRequest,
    auth_service: GitHubAuthService = Depends(get_auth_service)
):
    """
    Remove API key for specific provider
    
    - **provider**: Provider name (groq, gemini, openai)
    - **github_token**: GitHub token for authentication
    - **user_id**: User's GitHub ID
    
    Returns deletion confirmation and updated provider status.
    """
    try:
        # Validate provider
        if provider not in ["groq", "gemini", "openai"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid provider. Must be one of: groq, gemini, openai"
            )
        
        # Authenticate user
        try:
            user = await auth_service.validate_token(request.github_token)
            if user.github_id != request.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="GitHub token does not match user ID"
                )
        except Exception as e:
            logger.warning(f"Authentication failed for user {request.user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub token"
            )
        
        # Check rate limits
        if not check_rate_limit(request.user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Maximum 10 operations per minute."
            )
        
        # Delete the API key
        success = await api_key_manager.delete_api_key(
            user_id=request.user_id,
            provider=provider
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete API key"
            )
        
        logger.info(f"Successfully deleted {provider} API key for user {request.user_id}")
        
        return ApiKeyResponse(
            status="success",
            message=f"{provider.title()} API key deleted successfully",
            provider=provider,
            configured=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/api-keys/{provider}/status", response_model=ProviderStatus)
async def get_provider_status(
    provider: str,
    github_token: str,
    user_id: int,
    auth_service: GitHubAuthService = Depends(get_auth_service)
):
    """
    Check provider-specific key status

    - **provider**: Provider name (groq, gemini, openai)
    - **github_token**: GitHub token for authentication
    - **user_id**: User's GitHub ID

    Returns detailed status for the specific provider including configuration and validation status.
    """
    try:
        # Validate provider
        if provider not in ["groq", "gemini", "openai"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid provider. Must be one of: groq, gemini, openai"
            )

        # Authenticate user
        try:
            user = await auth_service.validate_token(github_token)
            if user.github_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="GitHub token does not match user ID"
                )
        except Exception as e:
            logger.warning(f"Authentication failed for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid GitHub token"
            )

        # Check rate limits
        if not check_rate_limit(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Maximum 10 operations per minute."
            )

        # Get provider status
        status_info = await api_key_manager.get_provider_status(user_id, provider)

        logger.info(f"Retrieved {provider} status for user {user_id}: configured={status_info.configured}")

        return status_info

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting provider status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# Legacy routes for backward compatibility
@router.post("/groq-key", response_model=ApiKeyResponse)
async def store_groq_key_legacy(
    request: ApiKeyCreateRequest,
    user = Depends(authenticate_user)
):
    """
    Legacy endpoint for storing Groq API key (backward compatibility)

    Redirects to the new multi-provider endpoint with provider="groq"
    """
    # Force provider to groq for this legacy endpoint
    request.provider = "groq"

    return await create_or_update_api_key(request, user)


@router.delete("/groq-key", response_model=ApiKeyResponse)
async def delete_groq_key_legacy(
    request: ApiKeyDeleteRequest,
    auth_service: GitHubAuthService = Depends(get_auth_service)
):
    """
    Legacy endpoint for deleting Groq API key (backward compatibility)

    Redirects to the new multi-provider endpoint with provider="groq"
    """
    return await delete_api_key("groq", request, auth_service)
