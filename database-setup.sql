-- Junkipedia to Supabase Connector - Database Setup
-- Run this SQL in your Supabase SQL editor to create the required table

-- Create the table for storing JK Rowling's posts
CREATE TABLE IF NOT EXISTS jk_rowling_posts (
  id SERIAL PRIMARY KEY,
  junkipedia_id VARCHAR UNIQUE NOT NULL,
  content TEXT,
  author VARCHAR,
  platform VARCHAR,
  post_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  url VARCHAR,
  engagement_metrics JSONB,
  tags TEXT[],
  issues JSONB,
  raw_data JSONB,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jk_rowling_posts_junkipedia_id ON jk_rowling_posts(junkipedia_id);
CREATE INDEX IF NOT EXISTS idx_jk_rowling_posts_published_at ON jk_rowling_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_jk_rowling_posts_platform ON jk_rowling_posts(platform);
CREATE INDEX IF NOT EXISTS idx_jk_rowling_posts_author ON jk_rowling_posts(author);

-- Create a GIN index for full-text search on content
CREATE INDEX IF NOT EXISTS idx_jk_rowling_posts_content_gin ON jk_rowling_posts USING GIN (to_tsvector('english', content));

-- Optional: Create a view for recent posts
CREATE OR REPLACE VIEW recent_jk_rowling_posts AS
SELECT 
  id,
  junkipedia_id,
  content,
  author,
  platform,
  post_type,
  published_at,
  url,
  engagement_metrics,
  tags
FROM jk_rowling_posts
WHERE published_at >= NOW() - INTERVAL '30 days'
ORDER BY published_at DESC;

-- Optional: Create a function to get post statistics
CREATE OR REPLACE FUNCTION get_jk_rowling_stats()
RETURNS TABLE(
  total_posts BIGINT,
  posts_last_7_days BIGINT,
  posts_last_30_days BIGINT,
  latest_post_date TIMESTAMP WITH TIME ZONE,
  earliest_post_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_posts,
    COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days')::BIGINT as posts_last_7_days,
    COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days')::BIGINT as posts_last_30_days,
    MAX(published_at) as latest_post_date,
    MIN(published_at) as earliest_post_date
  FROM jk_rowling_posts;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON jk_rowling_posts TO authenticated;
-- GRANT USAGE ON SEQUENCE jk_rowling_posts_id_seq TO authenticated;

-- Success message
SELECT 'Database setup completed successfully!' as status;
