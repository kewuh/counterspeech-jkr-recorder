const StripeAPI = require('./stripe-api');

async function testCharge() {
    console.log('🧪 Testing Pledge Charge System\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Get all active pledges
        const stats = await stripeAPI.getPledgeStats();
        console.log('📊 Current Stats:', stats);
        
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
        console.log('🎯 Testing charge on pledge:', {
            id: pledge.id,
            email: pledge.email,
            monthlyLimit: pledge.monthly_limit,
            perPostAmount: pledge.per_post_amount,
            currentCharged: pledge.current_month_charged
        });
        
        // Simulate a transphobic tweet charge
        console.log('\n💳 Simulating transphobic content charge...');
        const chargeResult = await stripeAPI.processTransphobicCharge(pledge.id, 'test_tweet_123');
        
        if (chargeResult.success) {
            console.log('✅ Charge successful!');
            console.log('💰 Amount charged:', `£${chargeResult.amount}`);
            console.log('🆔 Charge ID:', chargeResult.chargeId);
        } else {
            console.log('❌ Charge failed:', chargeResult.error);
        }
        
        // Check updated stats
        const updatedStats = await stripeAPI.getPledgeStats();
        console.log('\n📊 Updated Stats:', updatedStats);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testCharge();
