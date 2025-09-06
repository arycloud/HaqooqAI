-- HaqooqAI Multi-LLM Routing System Database Migration
-- Run this SQL in your Supabase SQL editor to add multi-LLM support

-- ============================================================================
-- 1. EXTEND API KEYS TABLE FOR MULTIPLE PROVIDERS
-- ============================================================================

-- Add provider column to api_keys table
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'groq' CHECK (provider IN ('groq', 'gemini', 'openai'));

-- Drop the unique constraint on github_id to allow multiple keys per user
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_github_id_key;

-- Add composite unique constraint for github_id + provider
ALTER TABLE api_keys 
ADD CONSTRAINT api_keys_github_id_provider_unique UNIQUE (github_id, provider);

-- Create index for faster provider lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);

-- Update comment
COMMENT ON TABLE api_keys IS 'Stores user API keys for multiple LLM providers (hashed)';
COMMENT ON COLUMN api_keys.provider IS 'LLM provider: groq, gemini, or openai';

-- ============================================================================
-- 2. ADD ROUTING INFORMATION TO MESSAGES TABLE
-- ============================================================================

-- Add routing metadata columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(20),
ADD COLUMN IF NOT EXISTS query_tokens INTEGER,
ADD COLUMN IF NOT EXISTS routing_reason TEXT,
ADD COLUMN IF NOT EXISTS using_user_key BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Create indexes for routing analytics
CREATE INDEX IF NOT EXISTS idx_messages_llm_provider ON messages(llm_provider);
CREATE INDEX IF NOT EXISTS idx_messages_query_tokens ON messages(query_tokens);
CREATE INDEX IF NOT EXISTS idx_messages_using_user_key ON messages(using_user_key);

-- Add comments for new columns
COMMENT ON COLUMN messages.llm_provider IS 'LLM provider used for this message (groq, gemini, openai)';
COMMENT ON COLUMN messages.query_tokens IS 'Number of tokens in the user query';
COMMENT ON COLUMN messages.routing_reason IS 'Reason for provider selection';
COMMENT ON COLUMN messages.using_user_key IS 'Whether user API key was used';
COMMENT ON COLUMN messages.processing_time_ms IS 'Processing time in milliseconds';

-- ============================================================================
-- 3. CREATE ROUTING STATISTICS TABLE
-- ============================================================================

-- Create table for tracking routing decisions and performance
CREATE TABLE IF NOT EXISTS routing_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    conversation_id UUID,
    message_id UUID,
    llm_provider VARCHAR(20) NOT NULL,
    query_tokens INTEGER NOT NULL,
    message_count INTEGER NOT NULL,
    routing_reason TEXT NOT NULL,
    using_user_key BOOLEAN DEFAULT FALSE,
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_routing_stats_user_id ON routing_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_routing_stats_provider ON routing_stats(llm_provider);
CREATE INDEX IF NOT EXISTS idx_routing_stats_created_at ON routing_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_routing_stats_success ON routing_stats(success);
CREATE INDEX IF NOT EXISTS idx_routing_stats_using_user_key ON routing_stats(using_user_key);

-- Enable RLS
ALTER TABLE routing_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy for routing_stats
CREATE POLICY "Service role can do everything on routing_stats" ON routing_stats
    FOR ALL USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_routing_stats_updated_at BEFORE UPDATE ON routing_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE routing_stats IS 'Tracks LLM routing decisions and performance metrics';

-- ============================================================================
-- 4. CREATE CONVERSATION HEALTH TRACKING
-- ============================================================================

-- Add conversation health columns
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'critical')),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for conversation health monitoring
CREATE INDEX IF NOT EXISTS idx_conversations_health_status ON conversations(health_status);
CREATE INDEX IF NOT EXISTS idx_conversations_message_count ON conversations(message_count);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity ON conversations(last_activity);

-- Add comments
COMMENT ON COLUMN conversations.message_count IS 'Current number of messages in conversation';
COMMENT ON COLUMN conversations.total_tokens IS 'Total tokens used in conversation';
COMMENT ON COLUMN conversations.health_status IS 'Conversation health: healthy, warning, critical';
COMMENT ON COLUMN conversations.last_activity IS 'Timestamp of last message in conversation';

-- ============================================================================
-- 5. CREATE ANALYTICS VIEWS
-- ============================================================================

-- View for provider usage analytics
CREATE OR REPLACE VIEW provider_usage_stats AS
SELECT 
    llm_provider,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN using_user_key THEN 1 END) as user_key_requests,
    COUNT(CASE WHEN NOT using_user_key THEN 1 END) as system_key_requests,
    AVG(query_tokens) as avg_query_tokens,
    AVG(processing_time_ms) as avg_processing_time_ms,
    COUNT(CASE WHEN success THEN 1 END) as successful_requests,
    COUNT(CASE WHEN NOT success THEN 1 END) as failed_requests,
    DATE_TRUNC('day', created_at) as date
FROM routing_stats
GROUP BY llm_provider, DATE_TRUNC('day', created_at)
ORDER BY date DESC, llm_provider;

-- View for conversation health monitoring
CREATE OR REPLACE VIEW conversation_health_summary AS
SELECT 
    health_status,
    COUNT(*) as conversation_count,
    AVG(message_count) as avg_message_count,
    AVG(total_tokens) as avg_total_tokens,
    MAX(message_count) as max_message_count,
    MIN(last_activity) as oldest_activity,
    MAX(last_activity) as newest_activity
FROM conversations
GROUP BY health_status;

-- View for user routing patterns
CREATE OR REPLACE VIEW user_routing_patterns AS
SELECT 
    u.github_id,
    u.username,
    COUNT(rs.id) as total_queries,
    COUNT(CASE WHEN rs.llm_provider = 'groq' THEN 1 END) as groq_queries,
    COUNT(CASE WHEN rs.llm_provider = 'gemini' THEN 1 END) as gemini_queries,
    COUNT(CASE WHEN rs.llm_provider = 'openai' THEN 1 END) as openai_queries,
    COUNT(CASE WHEN rs.using_user_key THEN 1 END) as user_key_queries,
    AVG(rs.query_tokens) as avg_query_tokens,
    AVG(rs.processing_time_ms) as avg_processing_time
FROM users u
LEFT JOIN routing_stats rs ON u.id = rs.user_id
WHERE rs.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.github_id, u.username
ORDER BY total_queries DESC;

-- Grant permissions on views
GRANT SELECT ON provider_usage_stats TO authenticated, service_role;
GRANT SELECT ON conversation_health_summary TO authenticated, service_role;
GRANT SELECT ON user_routing_patterns TO authenticated, service_role;

-- ============================================================================
-- 6. CREATE FUNCTIONS FOR CONVERSATION MANAGEMENT
-- ============================================================================

-- Function to update conversation health status
CREATE OR REPLACE FUNCTION update_conversation_health()
RETURNS TRIGGER AS $$
BEGIN
    -- Update message count and health status for the conversation
    UPDATE conversations 
    SET 
        message_count = (
            SELECT COUNT(*) 
            FROM messages 
            WHERE conversation_id = NEW.conversation_id
        ),
        health_status = CASE 
            WHEN (SELECT COUNT(*) FROM messages WHERE conversation_id = NEW.conversation_id) >= 50 THEN 'critical'
            WHEN (SELECT COUNT(*) FROM messages WHERE conversation_id = NEW.conversation_id) >= 40 THEN 'warning'
            ELSE 'healthy'
        END,
        last_activity = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation health
CREATE TRIGGER update_conversation_health_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_health();

-- Function to clean up old routing stats (optional)
CREATE OR REPLACE FUNCTION cleanup_old_routing_stats(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM routing_stats 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. UPDATE EXISTING DATA (MIGRATION)
-- ============================================================================

-- Set default provider for existing API keys
UPDATE api_keys 
SET provider = 'groq' 
WHERE provider IS NULL;

-- Initialize conversation health for existing conversations
UPDATE conversations 
SET 
    message_count = (
        SELECT COUNT(*) 
        FROM messages 
        WHERE messages.conversation_id = conversations.id
    ),
    health_status = CASE 
        WHEN (SELECT COUNT(*) FROM messages WHERE messages.conversation_id = conversations.id) >= 50 THEN 'critical'
        WHEN (SELECT COUNT(*) FROM messages WHERE messages.conversation_id = conversations.id) >= 40 THEN 'warning'
        ELSE 'healthy'
    END,
    last_activity = COALESCE(
        (SELECT MAX(created_at) FROM messages WHERE messages.conversation_id = conversations.id),
        conversations.created_at
    )
WHERE message_count IS NULL OR message_count = 0;

-- ============================================================================
-- 8. PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_routing_stats_user_provider_date 
ON routing_stats(user_id, llm_provider, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_user_health 
ON conversations(user_id, health_status);

-- Partial indexes for active conversations
CREATE INDEX IF NOT EXISTS idx_conversations_active 
ON conversations(user_id, last_activity) 
WHERE health_status IN ('healthy', 'warning');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Multi-LLM routing database migration completed successfully!' as message,
       'New tables: routing_stats' as new_tables,
       'Modified tables: api_keys, messages, conversations' as modified_tables,
       'New views: provider_usage_stats, conversation_health_summary, user_routing_patterns' as new_views;
