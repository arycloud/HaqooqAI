"""
Test script for Supabase integration in HaqooqAI Backend
Tests all database operations and integrations
"""
import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

async def test_supabase_connection():
    """Test Supabase connection"""
    print("🧪 Testing Supabase connection...")
    
    try:
        from src.database.supabase_client import supabase_client
        
        # Test connection
        if not supabase_client.is_connected():
            print("❌ Supabase client not connected")
            print("   Make sure SUPABASE_URL and SUPABASE_KEY are set in .env")
            return False
        
        # Test health check
        health = await supabase_client.check_connection()
        print(f"✅ Supabase connection: {health['status']}")
        
        if health['status'] != 'healthy':
            print(f"❌ Connection unhealthy: {health.get('error', 'Unknown error')}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection test failed: {e}")
        return False


async def test_user_management():
    """Test user management operations"""
    print("\n🧪 Testing user management...")
    
    try:
        from src.database.supabase_client import supabase_client
        
        test_user_id = 99999
        test_username = "test_user"
        test_email = "test@example.com"
        
        # Test create/update user
        user_data = supabase_client.create_or_update_user(
            github_id=test_user_id,
            username=test_username,
            email=test_email
        )
        print(f"✅ User created/updated: {user_data['username']}")
        
        # Test get user
        retrieved_user = supabase_client.get_user_by_github_id(test_user_id)
        if retrieved_user:
            print(f"✅ User retrieved: {retrieved_user['username']}")
        else:
            print("❌ User not found after creation")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ User management test failed: {e}")
        return False


async def test_usage_tracking():
    """Test usage tracking operations"""
    print("\n🧪 Testing usage tracking...")
    
    try:
        from src.database.supabase_client import supabase_client
        
        test_user_id = 99999
        
        # Test get usage (should create if not exists)
        usage_data = supabase_client.get_user_usage(test_user_id)
        print(f"✅ Usage data retrieved: {usage_data['query_count']} queries")
        
        # Test increment usage
        updated_usage = supabase_client.increment_user_usage(test_user_id)
        print(f"✅ Usage incremented: {updated_usage['query_count']} queries")
        
        # Verify increment worked
        if updated_usage['query_count'] > usage_data['query_count']:
            print("✅ Usage increment verified")
        else:
            print("❌ Usage increment failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Usage tracking test failed: {e}")
        return False


async def test_api_key_management():
    """Test API key management operations"""
    print("\n🧪 Testing API key management...")
    
    try:
        from src.database.supabase_client import supabase_client
        
        test_user_id = 99999
        test_api_key = "gsk_test_key_12345"
        
        # Test save API key
        success = supabase_client.save_user_api_key(test_user_id, test_api_key)
        if success:
            print("✅ API key saved successfully")
        else:
            print("❌ API key save failed")
            return False
        
        # Test get API key
        retrieved_key = supabase_client.get_user_api_key(test_user_id)
        if retrieved_key == test_api_key:
            print("✅ API key retrieved successfully")
        else:
            print("❌ API key retrieval failed")
            return False
        
        # Test has API key
        has_key = supabase_client.has_user_api_key(test_user_id)
        if has_key:
            print("✅ Has API key check passed")
        else:
            print("❌ Has API key check failed")
            return False
        
        # Test delete API key
        delete_success = supabase_client.delete_user_api_key(test_user_id)
        if delete_success:
            print("✅ API key deleted successfully")
        else:
            print("❌ API key deletion failed")
            return False
        
        # Verify deletion
        deleted_key = supabase_client.get_user_api_key(test_user_id)
        if deleted_key is None:
            print("✅ API key deletion verified")
        else:
            print("❌ API key still exists after deletion")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ API key management test failed: {e}")
        return False


async def test_usage_tracker_integration():
    """Test UsageTracker with Supabase backend"""
    print("\n🧪 Testing UsageTracker integration...")

    try:
        from src.quota.usage_tracker import UsageTracker
        from src.database.supabase_client import supabase_client

        tracker = UsageTracker()
        test_user_id = 99998

        # Create user first to avoid foreign key constraint
        supabase_client.create_or_update_user(
            github_id=test_user_id,
            username=f"test_user_{test_user_id}",
            email=f"test{test_user_id}@example.com"
        )
        
        # Test quota check
        quota = tracker.check_quota(test_user_id)
        print(f"✅ Quota check: {quota.remaining}/{quota.limit}")
        
        # Test usage increment
        updated_quota = tracker.increment_usage(test_user_id)
        print(f"✅ Usage increment: {updated_quota.remaining}/{updated_quota.limit}")
        
        # Test API key operations
        test_api_key = "gsk_integration_test_key"
        save_success = tracker.save_api_key(test_user_id, test_api_key)
        print(f"✅ API key save: {save_success}")
        
        retrieved_key = tracker.get_api_key(test_user_id)
        print(f"✅ API key retrieval: {retrieved_key == test_api_key}")
        
        # Test quota with API key (should be unlimited)
        unlimited_quota = tracker.check_quota(test_user_id)
        print(f"✅ Unlimited quota: {unlimited_quota.unlimited}")
        
        # Test stats
        stats = tracker.get_usage_stats()
        print(f"✅ Usage stats: {stats['total_users']} users, {stats['total_queries']} queries")
        
        # Cleanup
        tracker.remove_api_key(test_user_id)
        
        return True
        
    except Exception as e:
        print(f"❌ UsageTracker integration test failed: {e}")
        return False


async def test_auth_service_integration():
    """Test GitHub auth service with Supabase integration"""
    print("\n🧪 Testing GitHub auth service integration...")
    
    try:
        from src.auth.github_auth import GitHubAuthService
        
        auth_service = GitHubAuthService()
        
        # Test that the service has database connection
        if auth_service.db.is_connected():
            print("✅ Auth service has database connection")
        else:
            print("⚠️  Auth service database not connected (will work without DB)")
        
        # Test GitHub API health check
        github_health = await auth_service.check_github_api_health()
        print(f"✅ GitHub API health: {github_health['status']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Auth service integration test failed: {e}")
        return False


async def test_health_monitoring():
    """Test health monitoring with Supabase"""
    print("\n🧪 Testing health monitoring...")

    try:
        import logging
        # Temporarily suppress ChromaDB logging to reduce noise
        logging.getLogger("chromadb").setLevel(logging.ERROR)

        from src.health_monitor import health_monitor

        # Test comprehensive health check
        health_report = await health_monitor.check_all_services()
        print(f"✅ Health check: {health_report['overall']['status']}")

        # Check if Supabase is included
        if 'supabase' in health_report['services']:
            supabase_status = health_report['services']['supabase']['status']
            print(f"✅ Supabase health: {supabase_status}")
        else:
            print("❌ Supabase not included in health check")
            return False

        # Restore logging level
        logging.getLogger("chromadb").setLevel(logging.INFO)

        return True

    except Exception as e:
        print(f"❌ Health monitoring test failed: {e}")
        return False


async def cleanup_test_data():
    """Clean up test data from database"""
    print("\n🧹 Cleaning up test data...")
    
    try:
        from src.database.supabase_client import supabase_client
        
        test_user_ids = [99999, 99998]
        
        for user_id in test_user_ids:
            # Delete API key
            supabase_client.delete_user_api_key(user_id)
            
            # Delete usage record
            try:
                supabase_client.client.table("usage").delete().eq("github_id", user_id).execute()
            except:
                pass
            
            # Delete user
            try:
                supabase_client.client.table("users").delete().eq("github_id", user_id).execute()
            except:
                pass
        
        print("✅ Test data cleaned up")
        return True
        
    except Exception as e:
        print(f"⚠️  Cleanup failed (non-critical): {e}")
        return True  # Don't fail the overall test for cleanup issues


async def main():
    """Run all Supabase integration tests"""
    print("🚀 HaqooqAI Backend Supabase Integration Test")
    print("=" * 60)
    
    # Check environment
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        print("❌ SUPABASE_URL and SUPABASE_KEY must be set in environment")
        print("   Create a .env file with your Supabase credentials")
        return False
    
    tests = [
        ("Supabase Connection", test_supabase_connection),
        ("User Management", test_user_management),
        ("Usage Tracking", test_usage_tracking),
        ("API Key Management", test_api_key_management),
        ("UsageTracker Integration", test_usage_tracker_integration),
        ("Auth Service Integration", test_auth_service_integration),
        ("Health Monitoring", test_health_monitoring),
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
    
    # Cleanup regardless of test results
    await cleanup_test_data()
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All Supabase integration tests passed!")
        print("\n📋 Next steps:")
        print("1. Set up your Supabase database using database_schema.sql")
        print("2. Configure your .env file with Supabase credentials")
        print("3. Start the server: python -m uvicorn src.main:app --reload")
    else:
        print("⚠️  Some tests failed. Please review the errors above.")
        print("\n🔧 Troubleshooting:")
        print("1. Verify Supabase credentials in .env file")
        print("2. Ensure database schema is set up correctly")
        print("3. Check Supabase project permissions and RLS policies")
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
