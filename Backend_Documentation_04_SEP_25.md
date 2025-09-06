# HaqooqAI Backend Documentation

**Generated on:** September 4, 2025  
**Version:** 2.0.0  
**Title:** HaqooqAI AI Service - Simplified AI service for Pakistani legal information

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Configuration](#configuration)
8. [Setup and Installation](#setup-and-installation)
9. [Features](#features)
10. [Security](#security)
11. [Monitoring and Health](#monitoring-and-health)
12. [Testing](#testing)
13. [Deployment](#deployment)

---

## Overview

HaqooqAI Backend is a sophisticated FastAPI-based service that provides AI-powered legal assistance specifically for Pakistani laws and legal affairs. The system integrates multiple components including GitHub OAuth authentication, Supabase database, ChromaDB vector storage, SearxNG web search, and a specialized legal AI agent.

### Key Technologies
- **Framework:** FastAPI 
- **Database:** Supabase (PostgreSQL)
- **Vector Database:** ChromaDB
- **AI/LLM:** Groq API with Qwen models
- **Search:** SearxNG instances
- **Authentication:** GitHub OAuth
- **Embeddings:** SentenceTransformers (BAAI/bge-large-en-v1.5)

---

## Architecture

The backend follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                     │
├─────────────────────────────────────────────────────────────┤
│ Authentication │ AI Processing │ User Management │ Health   │
│ (GitHub OAuth) │ (RAG Engine)  │ (Quota/API Keys)│ Monitor  │
├─────────────────────────────────────────────────────────────┤
│              Core Services & Components                     │
│ • LegalAssistantAgent  • ContextManager                    │
│ • SearxNG Client       • Usage Tracker                     │
│ • Supabase Client      • Health Monitor                    │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                              │
│ • Supabase (PostgreSQL) • ChromaDB • Local JSON          │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow
1. **User Authentication:** GitHub OAuth → Supabase user storage
2. **Query Processing:** User query → Context Manager → RAG Engine → AI Agent
3. **Information Retrieval:** Local ChromaDB search + SearxNG web search
4. **Response Generation:** LLM processing → Structured response with sources
5. **Quota Management:** Usage tracking → Supabase storage

---

## Directory Structure

```
backend/
├── src/                           # Source code
│   ├── ai/                        # AI components
│   │   ├── __init__.py
│   │   ├── agent.py               # LegalAssistantAgent (core AI logic)
│   │   ├── rag_engine.py          # RAG processing and orchestration
│   │   ├── searxng_client.py      # SearxNG web search client
│   │   └── tools.py               # Search tools for agent
│   ├── auth/                      # Authentication services
│   │   ├── __init__.py
│   │   └── github_auth.py         # GitHub OAuth validation
│   ├── database/                  # Database clients
│   │   ├── __init__.py
│   │   └── supabase_client.py     # Supabase database operations
│   ├── models/                    # Pydantic data models
│   │   ├── __init__.py
│   │   ├── requests.py            # Request models
│   │   └── responses.py           # Response models
│   ├── quota/                     # Usage tracking
│   │   ├── __init__.py
│   │   └── usage_tracker.py       # Quota management system
│   ├── services/                  # Additional services
│   │   └── context_manager.py     # Conversation context management
│   ├── __init__.py
│   ├── config.py                  # Configuration settings
│   ├── health_monitor.py          # System health monitoring
│   └── main.py                    # FastAPI application entry point
├── data/                          # Data storage
│   ├── chroma_db/                 # ChromaDB vector database
│   ├── usage.json                 # Local quota tracking fallback
│   └── README.md                  # Data directory documentation
├── Dockerfile                     # Docker container configuration
├── README.md                      # Project documentation
├── database_schema.sql            # Supabase database schema
├── requirements.txt               # Python dependencies
├── setup.py                       # Setup and initialization script
├── test_implementation.py         # Implementation testing script
└── test_supabase.py              # Supabase connection testing
```

---

## Core Components

### 1. FastAPI Application (`main.py`)

The main application file contains:
- **FastAPI App Setup:** CORS middleware, exception handlers
- **Service Initialization:** Global service instances with startup events
- **OAuth State Management:** In-memory state tracking for mobile/web flows
- **Route Definitions:** All API endpoints with comprehensive error handling

**Key Features:**
- Supports both web and mobile OAuth flows
- Comprehensive exception handling with safe frontend error messages
- Automatic service dependency injection
- Background conversation persistence

### 2. AI Components

#### LegalAssistantAgent (`ai/agent.py`)
The core AI component that processes legal queries with Pakistani law specialization.

**Key Features:**
- **Scope Checking:** Validates Pakistan-relevance of queries
- **Search Strategy:** Time-sensitive vs. historical query handling
- **Query Enhancement:** Automatic context addition and site restrictions
- **Context Resolution:** Handles conversation follow-ups intelligently
- **Source Management:** Structured source extraction and formatting

**Tools Available:**
- `legal_document_search`: ChromaDB vector search for local legal documents
- `web_search_tool`: SearxNG-powered web search with failover

#### RAG Engine (`ai/rag_engine.py`)
Orchestrates the Retrieval-Augmented Generation process.

**Features:**
- **Query Processing:** Enhanced preprocessing with time-sensitivity detection
- **Source Enhancement:** Combines local and web sources with relevance scoring
- **Error Handling:** Graceful degradation when services are unavailable
- **Health Monitoring:** Component-level health checks

#### Context Manager (`services/context_manager.py`)
Manages conversation history with semantic follow-up detection.

**Advanced Features:**
- **Semantic Follow-up Detection:** Uses SentenceTransformers for query similarity
- **Automatic Rewriting:** LLM-powered query rewriting for follow-ups
- **Token Management:** Smart truncation and summarization
- **History Optimization:** Sliding window with summarization fallback

### 3. Authentication System (`auth/github_auth.py`)

**GitHub OAuth Integration:**
- Supports both Personal Access Tokens and OAuth tokens
- Token format validation (`ghp_`, `github_pat_`, `gho_` prefixes)
- User profile retrieval and database storage
- Comprehensive error handling for API failures

### 4. Database Layer

#### Supabase Client (`database/supabase_client.py`)
Comprehensive database operations for PostgreSQL via Supabase.

**Capabilities:**
- **User Management:** Create/update user profiles
- **Usage Tracking:** Query counting and quota management
- **API Key Storage:** Encrypted API key storage (production-ready)
- **Conversation Management:** Full CRUD operations for conversations and messages
- **Statistics:** Usage analytics and reporting

#### Database Schema (`database_schema.sql`)
Complete PostgreSQL schema with:
- **Tables:** users, usage, api_keys, conversations, messages
- **Indexes:** Optimized for performance
- **RLS Policies:** Row-level security for data protection
- **Triggers:** Automatic timestamp updates
- **Views:** User statistics aggregation

### 5. Search and Information Retrieval

#### SearxNG Client (`ai/searxng_client.py`)
Production-grade web search with health monitoring and failover.

**Features:**
- **Multi-instance Support:** Multiple SearxNG endpoints with health checks
- **Automatic Failover:** Seamless switching between healthy instances
- **Result Formatting:** Structured search result presentation
- **Health Monitoring:** Continuous instance health tracking

#### Search Tools (`ai/tools.py`)
Enhanced search capabilities with intelligent query processing.

**Components:**
- **QueryProcessor:** Query cleaning, enhancement, and categorization
- **ChromaDB Integration:** Vector similarity search for legal documents
- **Async Web Search:** Non-blocking web search with proper error handling

### 6. Tiered Quota and Usage Management

#### Tiered Usage Tracker (`quota/tiered_usage_tracker.py`)
**Multi-Provider Quota System:**
- **System Default:** 5 queries per day for users without API keys
- **System Groq:** 5 queries per day using system Groq key
- **System Gemini:** 5 queries per day using system Gemini key
- **OpenAI BYOK-Only:** No system quota, requires user's own API key
- **User Keys (BYOK):** Unlimited system quota when using own API keys
- **Automatic Reset:** 24-hour rolling quota windows per provider
- **Statistics:** Provider-specific usage analytics

#### Legacy Usage Tracker (`quota/usage_tracker.py`)
**Original Supabase-based Quota System (maintained for compatibility):**
- **Daily Limits:** Default 5 queries per user per day
- **API Key Support:** Unlimited access for users with valid Groq keys
- **Automatic Reset:** 24-hour rolling quota windows
- **Statistics:** System-wide usage analytics

### 7. Multi-Provider API Key Management

#### API Key Manager (`database/api_key_manager.py`)
**Comprehensive CRUD operations for all LLM providers:**

**Features:**
- **Multi-Provider Support:** Groq, Gemini, and OpenAI API keys
- **AES-256 Encryption:** Secure storage with user-specific salt
- **Provider Validation:** Format validation for each provider type
- **Status Tracking:** Configuration and validation status per provider
- **Integration:** Seamless integration with tiered quota system

**Security Measures:**
- **Encryption at Rest:** All API keys encrypted before database storage
- **User-Specific Salt:** Unique encryption salt per user/provider combination
- **Format Validation:** Strict validation rules for each provider
- **Rate Limiting:** 10 operations per minute per user
- **Authentication:** GitHub token validation for all operations

#### Encryption Utilities (`utils/encryption.py`)
**Production-grade encryption for API key storage:**

**Components:**
- **APIKeyEncryption:** AES-256 encryption with PBKDF2 key derivation
- **APIKeyValidator:** Optional API validation via test calls to providers
- **Master Key Management:** Environment-based encryption key management

**Validation Rules:**
- **Groq:** Keys must start with `gsk_` and be at least 20 characters
- **OpenAI:** Keys must start with `sk-` and follow OpenAI format requirements
- **Gemini:** Minimum 20 characters (no specific prefix required)

#### API Key Management Routes (`routes/api_key_management.py`)
**RESTful endpoints for comprehensive key management:**

**Endpoints:**
- `POST /user/api-keys` - Create/update API keys with encryption
- `GET /user/api-keys` - List all provider statuses (never returns actual keys)
- `DELETE /user/api-keys/{provider}` - Remove specific provider keys
- `GET /user/api-keys/{provider}/status` - Check individual provider status
- Legacy endpoints for backward compatibility

**Integration Features:**
- **Automatic Key Retrieval:** `/ask/` endpoint automatically uses stored keys
- **Priority System:** Request keys override stored keys
- **Quota Bypass:** Stored keys trigger unlimited system quota
- **Provider Selection:** Influences routing decisions in multi-LLM system

---

## API Endpoints

### Authentication Endpoints

#### `POST /auth/validate`
Validates GitHub token and returns user profile with quota information.

**Request:**
```json
{
  "github_token": "ghp_xxxxxxxxxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "github_id": 12345,
    "username": "user123",
    "email": "user@example.com"
  },
  "quota": {
    "remaining": 5,
    "limit": 5,
    "reset_at": "2025-09-05T12:00:00Z",
    "has_api_key": false,
    "unlimited": false
  },
  "message": "Authentication successful"
}
```

#### `POST /auth/exchange`
Exchanges authorization code for access token (mobile apps).

#### `GET /login/github`
Redirects to GitHub OAuth authorization.

#### `POST /login/github/start`
Starts OAuth flow and returns auth URL for mobile apps.

#### `GET /HaqooqAI/callback`
Handles GitHub OAuth callback with mobile/web flow support.

### AI Processing Endpoints

#### `POST /ask/`
Processes AI query and returns response with sources.

**Request:**
```json
{
  "query": "What are the constitutional requirements for amending the Constitution of Pakistan?",
  "user_id": 12345,
  "groq_api_key": "gsk_xxxxxxxxxxxxxxxxxxxx",
  "conversation_id": "uuid-string"
}
```

**Response:**
```json
{
  "status": "success",
  "response": "The Constitution of Pakistan can be amended through...",
  "sources": [
    {
      "type": "legal_doc",
      "title": "Constitution of Pakistan 1973",
      "section": "Article 238-239",
      "reference": "Constitutional Amendment Procedure",
      "relevance_score": 0.95
    }
  ],
  "disclaimer": "This is informational and not a substitute for formal legal advice...",
  "usage": {
    "remaining": 4,
    "limit": 5,
    "reset_at": "2025-09-05T12:00:00Z",
    "has_api_key": false,
    "unlimited": false
  },
  "processing_time": 2.3,
  "query_id": "uuid-string"
}
```

### Multi-Provider API Key Management Endpoints

#### `POST /user/api-keys`
Add or update an API key for a specific provider (Groq, Gemini, OpenAI).

**Request Body:**
```json
{
  "provider": "groq|gemini|openai",
  "api_key": "key_value",
  "github_token": "token",
  "user_id": 12345
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Groq API key stored successfully",
  "provider": "groq",
  "configured": true
}
```

**Features:**
- Upsert operation (update if exists, insert if new)
- AES-256 encryption for secure storage
- Format validation for each provider
- Optional API key validation via test calls
- Rate limiting (10 operations per minute per user)

#### `GET /user/api-keys`
List all configured providers for the authenticated user.

**Query Parameters:**
- `github_token`: GitHub token for authentication
- `user_id`: User's GitHub ID

**Response:**
```json
{
  "status": "success",
  "providers": [
    {
      "provider": "groq",
      "configured": true,
      "valid": true,
      "last_validated": "2025-09-05T12:00:00Z"
    },
    {
      "provider": "gemini",
      "configured": false,
      "valid": false,
      "last_validated": null
    },
    {
      "provider": "openai",
      "configured": true,
      "valid": true,
      "last_validated": "2025-09-05T11:30:00Z"
    }
  ],
  "total_configured": 2
}
```

**Security:** Never returns actual API key values, only provider status.

#### `DELETE /user/api-keys/{provider}`
Remove API key for specific provider.

**Path Parameters:**
- `provider`: Provider name (groq, gemini, openai)

**Request Body:**
```json
{
  "github_token": "token",
  "user_id": 12345
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Groq API key deleted successfully",
  "provider": "groq",
  "configured": false
}
```

#### `GET /user/api-keys/{provider}/status`
Check provider-specific key status.

**Path Parameters:**
- `provider`: Provider name (groq, gemini, openai)

**Query Parameters:**
- `github_token`: GitHub token for authentication
- `user_id`: User's GitHub ID

**Response:**
```json
{
  "provider": "groq",
  "configured": true,
  "valid": true,
  "last_validated": "2025-09-05T12:00:00Z"
}
```

#### Legacy Endpoints (Backward Compatibility)

#### `POST /user/groq-key`
Legacy endpoint for storing Groq API key (redirects to new multi-provider endpoint).

#### `DELETE /user/groq-key`
Legacy endpoint for deleting Groq API key (redirects to new multi-provider endpoint).

#### `GET /user/quota/{user_id}`
Returns current quota information for user.

### Conversation Management Endpoints

#### `GET /conversations`
Lists all conversations for a user.

#### `POST /conversations`
Creates a new conversation.

#### `GET /conversations/{conversation_id}`
Retrieves conversation with all messages.

#### `POST /conversations/{conversation_id}/messages`
Adds a new message to conversation.

#### `PUT /conversations/{conversation_id}`
Updates conversation title.

#### `DELETE /conversations/{conversation_id}`
Deletes conversation and all messages.

### Monitoring Endpoints

#### `GET /health`
Comprehensive system health check.

#### `GET /stats`
System usage statistics.

#### `GET /`
API information and available endpoints.

---

## Database Schema

### Tables

#### `users`
Stores GitHub user profiles.
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `usage`
Tracks user query quotas.
```sql
CREATE TABLE usage (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    query_count INTEGER DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `api_keys`
Stores user API keys (hashed).
```sql
CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    api_key_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `conversations`
Stores user conversations.
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `messages`
Stores conversation messages.
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Configuration

### Environment Variables (`config.py`)

#### Database Configuration
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anon key
- `SUPABASE_SERVICE_KEY`: Supabase service role key

#### GitHub OAuth
- `GITHUB_CLIENT_ID`: GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth app secret
- `GITHUB_REDIRECT_URI`: OAuth callback URL

#### AI/LLM Configuration
- `DEFAULT_GROQ_KEY`: Default Groq API key
- `GROQ_MODEL`: LLM model name (default: "qwen/qwen3-32b")
- `USAGE_LIMIT_DEFAULT`: Default daily query limit (default: 5)
- `MAX_QUERY_LENGTH`: Maximum query length (default: 1000)
- `MAX_CONTEXT_MESSAGES`: Conversation context window (default: 10)

#### Vector Database
- `VECTOR_DB_DIR`: ChromaDB storage directory
- `COLLECTION_NAME`: ChromaDB collection name
- `EMBEDDING_MODEL_NAME`: Sentence transformer model

#### Search Configuration
- `SEARXNG_HEALTH_ENDPOINTS`: List of SearxNG instance URLs

#### CORS and Security
- `ALLOWED_ORIGINS`: Allowed origin URLs for CORS
- `FRONTEND_PRODUCTION_URL`: Production frontend URL

---

## Setup and Installation

### Prerequisites
- Python 3.9+
- PostgreSQL (via Supabase)
- Git

### Installation Steps

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Setup Environment:**
   ```bash
   python setup.py
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Database Setup:**
   - Create Supabase project
   - Run `database_schema.sql` in Supabase SQL editor
   - Configure environment variables

6. **Legal Document Data:**
   - Add Pakistani legal document CSV files to `data/` directory
   - Run data ingestion to populate ChromaDB

7. **Start Application:**
   ```bash
   uvicorn src.main:app --reload
   ```

### Docker Deployment

```bash
docker build -t haqooqai-backend .
docker run -p 7860:7860 haqooqai-backend
```

---

## Features

### AI-Powered Legal Assistant
- **Pakistani Law Specialization:** Focused on Pakistani legal system
- **Intelligent Scope Detection:** Filters non-Pakistan queries
- **Time-Sensitive Processing:** Handles current vs. historical queries
- **Multi-Source Retrieval:** Combines local documents and web search
- **Context-Aware Responses:** Maintains conversation continuity

### Authentication & Security
- **GitHub OAuth Integration:** Secure user authentication
- **Row-Level Security:** Database-level access control
- **API Key Management:** Secure storage of user API keys
- **CORS Configuration:** Proper cross-origin resource sharing

### Quota Management
- **Fair Usage Limits:** 5 queries per user per day (default)
- **Unlimited Access:** Users can provide their own API keys
- **Automatic Reset:** 24-hour rolling windows
- **Usage Analytics:** System-wide usage tracking

### Conversation Management
- **Persistent Conversations:** Full conversation history storage
- **Message Threading:** Proper conversation flow management
- **Semantic Follow-up Detection:** Intelligent context resolution
- **Query Rewriting:** Automatic follow-up query enhancement

### Health Monitoring
- **Comprehensive Health Checks:** All system components
- **Service Health Tracking:** Individual component monitoring
- **Performance Metrics:** Response times and availability
- **Automatic Failover:** Resilient service architecture

---

## Security

### Authentication Security
- **Token Validation:** GitHub token format and validity checks
- **User Verification:** Cross-reference user IDs with tokens
- **Secure Headers:** Proper authorization header handling

### Database Security
- **Row-Level Security (RLS):** Enabled on all tables
- **Service Role Access:** Dedicated service role for backend operations
- **API Key Encryption:** Production-ready key storage (hashed)

### API Security
- **CORS Configuration:** Restricted origins for web security
- **Input Validation:** Pydantic model validation for all inputs
- **Error Handling:** Safe error messages without sensitive information
- **Rate Limiting:** Built-in quota system prevents abuse

### Data Privacy
- **Minimal Data Storage:** Only necessary user information stored
- **No Query Content Storage:** User queries not persisted
- **Secure API Key Handling:** Keys encrypted/hashed in database

---

## Monitoring and Health

### Health Check System

The system includes comprehensive health monitoring for all components:

#### System Components Monitored
- **GitHub API:** Connectivity and response times
- **ChromaDB:** Vector database availability and query capability
- **SearxNG:** Web search instance health and failover status
- **Supabase:** Database connectivity and operation success
- **System Resources:** CPU, memory, and disk usage (if psutil available)

#### Health Status Levels
- **Healthy:** All systems operational
- **Degraded:** Some non-critical services impaired
- **Unhealthy:** Critical services unavailable

#### Monitoring Features
- **Automatic Health Checks:** Regular component monitoring
- **Health History:** Tracking of system health over time
- **Performance Metrics:** Response times and success rates
- **Uptime Calculation:** System availability percentages

### Error Handling

#### Exception Management
- **Global Exception Handlers:** Catch all unhandled exceptions
- **HTTP Exception Handling:** Proper HTTP status codes
- **Service-Specific Errors:** Component-specific error messages
- **Safe Error Responses:** No sensitive information exposure

#### Logging Strategy
- **Structured Logging:** Consistent log format across components
- **Error Tracking:** Detailed error information for debugging
- **Performance Logging:** Request timing and performance metrics
- **Security Logging:** Authentication and authorization events

---

## Testing

### Test Implementation (`test_implementation.py`)

The backend includes comprehensive testing capabilities:

#### Test Categories
1. **Import Tests:** Verify all modules can be imported
2. **Data Model Tests:** Validate Pydantic model functionality
3. **Usage Tracker Tests:** Quota management and API key operations
4. **SearxNG Client Tests:** Web search functionality
5. **RAG Engine Tests:** AI component health and operations
6. **Health Monitor Tests:** System monitoring capabilities
7. **Directory Structure Tests:** Verify required files and directories

#### Test Execution
```bash
python test_implementation.py
```

#### Test Features
- **Async Support:** Tests async components properly
- **Error Handling:** Graceful test failure handling
- **Comprehensive Coverage:** Tests all major components
- **Setup Validation:** Verifies system is ready for production

---

## Deployment

### Production Deployment

#### Environment Setup
1. **Environment Variables:** Configure all required environment variables
2. **Database Setup:** Deploy Supabase with proper schema
3. **SSL/TLS:** Enable HTTPS for production endpoints
4. **Domain Configuration:** Set up proper domain and CORS settings

#### Docker Deployment
```bash
# Build image
docker build -t haqooqai-backend:latest .

# Run container
docker run -d \
  --name haqooqai-backend \
  -p 7860:7860 \
  --env-file .env \
  haqooqai-backend:latest
```

#### Performance Considerations
- **Worker Processes:** Use multiple uvicorn workers for scalability
- **Database Connections:** Configure connection pooling
- **Memory Management:** Monitor memory usage for vector operations
- **Disk Space:** Ensure adequate space for ChromaDB storage

#### Monitoring in Production
- **Health Endpoints:** Regular health check monitoring
- **Log Aggregation:** Centralized logging system
- **Performance Metrics:** Response time and throughput monitoring
- **Error Tracking:** Real-time error alerting

### Scaling Considerations
- **Horizontal Scaling:** Multiple backend instances behind load balancer
- **Database Scaling:** Supabase handles database scaling automatically
- **Vector Database:** ChromaDB can be moved to dedicated server
- **Search Services:** SearxNG instances can be distributed

---

## Dependencies

### Core Dependencies (`requirements.txt`)
```
fastapi                    # Web framework
uvicorn                   # ASGI server
python-dotenv             # Environment variable management
httpx                     # HTTP client
langchain                 # LLM framework
langchain-openai          # OpenAI/Groq integration
langchain-community       # Additional LangChain tools
tiktoken                  # Token counting
beautifulsoup4            # HTML parsing
pandas                    # Data manipulation
chromadb                  # Vector database
PyPDF2                    # PDF processing
sentence-transformers     # Embeddings
openpyxl                  # Excel file support
requests                  # HTTP requests
duckduckgo-search         # Search functionality
supabase                  # Database client
python-dateutil           # Date parsing
```

### System Requirements
- **Python:** 3.9 or higher
- **Memory:** Minimum 2GB RAM (4GB+ recommended for embeddings)
- **Storage:** 1GB+ for ChromaDB vector storage
- **Network:** Stable internet connection for API services

---

This documentation provides a comprehensive overview of the HaqooqAI Backend system as implemented in the codebase. The system is designed to be production-ready with proper error handling, security measures, monitoring capabilities, and scalability considerations.