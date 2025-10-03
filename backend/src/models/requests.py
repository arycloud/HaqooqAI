"""
Request models for HaqooqAI Backend API
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field, validator
from datetime import datetime


class AuthRequest(BaseModel):
    """Request model for GitHub token validation"""
    github_token: str = Field(..., description="GitHub personal access token")

    @validator('github_token')
    def validate_github_token(cls, v):
        # Accept both Personal Access Tokens (ghp_, github_pat_) and OAuth tokens (gho_)
        if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
            raise ValueError('Invalid GitHub token format')
        return v


class QueryRequest(BaseModel):
    """Request model for AI query processing"""
    query: str = Field(..., min_length=1, max_length=100000, description="Legal query to process")  # Increased to allow token-based validation
    user_id: int = Field(..., description="GitHub user ID")
    groq_api_key: Optional[str] = Field(None, description="Optional user's Groq API key")
    gemini_api_key: Optional[str] = Field(None, description="Optional user's Gemini API key")
    openai_api_key: Optional[str] = Field(None, description="Optional user's OpenAI API key")
    conversation_id: str

    @validator('query')
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()

    @validator('groq_api_key')
    def validate_groq_key(cls, v):
        if v and not v.startswith('gsk_'):
            raise ValueError('Invalid Groq API key format')
        return v

    @validator('gemini_api_key')
    def validate_gemini_key(cls, v):
        if v and len(v) < 10:  # Basic validation for Gemini keys
            raise ValueError('Invalid Gemini API key format')
        return v

    @validator('openai_api_key')
    def validate_openai_key(cls, v):
        if v and not v.startswith('sk-'):
            raise ValueError('Invalid OpenAI API key format')
        return v


class ApiKeyRequest(BaseModel):
    """Legacy request model for saving user's API keys (backward compatibility)"""
    user_id: int = Field(..., description="GitHub user ID")
    provider: str = Field(..., description="LLM provider: 'groq', 'gemini', or 'openai'")
    api_key: str = Field(..., description="User's API key for the specified provider")

    @validator('provider')
    def validate_provider(cls, v):
        if v not in ['groq', 'gemini', 'openai']:
            raise ValueError('Provider must be one of: groq, gemini, openai')
        return v

    @validator('api_key')
    def validate_api_key(cls, v, values):
        provider = values.get('provider')
        if provider == 'groq' and not v.startswith('gsk_'):
            raise ValueError('Invalid Groq API key format (should start with gsk_)')
        elif provider == 'openai' and not v.startswith('sk-'):
            raise ValueError('Invalid OpenAI API key format (should start with sk-)')
        elif provider == 'gemini' and len(v) < 10:
            raise ValueError('Invalid Gemini API key format')
        return v


class ApiKeyCreateRequest(BaseModel):
    """Enhanced request model for creating/updating multi-provider API keys"""
    provider: Literal["groq", "gemini", "openai"] = Field(..., description="LLM provider")
    api_key: str = Field(..., min_length=20, max_length=200, description="Provider API key")
    github_token: str = Field(..., description="GitHub token for authentication")
    user_id: int = Field(..., description="User's GitHub ID")

    @validator('api_key')
    def validate_api_key(cls, v, values):
        provider = values.get('provider')

        if provider == 'groq':
            if not v.startswith('gsk_'):
                raise ValueError('Invalid Groq API key format (must start with gsk_)')
            if len(v) < 20:
                raise ValueError('Groq API key too short (minimum 20 characters)')
        elif provider == 'openai':
            if not v.startswith('sk-'):
                raise ValueError('Invalid OpenAI API key format (must start with sk-)')
            if len(v) < 20:
                raise ValueError('OpenAI API key too short (minimum 20 characters)')
        elif provider == 'gemini':
            if len(v) < 20:
                raise ValueError('Gemini API key too short (minimum 20 characters)')
            # Gemini keys don't have a specific prefix requirement

        return v

    @validator('github_token')
    def validate_github_token(cls, v):
        if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
            raise ValueError('Invalid GitHub token format')
        return v
    
class DeleteApiKeyRequest(BaseModel):
    """Legacy request model for deleting user's API key (backward compatibility)"""
    user_id: int = Field(..., description="GitHub user ID")
    provider: str = Field(..., description="LLM provider: 'groq', 'gemini', or 'openai'")
    github_token: str = Field(..., description="GitHub token for verification")

    @validator('provider')
    def validate_provider(cls, v):
        if v not in ['groq', 'gemini', 'openai']:
            raise ValueError('Provider must be one of: groq, gemini, openai')
        return v

    @validator('github_token')
    def validate_github_token(cls, v):
        if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
            raise ValueError('Invalid GitHub token format')
        return v


class ApiKeyDeleteRequest(BaseModel):
    """Enhanced request model for deleting user's API key"""
    github_token: str = Field(..., description="GitHub token for authentication")
    user_id: int = Field(..., description="User's GitHub ID")

    @validator('github_token')
    def validate_github_token(cls, v):
        if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
            raise ValueError('Invalid GitHub token format')
        return v


class ConversationCreateRequest(BaseModel):
    """Request model for creating a new conversation"""
    title: str = Field(..., min_length=1, max_length=255, description="Conversation title")
    user_id: int = Field(..., description="User's GitHub ID")
    github_token: str = Field(..., description="GitHub token for verification")

    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('github_token')
    def validate_github_token(cls, v):
        if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
            raise ValueError('Invalid GitHub token format')
        return v


class MessageCreateRequest(BaseModel):
    """Request model for creating a new message"""
    conversation_id: str = Field(..., description="Conversation UUID")
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., min_length=1, description="Message content")
    sources: Optional[list] = Field(None, description="Optional sources for assistant messages")
    show_disclaimer: bool = Field(False, description="Whether to show the disclaimer")
    user_id: int = Field(..., description="User's GitHub ID")
    github_token: str = Field(..., description="GitHub token for verification")

    @validator('role')
    def validate_role(cls, v):
        if v not in ['user', 'assistant']:
            raise ValueError('Role must be either "user" or "assistant"')
        return v

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()

    @validator('github_token')
    def validate_github_token(cls, v):
        if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
            raise ValueError('Invalid GitHub token format')
        return v


class TokenExchangeRequest(BaseModel):
    """Request model for exchanging authorization code for access token"""
    code: str = Field(..., description="Authorization code from GitHub OAuth")
    state: Optional[str] = Field(None, description="State parameter for security")

    @validator('code')
    def validate_code(cls, v):
        if not v or not v.strip():
            raise ValueError('Authorization code is required')
        return v.strip()


class HealthCheckRequest(BaseModel):
    """Request model for health check (optional parameters)"""
    detailed: bool = Field(False, description="Whether to return detailed health information")
