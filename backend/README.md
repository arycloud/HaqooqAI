---
title: HaqooqAI Backend
emoji: ⚖️
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# HaqooqAI Backend

A simplified AI service for Pakistani legal information, built with FastAPI and powered by RAG (Retrieval-Augmented Generation) technology.

## 🎯 Overview

HaqooqAI Backend is a focused AI service that provides Pakistan legal information through LLM-powered responses. Following the principle of separation of concerns, this backend **only handles AI/RAG processing** while the frontend manages all user interface, conversations, and database interactions directly.

## 🏗️ Architecture

- **Framework**: FastAPI 0.104+
- **Language**: Python 3.9+
- **LLM Integration**: Groq API
- **Authentication**: GitHub OAuth validation only
- **Search Engine**: SearxNG instances
- **Vector Database**: ChromaDB (local)
- **Database**: Supabase (PostgreSQL)
- **Data Storage**: User profiles, usage quotas, API keys

## 📁 Directory Structure

```
backend/
├── src/
│   ├── main.py                    # FastAPI application
│   ├── config.py                  # Configuration settings
│   ├── health_monitor.py          # Health monitoring
│   ├── auth/
│   │   ├── __init__.py
│   │   └── github_auth.py         # GitHub token validation
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── agent.py               # LegalAssistantAgent
│   │   ├── rag_engine.py          # RAG processing
│   │   ├── tools.py               # Search tools
│   │   └── searxng_client.py      # SearxNG client
│   ├── quota/
│   │   ├── __init__.py
│   │   └── usage_tracker.py       # Supabase-based quota management
│   ├── database/
│   │   ├── __init__.py
│   │   └── supabase_client.py     # Supabase database client
│   └── models/
│       ├── __init__.py
│       ├── requests.py            # Request models
│       └── responses.py           # Response models
├── data/
│   ├── chroma_db/                 # Vector database
│   ├── pakistan_laws_*.csv        # Legal documents
│   ├── usage.json                 # Simple quota tracking
│   └── README.md                  # Data directory documentation
├── requirements.txt               # Python dependencies
├── setup.py                      # Setup script
├── database_schema.sql           # Supabase database schema
├── test_supabase.py              # Supabase integration tests
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.9 or higher
- Git
- GitHub account (for OAuth)
- Supabase account and project
- Groq API key (optional, for default service)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd HaqooqAI/backend

# Run the setup script
python setup.py

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/Linux/macOS:
source venv/bin/activate
```

### 3. Database Setup

Set up your Supabase database:

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL script from `database_schema.sql` to create tables
4. Get your project URL and API keys from Settings > API

### 4. Configuration

Edit the `.env` file with your configuration:

```bash
# Required: GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Required: Supabase Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Optional: Default Groq API key
DEFAULT_GROQ_KEY=your_groq_api_key

# Optional: Usage limits
USAGE_LIMIT_DEFAULT=5
MAX_QUERY_LENGTH=1000
```

### 5. Test Database Connection

Test your Supabase integration:

```bash
# Test database connection and operations
python test_supabase.py
```

### 6. Run the Application

```bash
# Development mode
python -m uvicorn src.main:app --reload

# Production mode
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📚 API Endpoints

### Authentication
- `POST /auth/validate` - Validate GitHub token and get user profile

### AI Query Processing
- `POST /ask/` - Process legal queries with AI

### User Management
- `POST /user/groq-key` - Save user's Groq API key
- `GET /user/quota/{user_id}` - Get user quota information

### System
- `GET /health` - Comprehensive health check
- `GET /stats` - System statistics
- `GET /` - API information

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Required |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Required |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_KEY` | Supabase anon key | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Required |
| `DEFAULT_GROQ_KEY` | Default Groq API key | Optional |
| `USAGE_LIMIT_DEFAULT` | Default query limit per user | 5 |
| `MAX_QUERY_LENGTH` | Maximum query length | 1000 |
| `LOG_LEVEL` | Logging level | INFO |

### CORS Configuration

The API is configured to accept requests from:
- `https://arycloud.github.io`
- `http://localhost:3000`
- `http://localhost:5173`

## 🔍 Features

### AI Processing
- **Intelligent Query Routing**: Automatically determines whether to use local documents or web search
- **Source Citation**: Provides detailed source information for all responses
- **Pakistan-Focused**: Specialized for Pakistani legal information
- **Multi-Modal Search**: Combines vector search with web search

### Authentication & Security
- **GitHub OAuth**: Secure token-based authentication
- **Quota Management**: Rate limiting with daily quotas
- **API Key Support**: Users can provide their own Groq API keys for unlimited access

### Health Monitoring
- **Comprehensive Health Checks**: Monitors all system components
- **Service Status**: Real-time status of GitHub API, ChromaDB, and SearxNG
- **Performance Metrics**: Response times and system resource usage

## 🧪 Testing

### Manual Testing

1. **Health Check**:
```bash
curl http://localhost:8000/health
```

2. **Authentication**:
```bash
curl -X POST http://localhost:8000/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"github_token": "your_github_token"}'
```

3. **Query Processing**:
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the constitution of Pakistan?", "user_id": 12345}'
```

### Automated Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

## 📊 Monitoring

### Health Endpoints
- `/health` - Overall system health
- `/stats` - Usage statistics

### Logging
- Structured logging with configurable levels
- Request/response logging
- Error tracking and reporting

## 🚀 Deployment

### HuggingFace Spaces

The application is designed for deployment on HuggingFace Spaces:

1. Create a new Space on HuggingFace
2. Upload the backend code
3. Set environment variables in Space settings
4. The application will start automatically

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY data/ ./data/

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔧 Troubleshooting

### Common Issues

1. **ChromaDB Connection Error**:
   - Ensure data/chroma_db directory exists
   - Check file permissions

2. **GitHub API Rate Limiting**:
   - Verify GitHub token is valid
   - Check rate limit status

3. **SearxNG Unavailable**:
   - Check internet connectivity
   - Verify SearxNG instances are accessible

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python -m uvicorn src.main:app --reload
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation at `/docs`
- Review the health status at `/health`
- Check logs for error details
- Open an issue on GitHub
