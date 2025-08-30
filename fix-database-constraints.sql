-- Fix database constraints for monthly billing system

-- Make payment_intent_id nullable since we're using setup_intent_id now
ALTER TABLE pledges ALTER COLUMN payment_intent_id DROP NOT NULL;

-- Make setup_intent_id NOT NULL since it's required for new pledges
ALTER TABLE pledges ALTER COLUMN setup_intent_id SET NOT NULL;

-- Add comments to clarify the change
COMMENT ON COLUMN pledges.payment_intent_id IS 'DEPRECATED: Old PaymentIntent ID. Use setup_intent_id for new pledges.';
COMMENT ON COLUMN pledges.setup_intent_id IS 'Stripe SetupIntent ID for future monthly charges';
