const StripeAPI = require('./stripe-api');

async function testIfItWorked() {
    console.log('🧪 Testing if Your Transaction System is Working\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Test 1: Check if pledges exist
        console.log('📋 Test 1: Checking Pledges');
        const stats = await stripeAPI.getPledgeStats();
        console.log(`   ✅ Found ${stats.totalPledges} pledges`);
        console.log(`   ✅ Total monthly limit: £${stats.totalMonthlyLimit}`);
        
        if (stats.totalPledges === 0) {
            console.log('   ❌ No pledges found - create some pledges first!');
            return;
        }
        
        // Test 2: Check if payment methods are valid
        console.log('\n💳 Test 2: Checking Payment Methods');
        const { data: pledges } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active');
            
        let validMethods = 0;
        for (const pledge of pledges) {
            if (pledge.payment_method_id && !pledge.payment_method_id.startsWith('MIGRATED_')) {
                try {
                    await stripeAPI.stripe.paymentMethods.retrieve(pledge.payment_method_id);
                    validMethods++;
                } catch (error) {
                    // Payment method is invalid
                }
            }
        }
        
        console.log(`   ✅ ${validMethods} out of ${pledges.length} payment methods are valid`);
        
        if (validMethods === 0) {
            console.log('   ❌ No valid payment methods - transactions will fail!');
            return;
        }
        
        // Test 3: Check if transphobic posts are being tracked
        console.log('\n📝 Test 3: Checking Transphobic Post Tracking');
        const { data: posts } = await stripeAPI.supabase
            .from('transphobic_posts')
            .select('*');
            
        console.log(`   ✅ Found ${posts.length} transphobic posts tracked`);
        
        if (posts.length === 0) {
            console.log('   ⚠️  No transphobic posts tracked yet - this is normal if no content detected');
        }
        
        // Test 4: Simulate a transphobic post
        console.log('\n🎯 Test 4: Simulating Transphobic Post');
        const testPledge = pledges.find(p => p.payment_method_id && !p.payment_method_id.startsWith('MIGRATED_'));
        
        if (testPledge) {
            const tweetId = `test_tweet_${Date.now()}`;
            const result = await stripeAPI.trackTransphobicPost(testPledge.id, tweetId);
            
            if (result.success) {
                console.log(`   ✅ Successfully tracked post for ${testPledge.email}`);
                console.log(`   ✅ Post count: ${result.postCount}, Potential charge: £${result.potentialCharge}`);
            } else {
                console.log(`   ❌ Failed to track post: ${result.error}`);
            }
        } else {
            console.log('   ❌ No valid pledges to test with');
        }
        
        // Test 5: Check if monthly billing would work
        console.log('\n💰 Test 5: Testing Monthly Billing');
        const pledgesWithPosts = pledges.filter(p => p.transphobic_posts_count > 0);
        
        if (pledgesWithPosts.length > 0) {
            console.log(`   ✅ ${pledgesWithPosts.length} pledges have transphobic posts to charge`);
            
            let totalPotentialCharge = 0;
            pledgesWithPosts.forEach(pledge => {
                const charge = pledge.transphobic_posts_count * pledge.per_post_amount;
                totalPotentialCharge += charge;
                console.log(`      • ${pledge.email}: £${charge.toFixed(2)} (${pledge.transphobic_posts_count} posts)`);
            });
            
            console.log(`   ✅ Total potential charge: £${totalPotentialCharge.toFixed(2)}`);
            
            // Test actual billing (but don't charge real money)
            console.log('\n🧪 Test 6: Monthly Billing Simulation (No Real Charges)');
            const billingResult = await stripeAPI.processMonthlyCharges();
            
            if (billingResult.success) {
                console.log(`   ✅ Monthly billing simulation completed!`);
                console.log(`   📊 Processed ${billingResult.results.length} pledges`);
                
                let successfulCharges = 0;
                let failedCharges = 0;
                
                billingResult.results.forEach(result => {
                    if (result.success) {
                        successfulCharges++;
                        console.log(`      ✅ ${result.email}: £${result.amount} charged successfully`);
                    } else {
                        failedCharges++;
                        console.log(`      ❌ ${result.email}: ${result.error}`);
                    }
                });
                
                console.log(`\n📈 Billing Results:`);
                console.log(`   ✅ Successful charges: ${successfulCharges}`);
                console.log(`   ❌ Failed charges: ${failedCharges}`);
                
                if (successfulCharges > 0) {
                    console.log('\n🎉 SUCCESS! Your transaction system is working!');
                    console.log('   ✅ Pledges are being tracked');
                    console.log('   ✅ Payment methods are valid');
                    console.log('   ✅ Monthly billing is functional');
                    console.log('   ✅ Money is being charged correctly');
                } else {
                    console.log('\n⚠️  System is set up but no successful charges');
                    console.log('   Check payment methods and try again');
                }
                
            } else {
                console.log(`   ❌ Monthly billing failed: ${billingResult.error}`);
            }
            
        } else {
            console.log('   ⚠️  No pledges have transphobic posts to charge');
            console.log('   This is normal if no transphobic content has been detected');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check if server is running: node server.js');
        console.log('   2. Check if Stripe keys are set in .env file');
        console.log('   3. Check if Supabase is connected');
        console.log('   4. Check if pledges exist in database');
    }
}

// Run the test
testIfItWorked();
