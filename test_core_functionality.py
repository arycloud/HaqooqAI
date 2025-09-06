#!/usr/bin/env python3
"""
Test core multi-LLM functionality without FastAPI server
This tests the core routing logic and mock services directly
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

def test_configuration():
    """Test configuration loading"""
    print("🔧 Testing Configuration Loading...")
    
    try:
        from config import (
            TESTING_MODE, USE_MOCK_LLM, BYPASS_GITHUB_AUTH,
            ROUTING_MESSAGE_THRESHOLD, ROUTING_TOKEN_THRESHOLD,
            MAX_QUERY_TOKENS, MAX_CONVERSATION_MESSAGES
        )
        
        print(f"  ✅ TESTING_MODE: {TESTING_MODE}")
        print(f"  ✅ USE_MOCK_LLM: {USE_MOCK_LLM}")
        print(f"  ✅ BYPASS_GITHUB_AUTH: {BYPASS_GITHUB_AUTH}")
        print(f"  ✅ ROUTING_MESSAGE_THRESHOLD: {ROUTING_MESSAGE_THRESHOLD}")
        print(f"  ✅ ROUTING_TOKEN_THRESHOLD: {ROUTING_TOKEN_THRESHOLD}")
        print(f"  ✅ MAX_QUERY_TOKENS: {MAX_QUERY_TOKENS}")
        print(f"  ✅ MAX_CONVERSATION_MESSAGES: {MAX_CONVERSATION_MESSAGES}")
        
        assert TESTING_MODE == True, "TESTING_MODE should be True"
        assert USE_MOCK_LLM == True, "USE_MOCK_LLM should be True"
        assert BYPASS_GITHUB_AUTH == True, "BYPASS_GITHUB_AUTH should be True"
        
        print("  ✅ Configuration loaded correctly!")
        return True
        
    except Exception as e:
        print(f"  ❌ Configuration loading failed: {e}")
        return False


def test_mock_services():
    """Test mock services"""
    print("\n🧪 Testing Mock Services...")
    
    try:
        from testing.mock_services import (
            MockGitHubAuthService, MockSupabaseClient, MockLLMClient, MockUsageTracker
        )
        
        # Test GitHub auth service
        auth_service = MockGitHubAuthService()
        print("  ✅ MockGitHubAuthService created")
        
        # Test Supabase client
        db_client = MockSupabaseClient()
        print("  ✅ MockSupabaseClient created")
        
        # Test LLM client
        llm_client = MockLLMClient("groq")
        print("  ✅ MockLLMClient created")
        
        # Test usage tracker
        usage_tracker = MockUsageTracker()
        print("  ✅ MockUsageTracker created")
        
        # Test some functionality
        user_info = auth_service.mock_users.get(8708068)
        print(f"  ✅ Mock user data: {user_info['login']}")
        
        internal_id = db_client.get_user_internal_id(8708068)
        print(f"  ✅ Mock internal ID: {internal_id}")
        
        usage = usage_tracker.get_usage(8708068)
        print(f"  ✅ Mock usage data: {usage['queries_today']}/{usage['limit']}")
        
        print("  ✅ Mock services working correctly!")
        return True
        
    except Exception as e:
        print(f"  ❌ Mock services test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_llm_providers():
    """Test LLM provider management"""
    print("\n🔀 Testing LLM Provider Management...")
    
    try:
        from ai.llm_providers import LLMProviderManager, LLMProvider
        
        manager = LLMProviderManager()
        print("  ✅ LLMProviderManager created")
        
        # Test token counting
        query = "What is Pakistani law?"
        tokens = manager.count_tokens(query)
        print(f"  ✅ Token counting: '{query}' = {tokens} tokens")
        
        # Test query validation
        is_valid, token_count, error = manager.validate_query_length(query)
        print(f"  ✅ Query validation: valid={is_valid}, tokens={token_count}")
        
        # Test routing decisions
        decision = manager.determine_provider(query, 5)
        print(f"  ✅ Routing decision: {decision.provider.value} - {decision.reason}")
        
        # Test with user key
        decision_with_key = manager.determine_provider(query, 5, user_groq_key="gsk_test")
        print(f"  ✅ BYOK routing: {decision_with_key.provider.value} (user_key={decision_with_key.using_user_key})")
        
        # Test provider info
        info = manager.get_all_providers_info()
        print(f"  ✅ Provider info: {len(info)} providers configured")
        
        # Test mock LLM client creation
        mock_client = manager.create_llm_client(LLMProvider.GROQ)
        print(f"  ✅ Mock LLM client created: {type(mock_client).__name__}")
        
        print("  ✅ LLM provider management working correctly!")
        return True
        
    except Exception as e:
        print(f"  ❌ LLM provider test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_conversation_manager():
    """Test conversation management"""
    print("\n💬 Testing Conversation Management...")
    
    try:
        from services.conversation_manager import ConversationManager
        
        manager = ConversationManager()
        print("  ✅ ConversationManager created")
        print(f"  ✅ Max messages per conversation: {manager.max_messages}")
        
        # Test conversation stats (will use mock data)
        stats = manager.get_conversation_stats("test-conversation-12345", 8708068)
        print(f"  ✅ Conversation stats: {stats.message_count} messages")
        
        # Test conversation limit check
        can_continue, message = manager.check_conversation_limit("test-conversation-12345", 8708068)
        print(f"  ✅ Conversation limit check: can_continue={can_continue}")
        
        # Test health info
        health_info = manager.get_conversation_health_info("test-conversation-12345", 8708068)
        print(f"  ✅ Health info: {health_info.get('status', 'unknown')}")
        
        print("  ✅ Conversation management working correctly!")
        return True
        
    except Exception as e:
        print(f"  ❌ Conversation manager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_routing_scenarios():
    """Test various routing scenarios"""
    print("\n🎯 Testing Routing Scenarios...")
    
    try:
        from ai.llm_providers import LLMProviderManager
        
        manager = LLMProviderManager()
        
        # Test case 1: Simple query (should route to Groq)
        decision1 = manager.determine_provider("What is Pakistani law?", 5)
        print(f"  ✅ Simple query → {decision1.provider.value}")
        assert decision1.provider.value == "groq", f"Expected groq, got {decision1.provider.value}"
        
        # Test case 2: Long query (should route to Gemini)
        long_query = "Please provide a comprehensive analysis " * 100
        decision2 = manager.determine_provider(long_query, 5)
        print(f"  ✅ Long query → {decision2.provider.value}")
        assert decision2.provider.value == "gemini", f"Expected gemini, got {decision2.provider.value}"
        
        # Test case 3: Many messages (should route to Gemini)
        decision3 = manager.determine_provider("Short query", 15)
        print(f"  ✅ Many messages → {decision3.provider.value}")
        assert decision3.provider.value == "gemini", f"Expected gemini, got {decision3.provider.value}"
        
        # Test case 4: User Groq key (should override to Groq)
        decision4 = manager.determine_provider("Any query", 20, user_groq_key="gsk_test")
        print(f"  ✅ User Groq key → {decision4.provider.value}")
        assert decision4.provider.value == "groq", f"Expected groq, got {decision4.provider.value}"
        assert decision4.using_user_key == True, "Should be using user key"
        
        # Test case 5: User Gemini key (should override to Gemini)
        decision5 = manager.determine_provider("Any query", 5, user_gemini_key="test_key")
        print(f"  ✅ User Gemini key → {decision5.provider.value}")
        assert decision5.provider.value == "gemini", f"Expected gemini, got {decision5.provider.value}"
        assert decision5.using_user_key == True, "Should be using user key"
        
        # Test case 6: User OpenAI key (should override to OpenAI)
        decision6 = manager.determine_provider("Any query", 5, user_openai_key="sk-test")
        print(f"  ✅ User OpenAI key → {decision6.provider.value}")
        assert decision6.provider.value == "openai", f"Expected openai, got {decision6.provider.value}"
        assert decision6.using_user_key == True, "Should be using user key"
        
        print("  ✅ All routing scenarios working correctly!")
        return True
        
    except Exception as e:
        print(f"  ❌ Routing scenarios test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_error_scenarios():
    """Test error handling scenarios"""
    print("\n🚨 Testing Error Scenarios...")
    
    try:
        from ai.llm_providers import LLMProviderManager
        
        manager = LLMProviderManager()
        
        # Test query too long
        very_long_query = "This is a very long query " * 1000
        is_valid, tokens, error = manager.validate_query_length(very_long_query)
        print(f"  ✅ Query too long: valid={is_valid}, tokens={tokens}")
        assert not is_valid, "Very long query should be invalid"
        assert "too long" in error.lower(), "Error message should mention 'too long'"
        
        # Test valid query
        short_query = "What is Pakistani law?"
        is_valid, tokens, error = manager.validate_query_length(short_query)
        print(f"  ✅ Valid query: valid={is_valid}, tokens={tokens}")
        assert is_valid, "Short query should be valid"
        
        print("  ✅ Error scenarios working correctly!")
        return True
        
    except Exception as e:
        print(f"  ❌ Error scenarios test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("🚀 Testing HaqooqAI Multi-LLM Core Functionality")
    print("=" * 60)
    
    tests = [
        test_configuration,
        test_mock_services,
        test_llm_providers,
        test_conversation_manager,
        test_routing_scenarios,
        test_error_scenarios
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
        print("✅ All core functionality tests passed!")
        print("\n📋 What's working:")
        print("  ✅ Configuration loading with .env file")
        print("  ✅ Mock services for local testing")
        print("  ✅ Multi-LLM provider management")
        print("  ✅ Intelligent routing decisions")
        print("  ✅ BYOK (Bring Your Own Key) functionality")
        print("  ✅ Conversation management")
        print("  ✅ Error handling and validation")
        print("\n🚀 Core functionality is ready!")
        print("\n💡 Next steps:")
        print("  1. Fix FastAPI/Pydantic version compatibility")
        print("  2. Test with actual FastAPI server")
        print("  3. Run comprehensive API tests")
        return True
    else:
        print(f"❌ {failed} tests failed. Please fix issues before proceeding.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
