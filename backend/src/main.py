"""
HaqooqAI Backend - FastAPI Application
Simplified AI service for Pakistani legal information with support for both web and mobile frontends
"""

# Standard library imports
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict

# Third-party imports
import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.encoders import jsonable_encoder
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Local imports

from .config import (
    API_TITLE, API_VERSION, API_DESCRIPTION, ALLOWED_ORIGINS,
    LOG_LEVEL, LOG_FORMAT, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI,
    CORS_ALLOW_CREDENTIALS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS,
    ROUTING_MESSAGE_THRESHOLD, ROUTING_TOKEN_THRESHOLD, MAX_QUERY_TOKENS, MAX_CONVERSATION_MESSAGES
)
from .models.requests import (
    AuthRequest, DeleteApiKeyRequest, QueryRequest, ApiKeyRequest,
    ConversationCreateRequest, MessageCreateRequest, TokenExchangeRequest
)
from .models.responses import (
    AuthResponse, AIResponse, ApiKeyResponse, QuotaResponse,
    HealthResponse, ErrorResponse, UserProfile, QuotaInfo,
    ConversationResponse, MessageResponse, ConversationListResponse,
    ConversationWithMessagesResponse, TokenExchangeResponse
)
from .auth.github_auth import GitHubAuthService
from .quota.usage_tracker import UsageTracker
from .quota.tiered_usage_tracker import TieredUsageTracker, LLMProvider
from .ai.rag_engine import LegalRAGEngine
from .services.conversation_manager import ConversationManager
from .routes.api_key_management import router as api_key_router


# ============================================================================
# OAuth State Management (for mobile/web flow coordination)
# ============================================================================

# In-memory state management for OAuth flows
state_map: Dict[str, str] = {}
state_timestamps: Dict[str, datetime] = {}

def cleanup_expired_states():
    """Remove OAuth states older than 10 minutes"""
    cutoff_time = datetime.now() - timedelta(minutes=10)
    expired_states = [s for s, t in state_timestamps.items() if t < cutoff_time]
    for state in expired_states:
        state_map.pop(state, None)
        state_timestamps.pop(state, None)

# ============================================================================
# FastAPI Application Setup
# ============================================================================

# Configure logging
logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware with mobile support
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=CORS_ALLOW_METHODS,
    allow_headers=CORS_ALLOW_HEADERS,
    # Additional settings for mobile apps
    allow_origin_regex=r"^https?://localhost(:\d+)?$|^capacitor://localhost$|^ionic://localhost$|^haqooqai://.*$",
)

# Include API routers
app.include_router(api_key_router, prefix="/user", tags=["API Key Management"])

# ============================================================================
# Global Service Instances
# ============================================================================

# Global instances (initialized on startup)
auth_service: Optional[GitHubAuthService] = None
usage_tracker: Optional[UsageTracker] = None
tiered_tracker: Optional[TieredUsageTracker] = None
rag_engine: Optional[LegalRAGEngine] = None
conversation_manager: Optional[ConversationManager] = None

# Make supabase_client accessible globally (will be replaced with mock in testing mode)
from .database.supabase_client import supabase_client


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global auth_service, usage_tracker, rag_engine, conversation_manager, tiered_tracker

    try:
        logger.info("🚀 Initializing services")
        auth_service = GitHubAuthService()
        usage_tracker = UsageTracker()  # Legacy tracker for compatibility
        tiered_tracker = TieredUsageTracker()  # New tiered quota system
        rag_engine = LegalRAGEngine()
        conversation_manager = ConversationManager()

        logger.info("✅ All services initialized successfully (including tiered quota system)")

        # Log health status
        if rag_engine:
            health = await rag_engine.check_rag_health()
            logger.info(f"RAG Engine health: {health}")

    except Exception as e:
        logger.error(f"Error during startup: {e}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom HTTP exception handler with safe frontend output"""
    logger.warning(f"HTTP error {exc.status_code}: {exc.detail}")
    error_response = ErrorResponse(
        status="error",
        error="HTTP_ERROR",
        message=str(exc.detail),
        details=None
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(error_response.dict())
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """General exception handler (catches everything else)"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    error_response = ErrorResponse(
        status="error",
        error="INTERNAL_ERROR",
        message="An internal server error occurred",  # safe frontend message
        details=None  # backend logs contain actual stacktrace
    )
    return JSONResponse(
        status_code=500,
        content=jsonable_encoder(error_response.dict())
    )


# Dependency functions
async def get_auth_service() -> GitHubAuthService:
    """Get GitHub authentication service"""
    if not auth_service:
        raise HTTPException(
            status_code=503,
            detail="Authentication service not available"
        )
    return auth_service


async def get_usage_tracker() -> UsageTracker:
    """Get usage tracker service"""
    if not usage_tracker:
        raise HTTPException(
            status_code=503,
            detail="Usage tracking service not available"
        )
    return usage_tracker


async def get_rag_engine() -> LegalRAGEngine:
    """Get RAG engine service"""
    if not rag_engine:
        raise HTTPException(
            status_code=503,
            detail="AI service not available"
        )
    return rag_engine


async def get_conversation_manager() -> ConversationManager:
    """Get conversation manager service"""
    if not conversation_manager:
        raise HTTPException(
            status_code=503,
            detail="Conversation management service not available"
        )
    return conversation_manager


# ============================================================================
# API Routes
# ============================================================================

# ----------------------------------------------------------------------------
# Root & Information Endpoints
# ----------------------------------------------------------------------------

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information and available endpoints"""
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION + " - Supports both web and mobile frontends",
        "status": "operational",
        "endpoints": {
            "authentication": {
                "validate_token": "POST /auth/validate",
                "exchange_token": "POST /auth/exchange",
                "github_login": "GET /login/github",
                "github_login_mobile": "POST /login/github/start",
                "oauth_callback": "GET /HaqooqAI/callback"
            },
            "ai_processing": {
                "ask_question": "POST /ask/"
            },
            "user_management": {
                "save_api_key": "POST /user/groq-key",
                "delete_api_key": "DELETE /user/groq-key",
                "get_quota": "GET /user/quota/{user_id}"
            },
            "conversations": {
                "list_conversations": "GET /conversations",
                "create_conversation": "POST /conversations",
                "get_conversation": "GET /conversations/{conversation_id}",
                "update_conversation": "PUT /conversations/{conversation_id}",
                "delete_conversation": "DELETE /conversations/{conversation_id}",
                "create_message": "POST /conversations/{conversation_id}/messages"
            },
            "monitoring": {
                "health_check": "GET /health",
                "system_stats": "GET /stats"
            },
            "documentation": {
                "swagger_ui": "GET /docs",
                "redoc": "GET /redoc"
            }
        },
        "features": [
            "GitHub OAuth authentication for web and mobile",
            "AI-powered legal question answering",
            "Conversation management with persistent storage",
            "User quota management and API key support",
            "Comprehensive health monitoring"
        ]
    }


# ----------------------------------------------------------------------------
# Authentication Endpoints
# ----------------------------------------------------------------------------

@app.post("/auth/validate", response_model=AuthResponse)
async def validate_auth(
    request: AuthRequest,
    auth_svc: GitHubAuthService = Depends(get_auth_service),
    tracker: UsageTracker = Depends(get_usage_tracker)
):
    """Validate GitHub token and return user profile with quota info"""
    try:
        # Validate GitHub token
        user = await auth_svc.validate_token(request.github_token)

        # Get quota information
        quota = tracker.check_quota(user.github_id)

        logger.info(f"Successful auth for user {user.username} (ID: {user.github_id})")

        return AuthResponse(
            status="success",
            user=user,
            quota=quota,
            message="Authentication successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth validation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Authentication service error"
        )


@app.post("/auth/exchange", response_model=TokenExchangeResponse)
async def exchange_token(
    request: TokenExchangeRequest,
    auth_svc: GitHubAuthService = Depends(get_auth_service),
    tracker: UsageTracker = Depends(get_usage_tracker)
):
    """Exchange authorization code for access token (for mobile apps)"""
    try:
        # Exchange code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": request.code,
                },
                headers={"Accept": "application/json"}
            )

            if token_response.status_code != 200:
                logger.error(f"GitHub token exchange failed: {token_response.status_code} - {token_response.text}")
                raise HTTPException(
                    status_code=400,
                    detail="Failed to exchange authorization code for token"
                )

            token_data = token_response.json()

            if "error" in token_data:
                logger.error(f"GitHub OAuth error: {token_data}")
                raise HTTPException(
                    status_code=400,
                    detail=f"GitHub OAuth error: {token_data.get('error_description', token_data.get('error'))}"
                )

            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(
                    status_code=400,
                    detail="No access token received from GitHub"
                )

        # Validate the token and get user info
        user = await auth_svc.validate_token(access_token)

        # Get quota information
        quota = tracker.check_quota(user.github_id)

        logger.info(f"Token exchange successful for user {user.username} (ID: {user.github_id})")

        return TokenExchangeResponse(
            status="success",
            access_token=access_token,
            user=user,
            quota=quota,
            message="Token exchange successful"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token exchange error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Token exchange service error"
        )


# ----------------------------------------------------------------------------
# AI Processing Endpoints
# ----------------------------------------------------------------------------

@app.post("/ask/", response_model=AIResponse)
async def process_query(
    request: QueryRequest,
    rag: LegalRAGEngine = Depends(get_rag_engine),
    tracker: UsageTracker = Depends(get_usage_tracker),
    conv_manager: ConversationManager = Depends(get_conversation_manager)
):
    """Process AI query and return response with tiered quota system"""
    try:
        # ============================================================================
        # 1. GLOBAL LIMITS ENFORCEMENT (Applied to all users regardless of API keys)
        # ============================================================================

        # Check query token limit (MAX_QUERY_TOKENS=4000)
        from .ai.llm_providers import LLMProviderManager
        provider_manager = LLMProviderManager()

        is_valid, token_count, error_msg = provider_manager.validate_query_length(request.query)
        if not is_valid:
            raise HTTPException(
                status_code=429,
                detail=error_msg
            )

        # Check conversation message limit (MAX_CONVERSATION_MESSAGES=50)
        can_continue, limit_message = conv_manager.check_conversation_limit(
            request.conversation_id, request.user_id
        )
        if not can_continue:
            raise HTTPException(
                status_code=429,
                detail=limit_message
            )

        # ============================================================================
        # 2. RETRIEVE STORED API KEYS AND MERGE WITH REQUEST KEYS
        # ============================================================================

        # Get stored API keys for the user
        from .database.api_key_manager import api_key_manager
        stored_keys = await api_key_manager.get_all_user_keys(request.user_id)

        # Merge request keys with stored keys (request keys take priority)
        effective_groq_key = request.groq_api_key or stored_keys.get("groq")
        effective_gemini_key = request.gemini_api_key or stored_keys.get("gemini")
        effective_openai_key = request.openai_api_key or stored_keys.get("openai")

        logger.info(f"API keys for user {request.user_id}: "
                   f"groq={'provided' if effective_groq_key else 'none'}, "
                   f"gemini={'provided' if effective_gemini_key else 'none'}, "
                   f"openai={'provided' if effective_openai_key else 'none'}")

        # ============================================================================
        # 3. PROVIDER SELECTION AND QUOTA CHECKING
        # ============================================================================

        # Determine which provider to use based on routing logic
        conv_stats = conv_manager.get_conversation_stats(request.conversation_id, request.user_id)
        routing_decision = provider_manager.determine_provider(
            query=request.query,
            message_count=conv_stats.message_count,
            user_groq_key=effective_groq_key,
            user_gemini_key=effective_gemini_key,
            user_openai_key=effective_openai_key
        )

        # Check provider-specific quota using tiered tracker
        global tiered_tracker
        if tiered_tracker:
            provider_enum = LLMProvider(routing_decision.provider.value)
            can_proceed, quota_message = tiered_tracker.check_provider_quota(
                user_id=request.user_id,
                provider=provider_enum,
                has_user_key=routing_decision.using_user_key
            )

            if not can_proceed:
                raise HTTPException(
                    status_code=429,
                    detail=quota_message
                )

            # Increment provider-specific usage
            tiered_tracker.increment_provider_usage(
                user_id=request.user_id,
                provider=provider_enum,
                has_user_key=routing_decision.using_user_key
            )
        else:
            # Fallback to legacy quota checking
            quota = tracker.check_quota(request.user_id)
            if not routing_decision.using_user_key and quota.remaining <= 0:
                raise HTTPException(
                    status_code=429,
                    detail="Query quota exceeded. Please wait for reset or provide your own API key."
                )
            if not routing_decision.using_user_key:
                tracker.increment_usage(request.user_id)

        # ============================================================================
        # 3. PROCESS QUERY WITH SELECTED PROVIDER
        # ============================================================================

        # Log routing decision for monitoring
        logger.info(f"Routing decision: {routing_decision.provider.value} - {routing_decision.reason}")
        logger.info(f"Using user key: {routing_decision.using_user_key}")
        logger.info(f"Conversation stats: {conv_stats.message_count} messages, tokens: {conv_stats.total_tokens}")

        # Process query through RAG engine with effective API keys
        result = await rag.process_query(
            query=request.query,
            groq_key=effective_groq_key,
            gemini_key=effective_gemini_key,
            openai_key=effective_openai_key,
            conversation_id=request.conversation_id,
            user_id=request.user_id
        )


        # -------------------------
        # LOCAL-ONLY: persist assistant reply for immediate follow-ups, remove this when in production
        # -------------------------
        try:
            # import local DB client (already used in other routes)
            from .database.supabase_client import supabase_client  # adjust relative import to your file's path

            # Resolve internal user id (same helper your create_message route uses)
            user_internal_id = supabase_client.get_user_internal_id(request.user_id)
            if user_internal_id and request.conversation_id:
                # Use thread-run to avoid blocking the event loop
                import anyio

                def _insert_msg():
                    # create_message returns inserted row dict
                    return supabase_client.create_message(
                        conversation_id=request.conversation_id,
                        role="assistant",
                        content=result.get("response", "") or "",
                        # sources=result.get("sources") or None
                    )

                try:
                    inserted_row = await anyio.to_thread.run_sync(_insert_msg)
                    logger.info(
                        "LOCAL-PERSIST: inserted assistant message id=%s conversation=%s user_internal_id=%s",
                        inserted_row.get("id"),
                        request.conversation_id,
                        user_internal_id
                    )
                except Exception as _e:
                    logger.error("LOCAL-PERSIST: failed to persist assistant message (will continue): %s", _e)
            else:
                logger.debug("LOCAL-PERSIST: no user_internal_id or conversation_id; skipping local persistence")
        except Exception as e:
            logger.error("LOCAL-PERSIST: unexpected error while persisting assistant message: %s", e)
        # -------------------------
        # end local-only persistence
        # -------------------------

        # ============================================================================
        # 4. GENERATE RESPONSE WITH QUOTA AND ROUTING INFORMATION
        # ============================================================================

        # Get updated quota information
        if tiered_tracker:
            # Use tiered quota system
            quota_summary = tiered_tracker.get_user_quota_summary(request.user_id)
            provider_quota = tiered_tracker.get_provider_quota(
                user_id=request.user_id,
                provider=LLMProvider(routing_decision.provider.value),
                has_user_key=routing_decision.using_user_key
            )

            from .models.responses import QuotaInfo
            updated_quota = QuotaInfo(
                remaining=provider_quota.remaining if not provider_quota.unlimited else 999999,
                limit=provider_quota.daily_limit,
                reset_at=provider_quota.reset_at,
                has_api_key=provider_quota.has_user_key,
                unlimited=provider_quota.unlimited
            )
        else:
            updated_quota = tracker.get_usage(request.user_id)

        # Generate query ID for tracking
        query_id = str(uuid.uuid4())

        # Create routing information for response
        from .models.responses import RoutingInfo
        routing_info = RoutingInfo(
            provider=routing_decision.provider.value,
            reason=routing_decision.reason,
            message_count=routing_decision.message_count,
            query_tokens=routing_decision.query_tokens,
            using_user_key=routing_decision.using_user_key,
            estimated_cost=routing_decision.estimated_cost
        )

        logger.info(f"Processed query for user {request.user_id}, query_id: {query_id}")

        return AIResponse(
            status="success",
            response=result["response"],
            sources=result.get("sources", []),
            disclaimer=result.get("disclaimer", ''),
            usage=updated_quota,
            processing_time=result.get("processing_time"),
            query_id=query_id,
            routing_info=routing_info
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI service error"
        )


# ----------------------------------------------------------------------------
# User Management Endpoints
# ----------------------------------------------------------------------------

@app.post("/user/groq-key", response_model=ApiKeyResponse)
async def save_groq_key(
    request: ApiKeyRequest,
    authorization: str = Header(...),
    auth_svc: GitHubAuthService = Depends(get_auth_service),
    tracker: UsageTracker = Depends(get_usage_tracker)
):
    """Save user's Groq API key for unlimited access"""
    try:
        # Validate GitHub token first
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        github_token = authorization.split(" ", 1)[1]
        user = await auth_svc.validate_token(github_token)
        

        # Verify user ID matches
        if user.github_id != request.user_id:
            raise HTTPException(
                status_code=403,
                detail="User ID mismatch"
            )

        # Save API key
        success = tracker.save_api_key(request.user_id, request.groq_api_key)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to save API key"
            )

        logger.info(f"API key saved for user {user.username} (ID: {user.github_id})")

        return ApiKeyResponse(
            status="success",
            message="API key saved successfully",
            provider="groq",  # Legacy endpoint specifically for Groq
            configured=True,
            has_unlimited=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API key save error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save API key"
        )

@app.delete("/user/groq-key", response_model=ApiKeyResponse)
async def delete_groq_key(
    request: DeleteApiKeyRequest,
    authorization: str = Header(...),
    auth_svc: GitHubAuthService = Depends(get_auth_service),
    tracker: UsageTracker = Depends(get_usage_tracker)
):
    """Delete user's Groq API key"""
    try:
        # Validate GitHub token
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        github_token = authorization.split(" ", 1)[1]

        user = await auth_svc.validate_token(github_token)

        # Verify user ID matches
        if user.github_id != request.user_id:
            raise HTTPException(status_code=403, detail="User ID mismatch")

        # Delete API key
        success = supabase_client.delete_user_api_key(request.user_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete API key")

        logger.info(f"API key deleted for user {user.username} (ID: {user.github_id})")

        return ApiKeyResponse(
            status="success",
            message="API key deleted successfully",
            provider="groq",  # Legacy endpoint specifically for Groq
            configured=False,
            has_unlimited=False
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API key deletion error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete API key")



@app.get("/user/quota/{user_id}", response_model=QuotaResponse)
async def get_user_quota(
    user_id: int,
    tracker: UsageTracker = Depends(get_usage_tracker)
):
    """Get user's current quota information"""
    try:
        quota = tracker.check_quota(user_id)

        return QuotaResponse(
            remaining=quota.remaining,
            limit=quota.limit,
            reset_at=quota.reset_at,
            has_api_key=quota.has_api_key,
            unlimited=quota.unlimited
        )

    except Exception as e:
        logger.error(f"Quota check error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check quota"
        )


# ----------------------------------------------------------------------------
# GitHub OAuth Endpoints (Web & Mobile Support)
# ----------------------------------------------------------------------------

@app.get("/login/github")
async def github_login():
    """Redirect to GitHub OAuth authorization"""
    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth not configured"
        )

    # GitHub OAuth authorization URL
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=user:email"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
    )

    return RedirectResponse(url=github_auth_url)


@app.post('/login/github/start')
async def github_login_start(payload: dict):
    """Start an OAuth flow and return an auth URL for mobile"""
    target = payload.get('target')
    
    # Clean up expired states first
    cleanup_expired_states()
    
    # Generate new state
    import secrets
    state_id = secrets.token_urlsafe(16)
    
    logger.info(f"Starting OAuth flow with state: {state_id}")
    
    # Store state data
    if target:
        from urllib.parse import quote
        encoded_target = quote(target)
        state_map[state_id] = encoded_target
        logger.info(f"Stored mobile target for state {state_id}: {encoded_target}")
    else:
        state_map[state_id] = None
        logger.info("Web flow - no target stored")

    # Record timestamp for cleanup
    state_timestamps[state_id] = datetime.now()

    # Build the GitHub authorize URL
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=user:email"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&state={state_id}"
    )

    return {'auth_url': github_auth_url, 'state': state_id}


@app.get("/HaqooqAI/callback")
async def github_callback(code: str = None, error: str = None, state: Optional[str] = None):
    """Handle GitHub OAuth callback - updated for proper mobile flow handling"""
    if error:
        raise HTTPException(
            status_code=400,
            detail=f"GitHub OAuth error: {error}"
        )

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Authorization code is required"
        )

    logger.info(f"Received callback with state: {state}")

    try:
        # Clean up any expired states first
        cleanup_expired_states()

        # Look up the target from state_map for mobile flow
        target = None
        if state and state in state_map:
            target = state_map[state]
            logger.info(f"Found mobile target for state {state}: {target}")
            # Clean up used state immediately
            state_map.pop(state)
            state_timestamps.pop(state, None)

        if target:
            try:
                from urllib.parse import unquote
                target = unquote(target)
                logger.info(f"Redirecting to mobile target: {target}")
            except Exception as e:
                logger.error(f"Error unquoting target: {e}")
                # Keep original target if unquote fails

            # Redirect to mobile app with the code
            return RedirectResponse(url=f"{target}?code={code}", status_code=302)

        # Default web flow: exchange code for token
        logger.info("Proceeding with web flow token exchange")
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                },
                headers={"Accept": "application/json"}
            )

            if token_response.status_code != 200:
                logger.error(f"GitHub token exchange failed: {token_response.status_code} - {token_response.text}")
                raise HTTPException(
                    status_code=400,
                    detail="Failed to exchange authorization code for token"
                )

            token_data = token_response.json()

            if "error" in token_data:
                logger.error(f"GitHub OAuth error: {token_data}")
                # Redirect to frontend login page with error
                from .config import FRONTEND_PRUDCTION_URL
                frontend_url = FRONTEND_PRUDCTION_URL or "https://haqooqai.com/"
                login_url = "https://haqooqai.com/#/login"
                return RedirectResponse(
                    url=f"{login_url}?error={token_data.get('error', 'oauth_error')}&error_description={token_data.get('error_description', 'OAuth authentication failed')}",
                    status_code=302
                )

            access_token = token_data.get("access_token")
            if not access_token:
                logger.error("No access token received from GitHub")
                from .config import FRONTEND_PRUDCTION_URL
                frontend_url = FRONTEND_PRUDCTION_URL or "https://haqooqai.com"
                login_url = "https://haqooqai.com/#/login"
                return RedirectResponse(
                    url=f"{login_url}?error=no_token&error_description=No access token received",
                    status_code=302
                )

            # FRONTEND_URL = "https://haqooqai.com/"
            # return RedirectResponse(
            #     url=f"{FRONTEND_URL}#/dashboard?access_token={access_token}",
            #     status_code=302
            # )


            # Redirect to frontend dashboard with access token
            from .config import FRONTEND_PRUDCTION_URL
            frontend_url = FRONTEND_PRUDCTION_URL or "https://haqooqai.com/"
            # Redirect to dashboard page instead of root to avoid AuthGuard issues
            dashboard_url = f"{frontend_url}#/dashboard?access_token={access_token}"
            logger.info(f"Redirecting to frontend dashboard with token for web flow: {dashboard_url}")
            return RedirectResponse(
                url=f"{frontend_url}#/dashboard?access_token={access_token}",
                status_code=302
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in callback handler: {e}")
        # Redirect to frontend login page with error
        try:
            from .config import FRONTEND_PRUDCTION_URL
            frontend_url = FRONTEND_PRUDCTION_URL or "https://haqooqai.com"
            login_url = f"{frontend_url.rstrip('/')}/login"
            return RedirectResponse(
                url=f"{login_url}?error=callback_error&error_description=OAuth callback processing failed",
                status_code=302
            )
        except:
            raise HTTPException(
                status_code=500,
                detail=f"OAuth callback processing failed: {str(e)}"
            )


# ----------------------------------------------------------------------------
# Conversation Management Endpoints
# ----------------------------------------------------------------------------

@app.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    user_id: int,
    auth_svc: GitHubAuthService = Depends(get_auth_service)
):
    """Get all conversations for a user"""
    try:
        from .database.supabase_client import supabase_client

        if not supabase_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not available")

        conversations = supabase_client.get_user_conversations(user_id)

        return ConversationListResponse(
            conversations=[
                ConversationResponse(
                    id=conv['id'],
                    user_id=conv['user_id'],
                    title=conv['title'],
                    created_at=conv['created_at'],
                    updated_at=conv['updated_at']
                ) for conv in conversations
            ],
            total=len(conversations)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")


@app.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    request: ConversationCreateRequest,
    auth_svc: GitHubAuthService = Depends(get_auth_service)
):
    """Create a new conversation"""
    try:
        # Validate GitHub token
        user = await auth_svc.validate_token(request.github_token)

        # Verify user ID matches
        if user.github_id != request.user_id:
            raise HTTPException(status_code=403, detail="User ID mismatch")

        from .database.supabase_client import supabase_client

        if not supabase_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not available")

        # Get user's internal ID
        user_internal_id = supabase_client.get_user_internal_id(user.github_id)
        if not user_internal_id:
            raise HTTPException(status_code=404, detail="User not found")

        conversation = supabase_client.create_conversation(user_internal_id, request.title)

        return ConversationResponse(
            id=conversation['id'],
            user_id=conversation['user_id'],
            title=conversation['title'],
            created_at=conversation['created_at'],
            updated_at=conversation['updated_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create conversation")


@app.get("/conversations/{conversation_id}", response_model=ConversationWithMessagesResponse)
async def get_conversation_with_messages(
    conversation_id: str,
    user_id: int,
    auth_svc: GitHubAuthService = Depends(get_auth_service)
):
    """Get a conversation with all its messages"""
    try:
        from .database.supabase_client import supabase_client

        if not supabase_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not available")

        # Get user's internal ID
        user_internal_id = supabase_client.get_user_internal_id(user_id)
        if not user_internal_id:
            raise HTTPException(status_code=404, detail="User not found")

        conversation = supabase_client.get_conversation_with_messages(conversation_id, user_internal_id)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return ConversationWithMessagesResponse(
            conversation=ConversationResponse(
                id=conversation['id'],
                user_id=conversation['user_id'],
                title=conversation['title'],
                created_at=conversation['created_at'],
                updated_at=conversation['updated_at']
            ),
            messages=[
                MessageResponse(
                    id=msg['id'],
                    conversation_id=msg['conversation_id'],
                    role=msg['role'],
                    content=msg['content'],
                    sources=msg.get('sources'),
                    created_at=msg['created_at']
                ) for msg in conversation.get('messages', [])
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversation")


@app.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    conversation_id: str,
    request: MessageCreateRequest,
    auth_svc: GitHubAuthService = Depends(get_auth_service)
):
    """Create a new message in a conversation"""
    try:
        # Validate GitHub token
        user = await auth_svc.validate_token(request.github_token)

        # Verify user ID matches
        if user.github_id != request.user_id:
            raise HTTPException(status_code=403, detail="User ID mismatch")

        from .database.supabase_client import supabase_client

        if not supabase_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not available")

        # Get user's internal ID
        user_internal_id = supabase_client.get_user_internal_id(user.github_id)
        if not user_internal_id:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify conversation belongs to user
        if not supabase_client.verify_conversation_ownership(conversation_id, user_internal_id):
            raise HTTPException(status_code=403, detail="Access denied")

        message = supabase_client.create_message(
            conversation_id, request.role, request.content, request.sources
        )

        return MessageResponse(
            id=message['id'],
            conversation_id=message['conversation_id'],
            role=message['role'],
            content=message['content'],
            sources=message.get('sources'),
            created_at=message['created_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message: {e}")
        raise HTTPException(status_code=500, detail="Failed to create message")


@app.put("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    title: str,
    user_id: int,
    auth_svc: GitHubAuthService = Depends(get_auth_service)
):
    """Update a conversation (currently only title)"""
    try:
        from .database.supabase_client import supabase_client

        if not supabase_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not available")

        # Get user's internal ID
        user_internal_id = supabase_client.get_user_internal_id(user_id)
        if not user_internal_id:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify conversation belongs to user and update
        conversation = supabase_client.update_conversation(conversation_id, user_internal_id, title)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or access denied")

        return ConversationResponse(
            id=conversation['id'],
            user_id=conversation['user_id'],
            title=conversation['title'],
            created_at=conversation['created_at'],
            updated_at=conversation['updated_at']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update conversation")


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: int,
    auth_svc: GitHubAuthService = Depends(get_auth_service)
):
    """Delete a conversation and its messages"""
    try:
        from .database.supabase_client import supabase_client

        if not supabase_client.is_connected():
            raise HTTPException(status_code=503, detail="Database not available")

        # Get user's internal ID
        user_internal_id = supabase_client.get_user_internal_id(user_id)
        if not user_internal_id:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify ownership
        if not supabase_client.verify_conversation_ownership(conversation_id, user_internal_id):
            raise HTTPException(status_code=403, detail="Access denied")

        # Perform deletion
        deleted = supabase_client.delete_conversation(conversation_id, user_internal_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found or already deleted")

        return {"status": "success", "message": "Conversation deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete conversation")


# ----------------------------------------------------------------------------
# Health & Monitoring Endpoints
# ----------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
async def health_check(
    auth_svc: GitHubAuthService = Depends(get_auth_service),
    rag: LegalRAGEngine = Depends(get_rag_engine)
):
    """Comprehensive health check of all services"""
    try:
        services = {}

        # Check GitHub API
        try:
            github_health = await auth_svc.check_github_api_health()
            services["github_api"] = github_health
        except Exception as e:
            services["github_api"] = {"status": "unhealthy", "error": str(e)}

        # Check RAG engine
        try:
            rag_health = await rag.check_rag_health()
            services.update(rag_health)
        except Exception as e:
            services["rag_engine"] = {"status": "unhealthy", "error": str(e)}

        # Determine overall status
        healthy_services = sum(1 for service in services.values()
                             if isinstance(service, dict) and service.get("status") == "healthy")
        total_services = len(services)

        if healthy_services == total_services:
            overall_status = "healthy"
        elif healthy_services > total_services // 2:
            overall_status = "degraded"
        else:
            overall_status = "unhealthy"

        return HealthResponse(
            status=overall_status,
            services=services,
            version=API_VERSION
        )

    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            status="error",
            services={"error": str(e)},
            version=API_VERSION
        )


@app.get("/stats", response_model=dict)
async def get_stats(
    tracker: UsageTracker = Depends(get_usage_tracker),
    rag: LegalRAGEngine = Depends(get_rag_engine)
):
    """Get system statistics (for monitoring)"""
    try:
        usage_stats = tracker.get_usage_stats()
        rag_stats = rag.get_usage_stats()

        return {
            "usage": usage_stats,
            "rag": rag_stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get statistics"
        )


@app.get("/stats/routing", response_model=dict)
async def get_routing_stats():
    """Get LLM routing statistics and provider information"""
    try:
        # Import here to avoid circular imports
        from .ai.llm_providers import LLMProviderManager

        provider_manager = LLMProviderManager()

        return {
            "providers": provider_manager.get_all_providers_info(),
            "routing_config": {
                "message_threshold": ROUTING_MESSAGE_THRESHOLD,
                "token_threshold": ROUTING_TOKEN_THRESHOLD,
                "max_query_tokens": MAX_QUERY_TOKENS,
                "max_conversation_messages": MAX_CONVERSATION_MESSAGES
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Routing stats error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get routing statistics"
        )


@app.get("/stats/conversations", response_model=dict)
async def get_conversation_stats(
    conv_manager: ConversationManager = Depends(get_conversation_manager)
):
    """Get conversation statistics for monitoring"""
    try:
        # This would need to be implemented to get system-wide conversation stats
        # For now, return basic configuration info
        return {
            "max_messages_per_conversation": conv_manager.max_messages,
            "conversation_health_thresholds": {
                "warning_percentage": 80,
                "critical_percentage": 100
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Conversation stats error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get conversation statistics"
        )


@app.get("/health/detailed", response_model=dict)
async def get_detailed_health(
    rag: LegalRAGEngine = Depends(get_rag_engine),
    tracker: UsageTracker = Depends(get_usage_tracker),
    conv_manager: ConversationManager = Depends(get_conversation_manager)
):
    """Get detailed health information including new components"""
    try:
        from .ai.llm_providers import LLMProviderManager

        provider_manager = LLMProviderManager()

        # Check provider availability
        provider_health = {}
        for provider in LLMProvider:
            config = provider_manager.providers[provider]
            provider_health[provider.value] = {
                "has_default_key": bool(config.default_key),
                "model": config.model,
                "daily_limit": config.daily_limit
            }

        return {
            "status": "healthy",
            "components": {
                "rag_engine": "healthy" if rag else "unavailable",
                "usage_tracker": "healthy" if tracker else "unavailable",
                "conversation_manager": "healthy" if conv_manager else "unavailable",
                "llm_providers": provider_health
            },
            "routing_system": {
                "enabled": True,
                "providers_available": len(provider_health),
                "fallback_configured": bool(provider_manager.providers[LLMProvider.GROQ].default_key)
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Detailed health check error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


# ============================================================================
# Production Application - All testing endpoints removed
# ============================================================================


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=LOG_LEVEL.lower()
    )
