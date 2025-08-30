-- Update the tweet_analysis table to include media analysis columns
-- Run this in your Supabase SQL editor

-- Add new columns for enhanced analysis
ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS media_analysis TEXT,
ADD COLUMN IF NOT EXISTS text_analysis TEXT,
ADD COLUMN IF NOT EXISTS combined_analysis TEXT,
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- Update existing rows to have default values
UPDATE tweet_analysis 
SET 
    media_analysis = COALESCE(media_analysis, 'Not analyzed'),
    text_analysis = COALESCE(text_analysis, 'Not analyzed'),
    combined_analysis = COALESCE(combined_analysis, 'Not analyzed'),
    image_count = COALESCE(image_count, 0)
WHERE media_analysis IS NULL OR text_analysis IS NULL OR combined_analysis IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_media ON tweet_analysis(media_analysis);
CREATE INDEX IF NOT EXISTS idx_tweet_analysis_image_count ON tweet_analysis(image_count);
