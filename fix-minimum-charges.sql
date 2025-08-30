-- Fix minimum charge amounts (Stripe requires £0.30 minimum)

-- First, see which pledges have amounts below minimum
SELECT 
    id,
    email,
    per_post_amount,
    'Will be updated to £0.30' as action
FROM pledges 
WHERE per_post_amount < 0.30;

-- Update all pledges to have minimum £0.30 per post
UPDATE pledges 
SET per_post_amount = 0.30 
WHERE per_post_amount < 0.30;

-- Verify the update
SELECT 
    id,
    email,
    per_post_amount,
    transphobic_posts_count,
    (per_post_amount * transphobic_posts_count) as potential_charge
FROM pledges 
WHERE status = 'active';
