"""
Configuration settings for HaqooqAI Backend
"""
import os
from pathlib import Path
from typing import List

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
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/HaqooqAI/callback")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Usage Limits
USAGE_LIMIT_DEFAULT = int(os.getenv("USAGE_LIMIT_DEFAULT", "5"))
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", "1000"))

# Groq API Configuration
DEFAULT_GROQ_KEY = os.getenv("DEFAULT_GROQ_KEY", "")
GROQ_API_BASE = "https://api.groq.com/openai/v1"
GROQ_MODEL = "qwen/qwen3-32b"

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
    "https://arycloud.github.io",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

# API Configuration
API_TITLE = "HaqooqAI AI Service"
API_VERSION = "2.0.0"
API_DESCRIPTION = "Simplified AI service for Pakistani legal information"

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

# Database Schema Validation
REQUIRED_SUPABASE_TABLES = [USERS_TABLE, USAGE_TABLE, API_KEYS_TABLE]
