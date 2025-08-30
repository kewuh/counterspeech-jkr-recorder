-- Create the reply_contexts table in Supabase
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS reply_contexts (
  id SERIAL PRIMARY KEY,
  original_post_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  original_tweet_id TEXT NOT NULL,
  original_author TEXT,
  original_content TEXT,
  original_published_at TIMESTAMP WITH TIME ZONE,
  original_url TEXT,
  twitter_url TEXT,
  not_found BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(original_post_id, original_tweet_id)
);

-- Add RLS policies if needed
ALTER TABLE reply_contexts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on reply_contexts" ON reply_contexts
  FOR ALL USING (true);
