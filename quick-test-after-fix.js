const StripeAPI = require('./stripe-api');

async function quickTestAfterFix() {
    console.log('🧪 Quick Test After Fixes\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Check pledges
        const stats = await stripeAPI.getPledgeStats();
        console.log(`📊 Pledges: ${stats.totalPledges}, Monthly Limit: £${stats.totalMonthlyLimit}`);
        
        // Check payment methods
        const { data: pledges } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active');
            
        let validMethods = 0;
        for (const pledge of pledges) {
            if (pledge.payment_method_id) {
                try {
                    await stripeAPI.stripe.paymentMethods.retrieve(pledge.payment_method_id);
                    validMethods++;
                } catch (error) {
                    // Invalid
                }
            }
        }
        
        console.log(`💳 Valid Payment Methods: ${validMethods}/${pledges.length}`);
        
        // Check minimum amounts
        const lowAmounts = pledges.filter(p => p.per_post_amount < 0.30);
        console.log(`💰 Pledges below £0.30: ${lowAmounts.length}`);
        
        if (validMethods === pledges.length && lowAmounts.length === 0) {
            console.log('\n🎉 ALL FIXES APPLIED SUCCESSFULLY!');
            console.log('✅ Ready to test monthly billing');
            
            // Test monthly billing
            const billingResult = await stripeAPI.processMonthlyCharges();
            if (billingResult.success) {
                const successful = billingResult.results.filter(r => r.success).length;
                console.log(`✅ Monthly billing: ${successful}/${billingResult.results.length} successful`);
            }
        } else {
            console.log('\n⚠️  Still need to apply fixes');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTestAfterFix();
