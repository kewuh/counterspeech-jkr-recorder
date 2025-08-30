-- Fix NULL values in setup_intent_id before making it NOT NULL

-- First, let's see how many rows have NULL setup_intent_id
SELECT COUNT(*) as null_count 
FROM pledges 
WHERE setup_intent_id IS NULL;

-- Update existing rows to have a placeholder value for setup_intent_id
UPDATE pledges 
SET setup_intent_id = 'MIGRATED_' || id::text 
WHERE setup_intent_id IS NULL;

-- Verify the update worked
SELECT COUNT(*) as remaining_null_count 
FROM pledges 
WHERE setup_intent_id IS NULL;

-- Now we can safely make setup_intent_id NOT NULL
ALTER TABLE pledges ALTER COLUMN setup_intent_id SET NOT NULL;

-- Also make payment_intent_id nullable
ALTER TABLE pledges ALTER COLUMN payment_intent_id DROP NOT NULL;

-- Add comments
COMMENT ON COLUMN pledges.payment_intent_id IS 'DEPRECATED: Old PaymentIntent ID. Use setup_intent_id for new pledges.';
COMMENT ON COLUMN pledges.setup_intent_id IS 'Stripe SetupIntent ID for future monthly charges';

-- Show final state
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'pledges' AND column_name IN ('payment_intent_id', 'setup_intent_id')
ORDER BY column_name;
