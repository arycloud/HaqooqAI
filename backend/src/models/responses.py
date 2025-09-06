"""
Response models for HaqooqAI Backend API
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """User profile information from GitHub"""
    github_id: int = Field(..., description="GitHub user ID")
    username: str = Field(..., description="GitHub username")
    email: Optional[str] = Field(None, description="User's email address")


class QuotaInfo(BaseModel):
    """User quota information"""
    remaining: int = Field(..., description="Remaining queries in current period")
    limit: int = Field(..., description="Total query limit per period")
    reset_at: datetime = Field(..., description="When the quota resets")
    has_api_key: bool = Field(False, description="Whether user has provided their own API key")
    unlimited: bool = Field(False, description="Whether user has unlimited access")


class ProviderStatus(BaseModel):
    """Status information for a specific LLM provider"""
    provider: str = Field(..., description="Provider name (groq, gemini, openai)")
    configured: bool = Field(..., description="Whether user has configured an API key")
    valid: bool = Field(..., description="Whether the configured key is valid")
    last_validated: Optional[datetime] = Field(None, description="When the key was last validated")


class ApiKeyResponse(BaseModel):
    """Response for API key operations (unified model for all providers)"""
    status: str = Field(..., description="Operation status (success, error)")
    message: str = Field(..., description="Human-readable message")
    provider: Optional[str] = Field(default=None, description="Provider name (groq, gemini, openai)")
    configured: Optional[bool] = Field(default=None, description="Whether the key is now configured")
    has_unlimited: Optional[bool] = Field(default=None, description="Whether user now has unlimited access")


class ApiKeyListResponse(BaseModel):
    """Response for listing user's API key providers"""
    status: str = Field(..., description="Operation status")
    providers: List[ProviderStatus] = Field(..., description="List of provider statuses")
    total_configured: int = Field(..., description="Total number of configured providers")


class SourceInfo(BaseModel):
    """Information about a source used in the response"""
    type: str = Field(..., description="Type of source: 'legal_doc' or 'web_search'")
    title: str = Field(..., description="Title of the source")
    section: Optional[str] = Field(None, description="Section reference for legal documents")
    reference: Optional[str] = Field(None, description="Document reference or identifier")
    url: Optional[str] = Field(None, description="URL for web sources")
    relevance_score: Optional[float] = Field(None, description="Relevance score (0-1)")


class AuthResponse(BaseModel):
    """Response for authentication validation"""
    status: str = Field(..., description="Response status")
    user: UserProfile = Field(..., description="User profile information")
    quota: QuotaInfo = Field(..., description="User quota information")
    message: Optional[str] = Field(None, description="Additional message")


class TokenExchangeResponse(BaseModel):
    """Response for token exchange"""
    status: str = Field(..., description="Response status")
    access_token: str = Field(..., description="GitHub access token")
    user: UserProfile = Field(..., description="User profile information")
    quota: QuotaInfo = Field(..., description="User quota information")
    message: Optional[str] = Field(None, description="Additional message")


class RoutingInfo(BaseModel):
    """Information about LLM provider routing decision"""
    provider: str = Field(..., description="Selected LLM provider")
    reason: str = Field(..., description="Reason for provider selection")
    message_count: int = Field(..., description="Number of messages in conversation")
    query_tokens: int = Field(..., description="Number of tokens in query")
    using_user_key: bool = Field(..., description="Whether user's API key was used")
    estimated_cost: str = Field(..., description="Estimated cost information")


class AIResponse(BaseModel):
    """Response for AI query processing"""
    status: str = Field(..., description="Response status")
    response: str = Field(..., description="AI-generated response")
    sources: List[SourceInfo] = Field(default_factory=list, description="Sources used in the response")
    disclaimer: Optional[str] = Field(None, description="Disclaimer message")
    usage: QuotaInfo = Field(..., description="Updated quota information")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    query_id: Optional[str] = Field(None, description="Unique query identifier")
    routing_info: Optional[RoutingInfo] = Field(None, description="LLM routing information")


class QuotaResponse(BaseModel):
    """Response for quota information"""
    remaining: int = Field(..., description="Remaining queries")
    limit: int = Field(..., description="Query limit")
    reset_at: datetime = Field(..., description="Reset time")
    has_api_key: bool = Field(..., description="Has API key")
    unlimited: bool = Field(..., description="Unlimited access")


class HealthResponse(BaseModel):
    """Response for health check"""
    status: str = Field(..., description="Overall health status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Health check timestamp")
    services: Dict[str, Any] = Field(default_factory=dict, description="Individual service health")
    version: str = Field(..., description="API version")


class ConversationResponse(BaseModel):
    """Response model for conversation data"""
    id: str = Field(..., description="Conversation UUID")
    user_id: int = Field(..., description="User's ID")
    title: str = Field(..., description="Conversation title")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class MessageResponse(BaseModel):
    """Response model for message data"""
    id: str = Field(..., description="Message UUID")
    conversation_id: str = Field(..., description="Conversation UUID")
    role: str = Field(..., description="Message role")
    content: str = Field(..., description="Message content")
    sources: Optional[List[SourceInfo]] = Field(None, description="Message sources")
    created_at: datetime = Field(..., description="Creation timestamp")


class ConversationListResponse(BaseModel):
    """Response model for conversation list"""
    conversations: List[ConversationResponse] = Field(..., description="List of conversations")
    total: int = Field(..., description="Total number of conversations")


class ConversationWithMessagesResponse(BaseModel):
    """Response model for conversation with messages"""
    conversation: ConversationResponse = Field(..., description="Conversation data")
    messages: List[MessageResponse] = Field(..., description="List of messages")


class HealthResponse(BaseModel):
    """Response for health check endpoint"""
    status: str = Field(..., description="Overall system health status")
    services: Dict[str, Any] = Field(..., description="Individual service health status")
    version: str = Field(..., description="API version")


class ErrorResponse(BaseModel):
    """Standard error response"""
    status: str = Field("error", description="Response status")
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
