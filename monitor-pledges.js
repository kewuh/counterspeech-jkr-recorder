const StripeAPI = require('./stripe-api');

async function monitorPledges() {
    console.log('📊 Pledge Monitoring Dashboard\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Get overall stats
        console.log('📈 Overall Statistics:');
        const stats = await stripeAPI.getPledgeStats();
        console.log('   Total Pledges:', stats.totalPledges);
        console.log('   Total Monthly Limit:', `£${stats.totalMonthlyLimit}`);
        console.log('   Total Charged:', `£${stats.totalCharged}`);
        console.log('   Available for Charging:', `£${stats.availableForCharging}`);
        
        // Get detailed pledge information
        console.log('\n📋 Detailed Pledge Information:');
        const { data: pledges, error } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.log('❌ Error fetching pledges:', error.message);
            return;
        }
        
        if (pledges.length === 0) {
            console.log('   No active pledges found');
            return;
        }
        
        let totalPotentialCharge = 0;
        let pledgesWithPosts = 0;
        
        pledges.forEach((pledge, index) => {
            const potentialCharge = pledge.transphobic_posts_count * pledge.per_post_amount;
            totalPotentialCharge += potentialCharge;
            
            console.log(`\n   ${index + 1}. ${pledge.email}:`);
            console.log(`      Monthly Limit: £${pledge.monthly_limit}`);
            console.log(`      Per Post Amount: £${pledge.per_post_amount}`);
            console.log(`      Transphobic Posts: ${pledge.transphobic_posts_count || 0}`);
            console.log(`      Potential Charge: £${potentialCharge.toFixed(2)}`);
            console.log(`      Status: ${pledge.status}`);
            console.log(`      Created: ${new Date(pledge.created_at).toLocaleDateString()}`);
            
            if (pledge.transphobic_posts_count > 0) {
                pledgesWithPosts++;
            }
        });
        
        // Summary
        console.log('\n💰 Monthly Billing Summary:');
        console.log(`   Pledges with transphobic posts: ${pledgesWithPosts}`);
        console.log(`   Total potential charge this month: £${totalPotentialCharge.toFixed(2)}`);
        
        if (pledgesWithPosts > 0) {
            console.log('\n🎯 Pledges that will be charged:');
            pledges.forEach(pledge => {
                if (pledge.transphobic_posts_count > 0) {
                    const charge = pledge.transphobic_posts_count * pledge.per_post_amount;
                    console.log(`   • ${pledge.email}: £${charge.toFixed(2)} (${pledge.transphobic_posts_count} posts)`);
                }
            });
        }
        
        // Check recent transphobic posts
        console.log('\n📝 Recent Transphobic Posts:');
        const { data: recentPosts, error: postsError } = await stripeAPI.supabase
            .from('transphobic_posts')
            .select('*, pledges(email)')
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (postsError) {
            console.log('   Error fetching recent posts:', postsError.message);
        } else if (recentPosts.length === 0) {
            console.log('   No transphobic posts tracked yet');
        } else {
            recentPosts.forEach(post => {
                console.log(`   • ${post.pledges?.email || 'Unknown'}: Tweet ${post.tweet_id} (Post #${post.post_number})`);
            });
        }
        
        // Test monthly billing (dry run)
        console.log('\n🧪 Monthly Billing Test (Dry Run):');
        if (pledgesWithPosts > 0) {
            console.log('   Running monthly billing simulation...');
            const billingResult = await stripeAPI.processMonthlyCharges();
            
            if (billingResult.success) {
                console.log(`   ✅ Would process ${billingResult.results.length} pledges`);
                billingResult.results.forEach(result => {
                    if (result.success) {
                        console.log(`   • ${result.email}: £${result.amount} (${result.postCount} posts)`);
                    } else {
                        console.log(`   • ${result.email}: ❌ ${result.error}`);
                    }
                });
            } else {
                console.log(`   ❌ Billing test failed: ${billingResult.error}`);
            }
        } else {
            console.log('   No pledges with transphobic posts to charge');
        }
        
    } catch (error) {
        console.error('❌ Error monitoring pledges:', error.message);
    }
}

// Run the monitoring
monitorPledges();
