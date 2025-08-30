-- Add images_analyzed column to tweet_analysis table
ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS images_analyzed INTEGER DEFAULT 0;

-- Update existing rows to have default value
UPDATE tweet_analysis
SET images_analyzed = COALESCE(images_analyzed, 0)
WHERE images_analyzed IS NULL;
