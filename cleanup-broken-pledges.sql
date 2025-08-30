-- Clean up broken pledges (missing payment methods)
-- This will delete pledges that can't be charged

-- First, let's see what we're deleting
SELECT 
    id,
    email,
    monthly_limit,
    per_post_amount,
    transphobic_posts_count,
    created_at,
    'Will be deleted - missing payment method' as reason
FROM pledges 
WHERE payment_method_id IS NULL;

-- Delete pledges with missing payment methods
DELETE FROM pledges 
WHERE payment_method_id IS NULL;

-- Also clean up any related transphobic posts for deleted pledges
DELETE FROM transphobic_posts 
WHERE pledge_id NOT IN (SELECT id FROM pledges);

-- Verify the cleanup
SELECT 
    COUNT(*) as remaining_pledges,
    SUM(monthly_limit) as total_monthly_limit
FROM pledges 
WHERE status = 'active';
