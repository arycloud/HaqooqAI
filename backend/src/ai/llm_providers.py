"""
LLM Provider Management System for HaqooqAI Backend
Handles multiple LLM providers with intelligent routing and fallback logic
"""
import logging
import tiktoken
from typing import Dict, Any, Optional, Tuple, List
from enum import Enum
from dataclasses import dataclass
from langchain_openai import ChatOpenAI
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

from ..config import (
    DEFAULT_GROQ_KEY, DEFAULT_GEMINI_KEY, DEFAULT_OPENAI_KEY,
    GROQ_API_BASE, GROQ_MODEL, GEMINI_MODEL, OPENAI_MODEL,
    ROUTING_MESSAGE_THRESHOLD, ROUTING_TOKEN_THRESHOLD, MAX_QUERY_TOKENS,
    DEFAULT_GROQ_DAILY_LIMIT, DEFAULT_GEMINI_DAILY_LIMIT, DEFAULT_OPENAI_DAILY_LIMIT
)

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    """Supported LLM providers"""
    GROQ = "groq"
    GEMINI = "gemini"
    OPENAI = "openai"


@dataclass
class ProviderConfig:
    """Configuration for an LLM provider"""
    name: str
    api_base: str
    model: str
    default_key: str
    daily_limit: int
    supports_function_calling: bool = True
    max_tokens: int = 4096
    temperature: float = 0.1


@dataclass
class RoutingDecision:
    """Result of LLM routing decision"""
    provider: LLMProvider
    reason: str
    message_count: int
    query_tokens: int
    using_user_key: bool
    estimated_cost: str


class LLMProviderManager:
    """Manages multiple LLM providers with intelligent routing"""
    
    def __init__(self):
        """Initialize the provider manager"""
        self.encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")  # Standard tokenizer
        
        # Provider configurations
        self.providers = {
            LLMProvider.GROQ: ProviderConfig(
                name="Groq",
                api_base=GROQ_API_BASE,
                model=GROQ_MODEL,
                default_key=DEFAULT_GROQ_KEY,
                daily_limit=DEFAULT_GROQ_DAILY_LIMIT,
                supports_function_calling=True,
                max_tokens=8192,
                temperature=0.1
            ),
            LLMProvider.GEMINI: ProviderConfig(
                name="Gemini",
                api_base="",  # Gemini uses different client
                model=GEMINI_MODEL,
                default_key=DEFAULT_GEMINI_KEY,
                daily_limit=DEFAULT_GEMINI_DAILY_LIMIT,
                supports_function_calling=True,
                max_tokens=1000000,  # Gemini 2.0 Flash has large context
                temperature=0.1
            ),
            LLMProvider.OPENAI: ProviderConfig(
                name="OpenAI",
                api_base="https://api.openai.com/v1",
                model=OPENAI_MODEL,
                default_key=DEFAULT_OPENAI_KEY,
                daily_limit=DEFAULT_OPENAI_DAILY_LIMIT,
                supports_function_calling=True,
                max_tokens=16384,
                temperature=0.1
            )
        }
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken"""
        try:
            return len(self.encoding.encode(text))
        except Exception as e:
            logger.warning(f"Token counting failed: {e}, using character approximation")
            return len(text) // 4  # Rough approximation: 4 chars per token
    
    def validate_query_length(self, query: str) -> Tuple[bool, int, str]:
        """
        Validate query length against token limits
        
        Returns:
            (is_valid, token_count, error_message)
        """
        token_count = self.count_tokens(query)
        
        if token_count > MAX_QUERY_TOKENS:
            return False, token_count, f"Query too long ({token_count} tokens). Maximum allowed: {MAX_QUERY_TOKENS} tokens. Please shorten your query."
        
        return True, token_count, ""
    
    def determine_provider(
        self,
        query: str,
        message_count: int,
        user_groq_key: Optional[str] = None,
        user_gemini_key: Optional[str] = None,
        user_openai_key: Optional[str] = None
    ) -> RoutingDecision:
        """
        Determine which LLM provider to use based on routing logic
        
        Routing Logic:
        1. If user provides their own key, use that provider exclusively
        2. If conversation has >10 messages OR query >2000 tokens, use Gemini
        3. Otherwise, use Groq (cheaper and faster)
        """
        query_tokens = self.count_tokens(query)
        
        # BYOK (Bring Your Own Key) - User preference override
        if user_openai_key:
            return RoutingDecision(
                provider=LLMProvider.OPENAI,
                reason="User provided OpenAI API key",
                message_count=message_count,
                query_tokens=query_tokens,
                using_user_key=True,
                estimated_cost="User's account"
            )
        
        if user_gemini_key:
            return RoutingDecision(
                provider=LLMProvider.GEMINI,
                reason="User provided Gemini API key",
                message_count=message_count,
                query_tokens=query_tokens,
                using_user_key=True,
                estimated_cost="User's account"
            )
        
        if user_groq_key:
            return RoutingDecision(
                provider=LLMProvider.GROQ,
                reason="User provided Groq API key",
                message_count=message_count,
                query_tokens=query_tokens,
                using_user_key=True,
                estimated_cost="User's account"
            )
        
        # Default routing logic using system keys
        if message_count > ROUTING_MESSAGE_THRESHOLD:
            return RoutingDecision(
                provider=LLMProvider.GEMINI,
                reason=f"Conversation has {message_count} messages (>{ROUTING_MESSAGE_THRESHOLD})",
                message_count=message_count,
                query_tokens=query_tokens,
                using_user_key=False,
                estimated_cost="System quota"
            )
        
        if query_tokens > ROUTING_TOKEN_THRESHOLD:
            return RoutingDecision(
                provider=LLMProvider.GEMINI,
                reason=f"Query has {query_tokens} tokens (>{ROUTING_TOKEN_THRESHOLD})",
                message_count=message_count,
                query_tokens=query_tokens,
                using_user_key=False,
                estimated_cost="System quota"
            )
        
        # Default to Groq for simple queries
        return RoutingDecision(
            provider=LLMProvider.GROQ,
            reason=f"Simple query: {message_count} messages, {query_tokens} tokens",
            message_count=message_count,
            query_tokens=query_tokens,
            using_user_key=False,
            estimated_cost="System quota"
        )
    
    def create_llm_client(
        self,
        provider: LLMProvider,
        api_key: Optional[str] = None
    ) -> Any:
        """Create LLM client for the specified provider"""
        config = self.providers[provider]
        effective_key = api_key or config.default_key

        if not effective_key:
            raise ValueError(f"No API key available for {config.name}")

        try:
            if provider == LLMProvider.GROQ:
                return ChatOpenAI(
                    api_key=effective_key,
                    base_url=config.api_base,
                    model=config.model,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
            
            elif provider == LLMProvider.GEMINI:
                if ChatGoogleGenerativeAI is None:
                    raise ValueError("langchain-google-genai not installed. Install with: pip install langchain-google-genai")
                return ChatGoogleGenerativeAI(
                    google_api_key=effective_key,
                    model=config.model,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
            
            elif provider == LLMProvider.OPENAI:
                return ChatOpenAI(
                    api_key=effective_key,
                    base_url=config.api_base,
                    model=config.model,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens
                )
            
            else:
                raise ValueError(f"Unsupported provider: {provider}")
                
        except Exception as e:
            logger.error(f"Failed to create {config.name} client: {e}")
            raise
    
    def get_provider_info(self, provider: LLMProvider) -> Dict[str, Any]:
        """Get information about a provider"""
        config = self.providers[provider]
        return {
            "name": config.name,
            "model": config.model,
            "daily_limit": config.daily_limit,
            "max_tokens": config.max_tokens,
            "has_default_key": bool(config.default_key)
        }
    
    def get_all_providers_info(self) -> Dict[str, Any]:
        """Get information about all providers"""
        return {
            provider.value: self.get_provider_info(provider)
            for provider in LLMProvider
        }
