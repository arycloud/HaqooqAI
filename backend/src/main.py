"""
HaqooqAI Backend - FastAPI Application
Simplified AI service for Pakistani legal information
"""
import logging
import uuid
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv
import httpx
from fastapi import Header

from .database.supabase_client import supabase_client
# import os

# Load environment variables
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.encoders import jsonable_encoder
import uvicorn

from .config import (
    API_TITLE, API_VERSION, API_DESCRIPTION, ALLOWED_ORIGINS,
    LOG_LEVEL, LOG_FORMAT, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI
)
from .models.requests import AuthRequest, DeleteApiKeyRequest, QueryRequest, ApiKeyRequest, ConversationCreateRequest, MessageCreateRequest
from .models.responses import (
    AuthResponse, AIResponse, ApiKeyResponse, QuotaResponse,
    HealthResponse, ErrorResponse, UserProfile, QuotaInfo,
    ConversationResponse, MessageResponse, ConversationListResponse, ConversationWithMessagesResponse
)
from .auth.github_auth import GitHubAuthService
from .quota.usage_tracker import UsageTracker
from .ai.rag_engine import LegalRAGEngine

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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Global instances (initialized on startup)
auth_service: Optional[GitHubAuthService] = None
usage_tracker: Optional[UsageTracker] = None
rag_engine: Optional[LegalRAGEngine] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global auth_service, usage_tracker, rag_engine

    try:
        auth_service = GitHubAuthService()
        usage_tracker = UsageTracker()
        rag_engine = LegalRAGEngine()

        logger.info("All services initialized successfully")

        # Log health status
        if rag_engine:
            health = await rag_engine.check_rag_health()
            logger.info(f"RAG Engine health: {health}")

    except Exception as e:
        logger.error(f"Error during startup: {e}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(
            error="HTTP_ERROR",
            message=exc.detail,
            details={"status_code": exc.status_code}
        )
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=jsonable_encoder(
            error="INTERNAL_ERROR",
            message="An internal server error occurred",
            details= str(exc)
        ).dict()
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


# API Routes

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "status": "operational",
        "endpoints": {
            "auth": "/auth/validate",
            "query": "/ask/",
            "api_key": "/user/groq-key",
            "quota": "/user/quota/{user_id}",
            "health": "/health",
            "docs": "/docs"
        }
    }


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


@app.post("/ask/", response_model=AIResponse)
async def process_query(
    request: QueryRequest,
    rag: LegalRAGEngine = Depends(get_rag_engine),
    tracker: UsageTracker = Depends(get_usage_tracker)
):
    """Process AI query and return response with sources"""
    try:
        # Check quota if no API key provided
        if not request.groq_api_key:
            quota = tracker.check_quota(request.user_id)
            if quota.remaining <= 0:
                raise HTTPException(
                    status_code=429,
                    detail="Query quota exceeded. Please wait for reset or provide your own API key."
                )

            # Increment usage
            tracker.increment_usage(request.user_id)

        # Process query through RAG engine
        result = await rag.process_query(request.query, request.groq_api_key)

        # Get updated quota
        updated_quota = tracker.check_quota(request.user_id)

        # Generate query ID for tracking
        query_id = str(uuid.uuid4())

        logger.info(f"Processed query for user {request.user_id}, query_id: {query_id}")

        return AIResponse(
            status="success",
            response=result["response"],
            sources=result.get("sources", []),
            usage=updated_quota,
            processing_time=result.get("processing_time"),
            query_id=query_id
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI service error"
        )


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


# GitHub OAuth Endpoints

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


@app.get("/HaqooqAI/callback")
async def github_callback(code: str = None, error: str = None):
    """Handle GitHub OAuth callback and return access token"""
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

    try:
        # Exchange code for access token
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

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to get access token from GitHub"
                )

            # Redirect to frontend with the access token
            FRONTEND_URL="https://arycloud.github.io/HaqooqAI"
            return RedirectResponse(
                url=f"{FRONTEND_URL}?access_token={access_token}",
                status_code=302
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        raise HTTPException(
            status_code=500,
            detail="OAuth callback processing failed"
        )


# Conversation Management Endpoints

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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=LOG_LEVEL.lower()
    )
