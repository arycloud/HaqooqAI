"""
Request models for HaqooqAI Backend API
"""
from typing import Optional
from pydantic import BaseModel, Field, validator


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
    query: str = Field(..., min_length=1, max_length=1000, description="Legal query to process")
    user_id: int = Field(..., description="GitHub user ID")
    groq_api_key: Optional[str] = Field(None, description="Optional user's Groq API key")

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


class ApiKeyRequest(BaseModel):
    """Request model for saving user's Groq API key"""
    user_id: int = Field(..., description="GitHub user ID")
    groq_api_key: str = Field(..., description="User's Groq API key")
    # github_token: str = Field(..., description="GitHub token for verification")

    @validator('groq_api_key')
    def validate_groq_key(cls, v):
        if not v.startswith('gsk_'):
            raise ValueError('Invalid Groq API key format')
        return v
    
class DeleteApiKeyRequest(BaseModel):
    user_id: int
    github_token: str

    # @validator('github_token')
    # def validate_github_token(cls, v):
    #     # Accept both Personal Access Tokens (ghp_, github_pat_) and OAuth tokens (gho_)
    #     if not v or not v.startswith(('ghp_', 'github_pat_', 'gho_')):
    #         raise ValueError('Invalid GitHub token format')
    #     return v


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


class HealthCheckRequest(BaseModel):
    """Request model for health check (optional parameters)"""
    detailed: bool = Field(False, description="Whether to return detailed health information")
