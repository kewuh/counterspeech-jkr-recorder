-- Create the tweet_analysis table in Supabase
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS tweet_analysis (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  is_potentially_transphobic BOOLEAN NOT NULL,
  confidence_level TEXT NOT NULL,
  concerns TEXT[],
  explanation TEXT,
  severity TEXT NOT NULL,
  recommendations TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_analysis JSONB
);

-- Add RLS policies
ALTER TABLE tweet_analysis ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on tweet_analysis" ON tweet_analysis
  FOR ALL USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_tweet_id ON tweet_analysis(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_transphobic ON tweet_analysis(is_potentially_transphobic);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_severity ON tweet_analysis(severity);
