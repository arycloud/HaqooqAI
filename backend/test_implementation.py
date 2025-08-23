"""
Test script to validate HaqooqAI Backend implementation
Tests all major components and endpoints
"""
import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

async def test_imports():
    """Test that all modules can be imported"""
    print("🧪 Testing imports...")
    
    try:
        # Test configuration
        from src.config import API_TITLE, API_VERSION, VECTOR_DB_DIR
        print(f"✅ Config loaded: {API_TITLE} v{API_VERSION}")
        
        # Test models
        from src.models.requests import AuthRequest, QueryRequest, ApiKeyRequest
        from src.models.responses import AuthResponse, AIResponse, UserProfile
        print("✅ Data models imported successfully")
        
        # Test auth service
        from src.auth.github_auth import GitHubAuthService
        auth_service = GitHubAuthService()
        print("✅ GitHub auth service created")
        
        # Test quota tracker
        from src.quota.usage_tracker import UsageTracker
        usage_tracker = UsageTracker()
        print("✅ Usage tracker created")
        
        # Test AI components
        from src.ai.searxng_client import searxng_client
        from src.ai.tools import legal_document_search, web_search_tool
        from src.ai.agent import LegalAssistantAgent
        from src.ai.rag_engine import LegalRAGEngine
        print("✅ AI components imported successfully")
        
        # Test health monitor
        from src.health_monitor import health_monitor
        print("✅ Health monitor imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False


async def test_data_models():
    """Test data model validation"""
    print("\n🧪 Testing data models...")
    
    try:
        from src.models.requests import AuthRequest, QueryRequest
        from src.models.responses import UserProfile, QuotaInfo
        from datetime import datetime, timedelta
        
        # Test request models
        auth_req = AuthRequest(github_token="ghp_test_token")
        query_req = QueryRequest(query="Test query", user_id=12345)
        print("✅ Request models validation passed")
        
        # Test response models
        user = UserProfile(github_id=12345, username="testuser", email="test@example.com")
        quota = QuotaInfo(
            remaining=5, 
            limit=5, 
            reset_at=datetime.now() + timedelta(hours=24),
            has_api_key=False
        )
        print("✅ Response models validation passed")
        
        return True
        
    except Exception as e:
        print(f"❌ Data model test failed: {e}")
        return False


async def test_usage_tracker():
    """Test usage tracker functionality"""
    print("\n🧪 Testing usage tracker...")
    
    try:
        from src.quota.usage_tracker import UsageTracker
        
        tracker = UsageTracker()
        
        # Test quota check
        test_user_id = 99999
        quota = tracker.check_quota(test_user_id)
        print(f"✅ Quota check: {quota.remaining}/{quota.limit}")
        
        # Test usage increment
        updated_quota = tracker.increment_usage(test_user_id)
        print(f"✅ Usage increment: {updated_quota.remaining}/{updated_quota.limit}")
        
        # Test API key management
        test_api_key = "gsk_test_key_12345"
        success = tracker.save_api_key(test_user_id, test_api_key)
        print(f"✅ API key save: {success}")
        
        retrieved_key = tracker.get_api_key(test_user_id)
        print(f"✅ API key retrieval: {retrieved_key == test_api_key}")
        
        # Test stats
        stats = tracker.get_usage_stats()
        print(f"✅ Usage stats: {stats['total_users']} users, {stats['total_queries']} queries")
        
        return True
        
    except Exception as e:
        print(f"❌ Usage tracker test failed: {e}")
        return False


async def test_searxng_client():
    """Test SearxNG client"""
    print("\n🧪 Testing SearxNG client...")
    
    try:
        from src.ai.searxng_client import searxng_client
        
        # Test health status
        health = await searxng_client.get_health_status()
        print(f"✅ SearxNG health: {health['healthy']}/{health['total_instances']} instances")
        
        # Test search (if instances are available)
        if health['healthy'] > 0:
            result = await searxng_client.search("Pakistan constitution test")
            print(f"✅ Search test: {len(result)} characters returned")
        else:
            print("⚠️  No healthy SearxNG instances for search test")
        
        return True
        
    except Exception as e:
        print(f"❌ SearxNG client test failed: {e}")
        return False


async def test_rag_engine():
    """Test RAG engine"""
    print("\n🧪 Testing RAG engine...")
    
    try:
        from src.ai.rag_engine import LegalRAGEngine
        
        rag = LegalRAGEngine()
        
        # Test health check
        health = await rag.check_rag_health()
        print(f"✅ RAG health: {health['overall']}")
        
        # Test local search
        local_results = rag.search_local_knowledge("test query", n_results=1)
        print(f"✅ Local search: {len(local_results)} results")
        
        # Test web search
        web_result = await rag.web_search("Pakistan test")
        print(f"✅ Web search: {len(web_result)} characters")
        
        # Test stats
        stats = rag.get_usage_stats()
        print(f"✅ RAG stats: Agent initialized: {stats['agent_initialized']}")
        
        return True
        
    except Exception as e:
        print(f"❌ RAG engine test failed: {e}")
        return False


async def test_health_monitor():
    """Test health monitoring"""
    print("\n🧪 Testing health monitor...")
    
    try:
        from src.health_monitor import health_monitor
        
        # Test comprehensive health check
        health_report = await health_monitor.check_all_services()
        print(f"✅ Health check: {health_report['overall']['status']}")
        print(f"   Services: {health_report['overall']['healthy_services']}/{health_report['overall']['total_services']}")
        
        # Test health summary
        summary = health_monitor.get_health_summary()
        print(f"✅ Health summary: {summary['current_status']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Health monitor test failed: {e}")
        return False


async def test_directory_structure():
    """Test that all required directories and files exist"""
    print("\n🧪 Testing directory structure...")
    
    try:
        required_files = [
            "src/main.py",
            "src/config.py",
            "src/auth/github_auth.py",
            "src/quota/usage_tracker.py",
            "src/ai/rag_engine.py",
            "src/ai/agent.py",
            "src/ai/tools.py",
            "src/ai/searxng_client.py",
            "src/models/requests.py",
            "src/models/responses.py",
            "requirements.txt",
            "data/usage.json",
            ".env.example"
        ]
        
        missing_files = []
        for file_path in required_files:
            if not Path(file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            print(f"❌ Missing files: {missing_files}")
            return False
        
        print("✅ All required files present")
        
        # Check data directories
        data_dirs = ["data", "data/chroma_db"]
        for dir_path in data_dirs:
            if not Path(dir_path).exists():
                print(f"❌ Missing directory: {dir_path}")
                return False
        
        print("✅ All required directories present")
        return True
        
    except Exception as e:
        print(f"❌ Directory structure test failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("🚀 HaqooqAI Backend Implementation Test")
    print("=" * 50)
    
    tests = [
        ("Directory Structure", test_directory_structure),
        ("Imports", test_imports),
        ("Data Models", test_data_models),
        ("Usage Tracker", test_usage_tracker),
        ("SearxNG Client", test_searxng_client),
        ("RAG Engine", test_rag_engine),
        ("Health Monitor", test_health_monitor),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            if result:
                passed += 1
            else:
                print(f"❌ {test_name} test failed")
        except Exception as e:
            print(f"❌ {test_name} test error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Implementation is ready.")
        print("\n📋 Next steps:")
        print("1. Configure .env file with your API keys")
        print("2. Add legal document data to data/ directory")
        print("3. Start the server: python -m uvicorn src.main:app --reload")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
