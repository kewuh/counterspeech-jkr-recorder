-- Update pledges table for monthly billing
ALTER TABLE pledges ADD COLUMN IF NOT EXISTS setup_intent_id VARCHAR;
ALTER TABLE pledges ADD COLUMN IF NOT EXISTS transphobic_posts_count INTEGER DEFAULT 0;
ALTER TABLE pledges ADD COLUMN IF NOT EXISTS last_transphobic_post_date TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN pledges.setup_intent_id IS 'Stripe SetupIntent ID for future charges';
COMMENT ON COLUMN pledges.transphobic_posts_count IS 'Number of transphobic posts tracked this month';
COMMENT ON COLUMN pledges.last_transphobic_post_date IS 'Date of last transphobic post tracked';

-- Create transphobic_posts table to track individual posts
CREATE TABLE IF NOT EXISTS transphobic_posts (
    id SERIAL PRIMARY KEY,
    pledge_id INTEGER REFERENCES pledges(id),
    tweet_id VARCHAR NOT NULL,
    post_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transphobic_posts_pledge_id ON transphobic_posts(pledge_id);
CREATE INDEX IF NOT EXISTS idx_transphobic_posts_tweet_id ON transphobic_posts(tweet_id);
CREATE INDEX IF NOT EXISTS idx_pledges_transphobic_count ON pledges(transphobic_posts_count);

-- Add comments
COMMENT ON TABLE transphobic_posts IS 'Tracks individual transphobic posts for monthly billing';
COMMENT ON COLUMN transphobic_posts.pledge_id IS 'Reference to the pledge';
COMMENT ON COLUMN transphobic_posts.tweet_id IS 'ID of the transphobic tweet';
COMMENT ON COLUMN transphobic_posts.post_number IS 'Sequential number of transphobic post for this pledge';
