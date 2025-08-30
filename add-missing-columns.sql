-- Add all missing columns for comprehensive analysis
ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS images_analyzed INTEGER DEFAULT 0;

ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS visual_analysis TEXT;

ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS text_analysis TEXT;

ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS combined_analysis TEXT;

ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS article_analysis TEXT;

ALTER TABLE tweet_analysis 
ADD COLUMN IF NOT EXISTS articles_analyzed INTEGER DEFAULT 0;

-- Update existing rows to have default values
UPDATE tweet_analysis
SET images_analyzed = COALESCE(images_analyzed, 0)
WHERE images_analyzed IS NULL;

UPDATE tweet_analysis
SET articles_analyzed = COALESCE(articles_analyzed, 0)
WHERE articles_analyzed IS NULL;
