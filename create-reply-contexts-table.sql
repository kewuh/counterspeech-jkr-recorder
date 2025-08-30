-- Create reply_contexts table for storing Twitter reply data
CREATE TABLE IF NOT EXISTS reply_contexts (
    id SERIAL PRIMARY KEY,
    reply_context_id VARCHAR UNIQUE NOT NULL,
    reply_tweet_id VARCHAR NOT NULL,
    reply_tweet_text TEXT,
    reply_tweet_created_at TIMESTAMP WITH TIME ZONE,
    reply_tweet_metrics JSONB,
    original_tweet_id VARCHAR,
    original_tweet_text TEXT,
    original_tweet_created_at TIMESTAMP WITH TIME ZONE,
    original_tweet_metrics JSONB,
    original_user_username VARCHAR,
    original_user_name VARCHAR,
    conversation_id VARCHAR,
    platform VARCHAR DEFAULT 'twitter',
    raw_data JSONB,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reply_contexts_reply_tweet_id ON reply_contexts(reply_tweet_id);
CREATE INDEX IF NOT EXISTS idx_reply_contexts_original_tweet_id ON reply_contexts(original_tweet_id);
CREATE INDEX IF NOT EXISTS idx_reply_contexts_conversation_id ON reply_contexts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reply_contexts_created_at ON reply_contexts(reply_tweet_created_at);
CREATE INDEX IF NOT EXISTS idx_reply_contexts_platform ON reply_contexts(platform);

-- Add comments for documentation
COMMENT ON TABLE reply_contexts IS 'Stores Twitter reply contexts with original tweets being replied to';
COMMENT ON COLUMN reply_contexts.reply_context_id IS 'Unique identifier for this reply context';
COMMENT ON COLUMN reply_contexts.reply_tweet_id IS 'Twitter ID of the reply tweet';
COMMENT ON COLUMN reply_contexts.original_tweet_id IS 'Twitter ID of the original tweet being replied to';
COMMENT ON COLUMN reply_contexts.conversation_id IS 'Twitter conversation ID for threading';
COMMENT ON COLUMN reply_contexts.raw_data IS 'Complete raw data from Twitter API';
