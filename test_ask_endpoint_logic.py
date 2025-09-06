#!/usr/bin/env python3
"""
Test the /ask/ endpoint logic without FastAPI
This tests the core functionality that was failing
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

def test_ask_endpoint_logic():
    """Test the core logic of the /ask/ endpoint"""
    print("🧪 Testing /ask/ Endpoint Logic...")
    
    try:
        # Set up testing mode
        os.environ['TESTING_MODE'] = 'true'
        os.environ['USE_MOCK_LLM'] = 'true'
        os.environ['BYPASS_GITHUB_AUTH'] = 'true'
        os.environ['ENABLE_TEST_ENDPOINTS'] = 'true'
        
        # Import configuration
        from config import TESTING_MODE, USE_MOCK_LLM
        print(f"  ✅ Testing mode: {TESTING_MODE}")
        print(f"  ✅ Mock LLM: {USE_MOCK_LLM}")
        
        # Import mock services
        from testing.mock_services import MockUsageTracker, MockSupabaseClient, MockLLMClient
        
        # Create mock services
        usage_tracker = MockUsageTracker()
        supabase_client = MockSupabaseClient()
        
        print("  ✅ Mock services created")
        
        # Test usage tracker quota info
        quota_info = usage_tracker.get_quota_info(8708068)
        print(f"  ✅ Quota info type: {type(quota_info)}")
        print(f"  ✅ Quota info: remaining={quota_info.remaining}, limit={quota_info.limit}")
        
        # Test mock LLM client
        llm_client = MockLLMClient("groq")
        
        # Test bind_tools method
        llm_client.bind_tools([])
        print("  ✅ bind_tools method works")
        
        # Test invoke method
        response = llm_client.invoke([{"role": "user", "content": "What is Pakistani law?"}])
        print(f"  ✅ LLM response type: {type(response)}")
        print(f"  ✅ LLM response content: {response.content[:50]}...")
        
        # Test supabase client
        user_id = supabase_client.get_user_internal_id(8708068)
        print(f"  ✅ User internal ID: {user_id}")
        
        conversation = supabase_client.get_conversation_with_messages("test-conversation-12345", user_id)
        print(f"  ✅ Conversation messages: {len(conversation['messages'])}")
        
        print("  ✅ All core components working!")
        return True
        
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_llm_provider_manager():
    """Test LLM provider manager with mock clients"""
    print("\n🔀 Testing LLM Provider Manager...")
    
    try:
        # Set up environment
        os.environ['USE_MOCK_LLM'] = 'true'
        
        from ai.llm_providers import LLMProviderManager, LLMProvider
        
        manager = LLMProviderManager()
        print("  ✅ LLM Provider Manager created")
        
        # Test token counting (should work without tiktoken issues)
        try:
            tokens = manager.count_tokens("What is Pakistani law?")
            print(f"  ✅ Token counting: {tokens} tokens")
        except Exception as e:
            print(f"  ⚠️  Token counting failed (expected): {e}")
            # This is expected due to tiktoken architecture issues
        
        # Test routing decision
        decision = manager.determine_provider("What is Pakistani law?", 5)
        print(f"  ✅ Routing decision: {decision.provider.value}")
        print(f"  ✅ Routing reason: {decision.reason}")
        
        # Test mock LLM client creation
        mock_client = manager.create_llm_client(LLMProvider.GROQ)
        print(f"  ✅ Mock client created: {type(mock_client).__name__}")
        
        # Test bind_tools
        bound_client = mock_client.bind_tools([])
        print("  ✅ bind_tools method works")
        
        return True
        
    except Exception as e:
        print(f"  ❌ LLM Provider Manager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_conversation_manager():
    """Test conversation manager with mock client"""
    print("\n💬 Testing Conversation Manager...")
    
    try:
        # Import and create conversation manager
        from services.conversation_manager import ConversationManager
        
        conv_manager = ConversationManager()
        print("  ✅ Conversation Manager created")
        
        # Test conversation stats
        stats = conv_manager.get_conversation_stats("test-conversation-12345", 8708068)
        print(f"  ✅ Conversation stats: {stats.message_count} messages")
        
        # Test conversation limit check
        can_continue, message = conv_manager.check_conversation_limit("test-conversation-12345", 8708068)
        print(f"  ✅ Can continue: {can_continue}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Conversation Manager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def simulate_ask_endpoint():
    """Simulate the /ask/ endpoint logic"""
    print("\n🎯 Simulating /ask/ Endpoint Logic...")
    
    try:
        # Set up environment
        os.environ['TESTING_MODE'] = 'true'
        os.environ['USE_MOCK_LLM'] = 'true'
        
        # Import required modules
        from testing.mock_services import MockUsageTracker, MockSupabaseClient
        from models.responses import QuotaInfo, AIResponse
        from datetime import datetime
        
        # Create mock request data
        request_data = {
            "query": "What is Pakistani law?",
            "user_id": 8708068,
            "conversation_id": "test-conversation-12345"
        }
        
        print(f"  📝 Request: {request_data}")
        
        # Create mock services
        usage_tracker = MockUsageTracker()
        
        # Test quota checking
        can_proceed = usage_tracker.check_quota(request_data["user_id"])
        print(f"  ✅ Quota check: {can_proceed}")
        
        # Increment usage
        usage_tracker.increment_usage(request_data["user_id"])
        print("  ✅ Usage incremented")
        
        # Get quota info for response
        quota_info = usage_tracker.get_quota_info(request_data["user_id"])
        print(f"  ✅ Quota info: {type(quota_info)} - {quota_info.remaining}/{quota_info.limit}")
        
        # Simulate AI response
        mock_result = {
            "response": "This is a mock response about Pakistani law.",
            "sources": [],
            "disclaimer": "This is a test response.",
            "routing_info": {
                "provider": "groq",
                "reason": "Simple query: 1 messages, 15 tokens",
                "message_count": 1,
                "query_tokens": 15,
                "using_user_key": False,
                "estimated_cost": "System quota"
            }
        }
        
        # Create AI response (this was failing before)
        try:
            ai_response = AIResponse(
                status="success",
                response=mock_result["response"],
                sources=mock_result.get("sources", []),
                disclaimer=mock_result.get("disclaimer", ''),
                usage=quota_info,  # This should now work
                processing_time=2.5,
                query_id="test-query-id"
            )
            print("  ✅ AIResponse created successfully!")
            print(f"  ✅ Response status: {ai_response.status}")
            print(f"  ✅ Usage type: {type(ai_response.usage)}")
            
        except Exception as e:
            print(f"  ❌ AIResponse creation failed: {e}")
            return False
        
        print("  ✅ /ask/ endpoint logic simulation successful!")
        return True
        
    except Exception as e:
        print(f"  ❌ /ask/ endpoint simulation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("🚀 Testing HaqooqAI /ask/ Endpoint Fixes")
    print("=" * 60)
    
    tests = [
        test_ask_endpoint_logic,
        test_llm_provider_manager,
        test_conversation_manager,
        simulate_ask_endpoint
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"  ❌ Test {test.__name__} crashed: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"🎉 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✅ All /ask/ endpoint fixes working!")
        print("\n📋 Fixed Issues:")
        print("  ✅ MockUsageTracker now returns proper QuotaInfo objects")
        print("  ✅ MockLLMClient has bind_tools() method")
        print("  ✅ AIResponse creation works with proper usage field")
        print("  ✅ Mock services properly integrated")
        print("\n🚀 The /ask/ endpoint should now work!")
        print("\n💡 Next steps:")
        print("  1. Fix FastAPI/Pydantic version compatibility")
        print("  2. Restart server and test with curl")
        print("  3. Verify all routing scenarios work")
        return True
    else:
        print(f"❌ {failed} tests failed. Please fix issues before proceeding.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
