const StripeAPI = require('./stripe-api');

async function testTransactionSystem() {
    console.log('🧪 Testing Complete Transaction System\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Step 1: Check current system state
        console.log('📊 Step 1: Current System State');
        const stats = await stripeAPI.getPledgeStats();
        console.log('   Total Pledges:', stats.totalPledges);
        console.log('   Total Monthly Limit:', `£${stats.totalMonthlyLimit}`);
        console.log('   Total Charged:', `£${stats.totalCharged}`);
        console.log('   Available for Charging:', `£${stats.availableForCharging}`);
        
        // Step 2: Get active pledges
        console.log('\n📋 Step 2: Active Pledges');
        const { data: pledges, error } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active');
            
        if (error || !pledges || pledges.length === 0) {
            console.log('   ❌ No active pledges found');
            return;
        }
        
        console.log(`   Found ${pledges.length} active pledges`);
        
        // Step 3: Test payment method validity
        console.log('\n💳 Step 3: Testing Payment Method Validity');
        for (const pledge of pledges) {
            try {
                if (pledge.payment_method_id && !pledge.payment_method_id.startsWith('MIGRATED_')) {
                    // Test if payment method is still valid
                    const paymentMethod = await stripeAPI.stripe.paymentMethods.retrieve(pledge.payment_method_id);
                    console.log(`   ✅ ${pledge.email}: Payment method valid (${paymentMethod.card.brand} ending in ${paymentMethod.card.last4})`);
                } else {
                    console.log(`   ⚠️  ${pledge.email}: Payment method needs update (migrated or missing)`);
                }
            } catch (error) {
                console.log(`   ❌ ${pledge.email}: Payment method invalid - ${error.message}`);
            }
        }
        
        // Step 4: Simulate transphobic posts
        console.log('\n📝 Step 4: Simulating Transphobic Posts');
        const testPledge = pledges[0];
        console.log(`   Testing with pledge: ${testPledge.email}`);
        
        for (let i = 1; i <= 5; i++) {
            const tweetId = `test_tweet_${Date.now()}_${i}`;
            console.log(`   Simulating post ${i}: ${tweetId}`);
            
            const trackResult = await stripeAPI.trackTransphobicPost(testPledge.id, tweetId);
            
            if (trackResult.success) {
                console.log(`   ✅ Post ${i} tracked: ${trackResult.postCount} total posts, potential charge: £${trackResult.potentialCharge}`);
            } else {
                console.log(`   ❌ Failed to track post ${i}: ${trackResult.error}`);
            }
        }
        
        // Step 5: Check updated pledge state
        console.log('\n📊 Step 5: Updated Pledge State');
        const { data: updatedPledge } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('id', testPledge.id)
            .single();
            
        console.log(`   Email: ${updatedPledge.email}`);
        console.log(`   Transphobic Posts: ${updatedPledge.transphobic_posts_count}`);
        console.log(`   Per Post Amount: £${updatedPledge.per_post_amount}`);
        console.log(`   Potential Charge: £${updatedPledge.transphobic_posts_count * updatedPledge.per_post_amount}`);
        console.log(`   Monthly Limit: £${updatedPledge.monthly_limit}`);
        
        // Step 6: Test monthly billing (DRY RUN)
        console.log('\n💰 Step 6: Testing Monthly Billing (Dry Run)');
        console.log('   This simulates what would happen during actual monthly billing...');
        
        const billingResult = await stripeAPI.processMonthlyCharges();
        
        if (billingResult.success) {
            console.log(`   ✅ Monthly billing simulation completed!`);
            console.log(`   📊 Results:`);
            
            billingResult.results.forEach(result => {
                if (result.success) {
                    console.log(`      ✅ ${result.email}: £${result.amount} (${result.postCount} posts)`);
                } else {
                    console.log(`      ❌ ${result.email}: ${result.error}`);
                }
            });
        } else {
            console.log(`   ❌ Monthly billing simulation failed: ${billingResult.error}`);
        }
        
        // Step 7: Check final state
        console.log('\n📈 Step 7: Final System State');
        const finalStats = await stripeAPI.getPledgeStats();
        console.log('   Total Pledges:', finalStats.totalPledges);
        console.log('   Total Charged:', `£${finalStats.totalCharged}`);
        console.log('   Available for Charging:', `£${finalStats.availableForCharging}`);
        
        // Step 8: Transaction management recommendations
        console.log('\n🎯 Step 8: Transaction Management Recommendations');
        console.log('   📅 Schedule: Run monthly billing on 1st of each month');
        console.log('   💳 Monitor: Check payment method validity regularly');
        console.log('   📊 Track: Monitor pledge statistics weekly');
        console.log('   🔄 Backup: Export pledge data monthly');
        console.log('   ⚠️  Alerts: Set up notifications for failed charges');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the comprehensive test
testTransactionSystem();
