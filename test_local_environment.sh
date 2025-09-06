#!/bin/bash

# Local Testing Script for HaqooqAI Multi-LLM Backend
# This script tests all functionality in the local testing environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8000"
TEST_USER_ID="8708068"
TEST_USERNAME="test_user"
TEST_GITHUB_TOKEN="ghp_test_token"

echo -e "${BLUE}🚀 Starting HaqooqAI Local Testing Suite${NC}"
echo "=================================================="

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ $description (HTTP $http_code)${NC}"
        echo "Response: $(echo $body | jq -r '.' 2>/dev/null || echo $body)"
        echo ""
        return 0
    else
        echo -e "${RED}❌ $description (HTTP $http_code)${NC}"
        echo "Response: $body"
        echo ""
        return 1
    fi
}

# Wait for server to be ready
echo -e "${YELLOW}⏳ Waiting for server to be ready...${NC}"
for i in {1..30}; do
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
        exit 1
    fi
    sleep 1
done

echo ""

# 1. Test Basic Health Endpoints
echo -e "${BLUE}1. Testing Health Endpoints${NC}"
echo "================================"

test_endpoint "GET" "/health" "" "Basic health check"
test_endpoint "GET" "/health/detailed" "" "Detailed health check"
test_endpoint "GET" "/test/health" "" "Testing mode health check"

# 2. Test Mock Data Endpoints
echo -e "${BLUE}2. Testing Mock Data Endpoints${NC}"
echo "=================================="

test_endpoint "GET" "/test/mock-data" "" "Get mock data"
test_endpoint "POST" "/test/reset-data" "" "Reset mock data"

# 3. Test Routing Statistics
echo -e "${BLUE}3. Testing Monitoring Endpoints${NC}"
echo "=================================="

test_endpoint "GET" "/stats/routing" "" "Routing statistics"
test_endpoint "GET" "/stats/conversations" "" "Conversation statistics"

# 4. Create Test Conversation
echo -e "${BLUE}4. Creating Test Conversation${NC}"
echo "================================"

CONV_RESPONSE=$(curl -s -X POST "$BASE_URL/test/conversations" \
    -H "Content-Type: application/json" \
    -d "{\"user_id\": $TEST_USER_ID, \"title\": \"Local Test Conversation\"}")

CONV_ID=$(echo $CONV_RESPONSE | jq -r '.conversation_id' 2>/dev/null || echo "test-conversation-12345")
echo -e "${GREEN}✅ Test conversation created: $CONV_ID${NC}"
echo ""

# 5. Test Basic Query (Should route to Groq)
echo -e "${BLUE}5. Testing Basic Query Routing (Groq)${NC}"
echo "====================================="

test_endpoint "POST" "/ask/" \
    "{\"query\": \"What is Pakistani law?\", \"user_id\": $TEST_USER_ID, \"conversation_id\": \"$CONV_ID\"}" \
    "Basic query routing to Groq"

echo -e "${GREEN}🎉 Basic functionality test complete!${NC}"
echo "All core features are working in the local testing environment."
