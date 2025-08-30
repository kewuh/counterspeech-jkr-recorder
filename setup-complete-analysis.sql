-- Complete Setup for JK Rowling Tweet Analysis System
-- Run this SQL in your Supabase SQL Editor

-- 1. Create the tweet_analysis table
CREATE TABLE IF NOT EXISTS tweet_analysis (
    id SERIAL PRIMARY KEY,
    tweet_id TEXT UNIQUE NOT NULL,
    is_potentially_transphobic BOOLEAN NOT NULL,
    confidence_level TEXT NOT NULL,
    concerns TEXT[],
    explanation TEXT,
    severity TEXT NOT NULL,
    recommendations TEXT[],
    tweet_analysis TEXT,
    article_analysis TEXT,
    combined_analysis TEXT,
    articles_analyzed INTEGER DEFAULT 0,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_analysis JSONB
);

-- 2. Create the article_content table
CREATE TABLE IF NOT EXISTS article_content (
    id SERIAL PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    content TEXT,
    word_count INTEGER,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success',
    error_message TEXT,
    UNIQUE(tweet_id, url)
);

-- 3. Enable Row Level Security on both tables
ALTER TABLE tweet_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_content ENABLE ROW LEVEL SECURITY;

-- 4. Create policies to allow all operations
CREATE POLICY "Allow all operations on tweet_analysis" ON tweet_analysis
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on article_content" ON article_content
    FOR ALL USING (true);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_tweet_id ON tweet_analysis(tweet_id);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_transphobic ON tweet_analysis(is_potentially_transphobic);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_severity ON tweet_analysis(severity);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_analyzed_at ON tweet_analysis(analyzed_at);

CREATE INDEX IF NOT EXISTS idx_article_content_tweet_id ON article_content(tweet_id);
CREATE INDEX IF NOT EXISTS idx_article_content_url ON article_content(url);
CREATE INDEX IF NOT EXISTS idx_article_content_status ON article_content(status);

-- 6. Add any missing columns to existing tables (if they exist)
DO $$ 
BEGIN
    -- Add media analysis columns to tweet_analysis if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tweet_analysis' AND column_name = 'media_analysis') THEN
        ALTER TABLE tweet_analysis ADD COLUMN media_analysis TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tweet_analysis' AND column_name = 'text_analysis') THEN
        ALTER TABLE tweet_analysis ADD COLUMN text_analysis TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tweet_analysis' AND column_name = 'combined_analysis') THEN
        ALTER TABLE tweet_analysis ADD COLUMN combined_analysis TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tweet_analysis' AND column_name = 'image_count') THEN
        ALTER TABLE tweet_analysis ADD COLUMN image_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 7. Verify the setup
SELECT 
    'tweet_analysis' as table_name,
    COUNT(*) as row_count
FROM tweet_analysis
UNION ALL
SELECT 
    'article_content' as table_name,
    COUNT(*) as row_count
FROM article_content;

-- 8. Show sample data structure
SELECT 
    'Sample tweet_analysis structure:' as info,
    jsonb_pretty(raw_analysis) as sample_data
FROM tweet_analysis 
LIMIT 1;

SELECT 
    'Sample article_content structure:' as info,
    title,
    word_count,
    status
FROM article_content 
LIMIT 3;
