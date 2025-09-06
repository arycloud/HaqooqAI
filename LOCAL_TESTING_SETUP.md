# Local Testing Environment Setup Guide

## 🎯 Quick Start

Follow these steps to set up a complete local testing environment for the HaqooqAI multi-LLM backend:

### 1. Environment Setup

```bash
# Navigate to backend directory
cd backend

# Copy the local testing environment file
cp .env.local .env

# Install dependencies
pip install -r requirements.txt

# Install additional testing dependencies
pip install pytest httpx
```

### 2. Start the Server

```bash
# Start the server in testing mode
uvicorn src.main:app --reload --port 8000

# Or use the environment variables directly
TESTING_MODE=true BYPASS_GITHUB_AUTH=true USE_MOCK_LLM=true uvicorn src.main:app --reload --port 8000
```

### 3. Verify Testing Mode

```bash
# Check that testing mode is active
curl http://localhost:8000/test/health
```

**Expected Response:**
```json
{
  "status": "testing_mode_active",
  "testing_mode": true,
  "bypass_github_auth": true,
  "use_mock_llm": true,
  "timestamp": "2024-09-04T17:30:00Z"
}
```

### 4. Run Comprehensive Tests

```bash
# Run the automated test suite
./test_local_environment.sh
```

## 🔧 Manual Testing Commands

### Basic Health Checks

```bash
# Basic health
curl http://localhost:8000/health

# Detailed health with multi-LLM info
curl http://localhost:8000/health/detailed | jq '.'

# Routing statistics
curl http://localhost:8000/stats/routing | jq '.'
```

### Test Multi-LLM Routing

#### 1. Simple Query (Routes to Groq)
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Pakistani law?",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345"
  }' | jq '.routing_info'
```

**Expected routing_info:**
```json
{
  "provider": "groq",
  "reason": "Simple query: 1 messages, 15 tokens",
  "message_count": 1,
  "query_tokens": 15,
  "using_user_key": false,
  "estimated_cost": "System quota"
}
```

#### 2. Long Query (Routes to Gemini)
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Please provide a comprehensive detailed analysis of the constitutional framework of Pakistan including all amendments, judicial interpretations, fundamental rights provisions, directive principles of state policy, and the relationship between federal and provincial governments as established in the Constitution of 1973 and all subsequent modifications through various constitutional amendments and Supreme Court landmark judgments that have shaped the legal landscape of Pakistan over the past five decades including specific case law references and comparative analysis with other constitutional democracies in the region and globally",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345"
  }' | jq '.routing_info.provider'
```

**Expected:** `"gemini"`

#### 3. BYOK with Groq Key
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test with user Groq key",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345",
    "groq_api_key": "gsk_test_user_key"
  }' | jq '.routing_info'
```

**Expected routing_info:**
```json
{
  "provider": "groq",
  "reason": "User provided Groq API key",
  "using_user_key": true,
  "estimated_cost": "User's account"
}
```

#### 4. BYOK with Gemini Key
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test with user Gemini key",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345",
    "gemini_api_key": "test_gemini_key"
  }' | jq '.routing_info.provider'
```

**Expected:** `"gemini"`

#### 5. BYOK with OpenAI Key
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test with user OpenAI key",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345",
    "openai_api_key": "sk-test_openai_key"
  }' | jq '.routing_info.provider'
```

**Expected:** `"openai"`

### Test Error Scenarios

#### 1. Query Too Long (HTTP 429)
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -w "HTTP Status: %{http_code}\n" \
  -d '{
    "query": "'$(printf 'This is a very long query that exceeds the token limit. %.0s' {1..500})'",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345"
  }'
```

**Expected:** HTTP 429 with error message about query length

#### 2. Invalid API Key Format (HTTP 422)
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -w "HTTP Status: %{http_code}\n" \
  -d '{
    "query": "Test with invalid key",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345",
    "groq_api_key": "invalid_key_format"
  }'
```

**Expected:** HTTP 422 with validation error

#### 3. Empty Query (HTTP 422)
```bash
curl -X POST http://localhost:8000/ask/ \
  -H "Content-Type: application/json" \
  -w "HTTP Status: %{http_code}\n" \
  -d '{
    "query": "",
    "user_id": 8708068,
    "conversation_id": "test-conversation-12345"
  }'
```

**Expected:** HTTP 422 with validation error

### Test Mock Data Management

#### Get Available Mock Data
```bash
curl http://localhost:8000/test/mock-data | jq '.'
```

#### Create Test Conversation
```bash
curl -X POST http://localhost:8000/test/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 8708068,
    "title": "My Test Conversation"
  }' | jq '.'
```

#### Reset Mock Data
```bash
curl -X POST http://localhost:8000/test/reset-data | jq '.'
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Server Won't Start
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill existing process if needed
kill -9 $(lsof -t -i:8000)

# Check environment variables
env | grep -E "(TESTING_MODE|BYPASS_GITHUB_AUTH|USE_MOCK_LLM)"
```

#### 2. Import Errors
```bash
# Make sure you're in the backend directory
cd backend

# Install missing dependencies
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"
```

#### 3. JSON Serialization Errors
The datetime serialization bug has been fixed. If you still see errors:

```bash
# Check server logs
tail -f logs/app.log

# Restart server
pkill -f uvicorn
uvicorn src.main:app --reload --port 8000
```

#### 4. Mock Services Not Working
```bash
# Verify testing mode is enabled
curl http://localhost:8000/test/health

# Check environment variables
echo $TESTING_MODE
echo $USE_MOCK_LLM
echo $BYPASS_GITHUB_AUTH
```

### Debugging Commands

#### Check Server Logs
```bash
# If using uvicorn directly
uvicorn src.main:app --reload --port 8000 --log-level debug

# Check for specific errors
grep -i error logs/app.log
```

#### Validate Configuration
```bash
# Check all environment variables
curl http://localhost:8000/test/health | jq '.'

# Verify routing configuration
curl http://localhost:8000/stats/routing | jq '.routing_config'
```

#### Test Individual Components
```bash
# Test token counting
python -c "
from src.ai.llm_providers import LLMProviderManager
manager = LLMProviderManager()
print('Token count:', manager.count_tokens('What is Pakistani law?'))
"

# Test routing decisions
python -c "
from src.ai.llm_providers import LLMProviderManager
manager = LLMProviderManager()
decision = manager.determine_provider('Short query', 5)
print('Provider:', decision.provider.value)
print('Reason:', decision.reason)
"
```

## 📊 Expected Test Results

When everything is working correctly, you should see:

### ✅ Successful Health Checks
- `/health` returns 200 with "healthy" status
- `/health/detailed` shows all components as "healthy"
- `/test/health` confirms testing mode is active

### ✅ Correct Routing Decisions
- Short queries route to "groq"
- Long queries route to "gemini"
- User API keys override system routing
- Routing info is included in all responses

### ✅ Proper Error Handling
- Query too long returns HTTP 429
- Invalid API keys return HTTP 422
- Empty queries return HTTP 422
- All errors include proper JSON responses

### ✅ Mock Services Functioning
- Mock LLM responses are returned
- Mock database operations work
- No external API calls are made
- Test data can be created and reset

## 🚀 Next Steps

Once local testing is successful:

1. **Test with Real API Keys**: Update `.env` with real API keys for staging tests
2. **Load Testing**: Use tools like `ab` or `wrk` to test performance
3. **Integration Testing**: Test with actual frontend applications
4. **Production Deployment**: Follow the zero-downtime migration plan

## 📝 Notes

- **No External Dependencies**: The local testing environment works completely offline
- **Safe Testing**: No real API calls or charges incurred
- **Complete Coverage**: All multi-LLM routing features are testable
- **Easy Reset**: Mock data can be reset to initial state anytime
- **Production Parity**: Same code paths as production, just with mock services
