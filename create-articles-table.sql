-- Create the articles table in Supabase
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS article_content (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT,
  word_count INTEGER,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'pending'
  error_message TEXT,
  
  -- Indexes for better performance
  UNIQUE(tweet_id, url)
);

-- Add RLS policies
ALTER TABLE article_content ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on article_content" ON article_content
  FOR ALL USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_article_content_tweet_id ON article_content(tweet_id);
CREATE INDEX IF NOT EXISTS idx_article_content_url ON article_content(url);
CREATE INDEX IF NOT EXISTS idx_article_content_status ON article_content(status);
