-- Add payment_method_id column to pledges table
ALTER TABLE pledges ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR;

-- Add comment to explain the column
COMMENT ON COLUMN pledges.payment_method_id IS 'Stripe Payment Method ID for charging pledges';
