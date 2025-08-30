-- Create reply_analysis table for storing AI analysis results
CREATE TABLE IF NOT EXISTS reply_analysis (
    id SERIAL PRIMARY KEY,
    reply_context_id VARCHAR NOT NULL,
    analysis_type VARCHAR DEFAULT 'reply_context',
    analysis_result JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reply_tweet_id VARCHAR,
    original_tweet_id VARCHAR,
    FOREIGN KEY (reply_context_id) REFERENCES reply_contexts(reply_context_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reply_analysis_context_id ON reply_analysis(reply_context_id);
CREATE INDEX IF NOT EXISTS idx_reply_analysis_type ON reply_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_reply_analysis_analyzed_at ON reply_analysis(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_reply_analysis_reply_tweet_id ON reply_analysis(reply_tweet_id);

-- Add comments for documentation
COMMENT ON TABLE reply_analysis IS 'Stores AI analysis results for reply contexts';
COMMENT ON COLUMN reply_analysis.reply_context_id IS 'Reference to the reply context being analyzed';
COMMENT ON COLUMN reply_analysis.analysis_result IS 'JSON result from AI analysis including transphobia assessment';
COMMENT ON COLUMN reply_analysis.analysis_type IS 'Type of analysis performed (reply_context, etc.)';
