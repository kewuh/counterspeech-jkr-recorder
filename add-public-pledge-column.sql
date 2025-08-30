-- Add name and public_pledge fields to pledges table
ALTER TABLE pledges ADD COLUMN IF NOT EXISTS name VARCHAR;
ALTER TABLE pledges ADD COLUMN IF NOT EXISTS public_pledge BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN pledges.name IS 'Full name of the pledger (optional)';
COMMENT ON COLUMN pledges.public_pledge IS 'Whether this pledge should be shown publicly in recent pledgers';

-- Create index for public pledgers
CREATE INDEX IF NOT EXISTS idx_pledges_public_pledge ON pledges(public_pledge, created_at DESC);

-- Update existing pledges to have public_pledge = false
UPDATE pledges SET public_pledge = FALSE WHERE public_pledge IS NULL;
