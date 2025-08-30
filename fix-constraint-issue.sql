-- Fix the payment_intent_id constraint issue

-- First, let's see the current constraints
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'pledges' AND column_name = 'payment_intent_id';

-- Drop the NOT NULL constraint
ALTER TABLE pledges ALTER COLUMN payment_intent_id DROP NOT NULL;

-- Verify the constraint is dropped
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'pledges' AND column_name = 'payment_intent_id';

-- Also make sure setup_intent_id is NOT NULL for new pledges
ALTER TABLE pledges ALTER COLUMN setup_intent_id SET NOT NULL;

-- Add some default values to existing rows if needed
UPDATE pledges 
SET payment_intent_id = 'DEPRECATED_' || id::text 
WHERE payment_intent_id IS NULL;

-- Add comments
COMMENT ON COLUMN pledges.payment_intent_id IS 'DEPRECATED: Old PaymentIntent ID. Use setup_intent_id for new pledges.';
COMMENT ON COLUMN pledges.setup_intent_id IS 'Stripe SetupIntent ID for future monthly charges';
