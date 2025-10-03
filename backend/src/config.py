"""
Configuration settings for HaqooqAI Backend
"""
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Production mode - all testing configurations removed for production deployment

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
CHROMA_DB_DIR = DATA_DIR / "chroma_db"
USAGE_FILE = DATA_DIR / "usage.json"

# Ensure data directories exist
DATA_DIR.mkdir(exist_ok=True)
CHROMA_DB_DIR.mkdir(exist_ok=True)

# GitHub OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Usage Limits
USAGE_LIMIT_DEFAULT = int(os.getenv("USAGE_LIMIT_DEFAULT", "5"))
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", "1000"))
MAX_CONTEXT_MESSAGES=int(os.getenv("MAX_CONTEXT_MESSAGES", 10))  # Sliding window size (N)
MAX_CONTEXT_TOKENS=int(os.getenv("MAX_CONTEXT_MESSAGES", 6000))  # Max tokens for history

# LLM Provider Configuration
DEFAULT_GROQ_KEY = os.getenv("DEFAULT_GROQ_KEY", "")
DEFAULT_GEMINI_KEY = os.getenv("DEFAULT_GEMINI_KEY", "")
# OpenAI is BYOK-only (no system default key)
DEFAULT_OPENAI_KEY = os.getenv("DEFAULT_OPENAI_KEY", "")  # Will be empty in production

# Web Search API Keys
EXA_API_KEY = os.getenv("EXA_API_KEY", "")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "")

# Groq Configuration
GROQ_API_BASE = "https://api.groq.com/openai/v1"
GROQ_MODEL = "qwen/qwen3-32b"

# Gemini Configuration
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
GEMINI_MODEL = "gemini-2.0-flash-exp"

# OpenAI Configuration
OPENAI_API_BASE = "https://api.openai.com/v1"
OPENAI_MODEL = "gpt-4o-mini"

# Multi-LLM Routing Configuration
ROUTING_MESSAGE_THRESHOLD = int(os.getenv("ROUTING_MESSAGE_THRESHOLD", "10"))  # Switch to Gemini after 10 messages
ROUTING_TOKEN_THRESHOLD = int(os.getenv("ROUTING_TOKEN_THRESHOLD", "2000"))    # Switch to Gemini after 2000 tokens
MAX_QUERY_TOKENS = int(os.getenv("MAX_QUERY_TOKENS", "4000"))                 # Maximum query length in tokens
MAX_CONVERSATION_MESSAGES = int(os.getenv("MAX_CONVERSATION_MESSAGES", "50"))  # Maximum messages per conversation

# Tiered Daily Query Limits (when using system default keys)
DEFAULT_GROQ_DAILY_LIMIT = int(os.getenv("DEFAULT_GROQ_DAILY_LIMIT", "5"))
DEFAULT_GEMINI_DAILY_LIMIT = int(os.getenv("DEFAULT_GEMINI_DAILY_LIMIT", "5"))
# OpenAI is BYOK-only (no system daily limit)
DEFAULT_OPENAI_DAILY_LIMIT = int(os.getenv("DEFAULT_OPENAI_DAILY_LIMIT", "0"))  # 0 = disabled

# ChromaDB Configuration
VECTOR_DB_DIR = str(CHROMA_DB_DIR)
COLLECTION_NAME = "pakistan_laws"
EMBEDDING_MODEL_NAME = "BAAI/bge-large-en-v1.5"

# Data file paths (for your existing processed data)
SECTIONED_DATA_PATH = DATA_DIR / "pakistan_laws_sectioned.csv"
SEMANTIC_SECTIONS_PATH = DATA_DIR / "pakistan_laws_semantic_sections.csv"
PROCESSED_CHUNKS_PATH = DATA_DIR / "pakistan_laws_chunks.csv"
EMBEDDED_CHUNKS_PATH = DATA_DIR / "pakistan_laws_chunks_with_embeddings.csv"

# CORS Configuration
ALLOWED_ORIGINS: List[str] = [
    "https://haqooqai.com",
    "http://localhost:8000",
    "http://localhost:80001",

    # Mobile app support
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "https://localhost",
    # Flutter mobile app custom schemes
    "haqooqai://",
    "haqooqai://auth",
    # Allow any localhost port for development
    "http://localhost:*",
    "https://localhost:*"
]

# Additional CORS settings for mobile support
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS = ["*"]

# API Configuration
API_TITLE = "HaqooqAI AI Backend"
API_VERSION = "2.1.0"
API_DESCRIPTION = "Backend AI service for Pakistani legal information"

# Health Check URLs
GITHUB_API_URL = "https://api.github.com"
SEARXNG_HEALTH_ENDPOINTS = [
    "https://search.bus-hit.me",
    "https://searx.be",
    "https://search.sapti.me"
]

# Rate Limiting
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Database Table Names
USERS_TABLE = "users"
USAGE_TABLE = "usage"
API_KEYS_TABLE = "api_keys"
CONVERSATION_TABLE = "conversations"
MESSAGES_TABLE = "messages"

# Database Schema Validation
REQUIRED_SUPABASE_TABLES = [USERS_TABLE, USAGE_TABLE, API_KEYS_TABLE,
                            CONVERSATION_TABLE, MESSAGES_TABLE ]
FRONTEND_PRUDCTION_URL = os.getenv("FRONTEND_PRODUCTION_URL", "https://haqooqai.com/")