-- Create pledges table
CREATE TABLE IF NOT EXISTS pledges (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR NOT NULL,
    payment_intent_id VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    monthly_limit DECIMAL(10,2) NOT NULL,
    per_post_amount DECIMAL(10,2) NOT NULL,
    organization VARCHAR NOT NULL,
    current_month_charged DECIMAL(10,2) DEFAULT 0,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_charge_date TIMESTAMP WITH TIME ZONE,
    last_reset_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create pledge_charges table
CREATE TABLE IF NOT EXISTS pledge_charges (
    id SERIAL PRIMARY KEY,
    pledge_id INTEGER REFERENCES pledges(id),
    charge_id VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tweet_id VARCHAR,
    status VARCHAR DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pledges_customer_id ON pledges(customer_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledge_charges_pledge_id ON pledge_charges(pledge_id);
CREATE INDEX IF NOT EXISTS idx_pledge_charges_tweet_id ON pledge_charges(tweet_id);

-- Add comments
COMMENT ON TABLE pledges IS 'Stores user pledges for transphobic content donations';
COMMENT ON TABLE pledge_charges IS 'Stores individual charges made against pledges';
