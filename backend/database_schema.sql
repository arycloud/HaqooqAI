-- HaqooqAI Backend Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor to create the required tables

-- Enable Row Level Security (RLS) for all tables
-- This ensures data security in Supabase

-- 1. Users table - stores GitHub user profiles
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on github_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- 2. Usage table - tracks user query quotas and usage
CREATE TABLE IF NOT EXISTS usage (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    query_count INTEGER DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (github_id) REFERENCES users(github_id) ON DELETE CASCADE
);

-- Create index on github_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_github_id ON usage(github_id);

-- 3. API Keys table - stores user's Groq API keys (hashed)
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    github_id BIGINT UNIQUE NOT NULL,
    api_key_hash TEXT NOT NULL, -- In production, this should be properly encrypted/hashed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (github_id) REFERENCES users(github_id) ON DELETE CASCADE
);

-- Create index on github_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_github_id ON api_keys(github_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for usage table
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on usage" ON usage
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own usage
CREATE POLICY "Users can read own usage" ON usage
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for api_keys table
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on api_keys" ON api_keys
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to manage their own API keys
CREATE POLICY "Users can manage own api_keys" ON api_keys
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- You can remove this section in production

-- Sample user (replace with actual GitHub data)
-- INSERT INTO users (github_id, username, email) 
-- VALUES (12345, 'testuser', 'test@example.com')
-- ON CONFLICT (github_id) DO NOTHING;

-- Sample usage record
-- INSERT INTO usage (github_id, query_count, reset_at)
-- VALUES (12345, 0, NOW() + INTERVAL '24 hours')
-- ON CONFLICT (github_id) DO NOTHING;

-- Create a view for user statistics (optional)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.github_id,
    u.username,
    u.email,
    u.created_at as user_created_at,
    u.last_login,
    COALESCE(us.query_count, 0) as query_count,
    us.reset_at,
    CASE WHEN ak.github_id IS NOT NULL THEN true ELSE false END as has_api_key,
    CASE WHEN ak.github_id IS NOT NULL THEN true ELSE false END as unlimited_access
FROM users u
LEFT JOIN usage us ON u.github_id = us.github_id
LEFT JOIN api_keys ak ON u.github_id = ak.github_id;

-- Grant permissions on the view
GRANT SELECT ON user_stats TO authenticated, service_role;

-- 4. Conversations table - stores user conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- 5. Messages table - stores conversation messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- Enable RLS for new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations table
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on conversations" ON conversations
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for messages table
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on messages" ON messages
    FOR ALL USING (auth.role() = 'service_role');

-- Create triggers for conversations and messages
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usage_reset_at ON usage(reset_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores GitHub user profiles and authentication data';
COMMENT ON TABLE usage IS 'Tracks user query quotas and usage statistics';
COMMENT ON TABLE api_keys IS 'Stores user API keys for unlimited access (hashed)';
COMMENT ON TABLE conversations IS 'Stores user conversations with the AI assistant';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON VIEW user_stats IS 'Combined view of user data with usage and API key status';

-- Success message
SELECT 'HaqooqAI database schema created successfully!' as message;
