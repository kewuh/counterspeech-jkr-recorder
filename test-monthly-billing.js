const StripeAPI = require('./stripe-api');

async function testMonthlyBilling() {
    console.log('🧪 Testing Monthly Billing System\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Get all active pledges
        const stats = await stripeAPI.getPledgeStats();
        console.log('📊 Current Pledge Stats:', stats);
        
        if (stats.totalPledges === 0) {
            console.log('❌ No pledges found to test');
            return;
        }
        
        // Get the first active pledge
        const { data: pledges, error } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active')
            .limit(1);
            
        if (error || !pledges || pledges.length === 0) {
            console.log('❌ No active pledges found');
            return;
        }
        
        const pledge = pledges[0];
        console.log(`🎯 Testing with pledge: ${pledge.email}`);
        console.log(`   Monthly limit: £${pledge.monthly_limit}`);
        console.log(`   Per post amount: £${pledge.per_post_amount}`);
        console.log(`   Current transphobic posts: ${pledge.transphobic_posts_count || 0}`);
        
        // Simulate tracking some transphobic posts
        console.log('\n📝 Simulating transphobic posts...');
        
        for (let i = 1; i <= 3; i++) {
            const tweetId = `test_tweet_${Date.now()}_${i}`;
            console.log(`   Tracking post ${i}: ${tweetId}`);
            
            const trackResult = await stripeAPI.trackTransphobicPost(pledge.id, tweetId);
            
            if (trackResult.success) {
                console.log(`   ✅ Post ${i} tracked: ${trackResult.postCount} total posts, potential charge: £${trackResult.potentialCharge}`);
            } else {
                console.log(`   ❌ Failed to track post ${i}: ${trackResult.error}`);
            }
        }
        
        // Check updated pledge stats
        const { data: updatedPledge } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('id', pledge.id)
            .single();
            
        console.log(`\n📊 Updated pledge stats:`);
        console.log(`   Transphobic posts: ${updatedPledge.transphobic_posts_count}`);
        console.log(`   Potential monthly charge: £${updatedPledge.transphobic_posts_count * updatedPledge.per_post_amount}`);
        
        // Test monthly billing
        console.log('\n💰 Testing monthly billing...');
        const billingResult = await stripeAPI.processMonthlyCharges();
        
        if (billingResult.success) {
            console.log(`✅ Monthly billing completed!`);
            console.log(`📊 Results:`, billingResult.results);
        } else {
            console.log(`❌ Monthly billing failed: ${billingResult.error}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMonthlyBilling();
