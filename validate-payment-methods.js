const StripeAPI = require('./stripe-api');

async function validatePaymentMethods() {
    console.log('💳 Payment Method Validation & Management\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Get all active pledges
        const { data: pledges, error } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active');
            
        if (error || !pledges || pledges.length === 0) {
            console.log('❌ No active pledges found');
            return;
        }
        
        console.log(`📋 Found ${pledges.length} active pledges\n`);
        
        let validMethods = 0;
        let invalidMethods = 0;
        let needsUpdate = 0;
        
        for (const pledge of pledges) {
            console.log(`🔍 Checking: ${pledge.email}`);
            
            try {
                if (!pledge.payment_method_id || pledge.payment_method_id.startsWith('MIGRATED_')) {
                    console.log(`   ⚠️  Payment method needs update (migrated or missing)`);
                    needsUpdate++;
                    continue;
                }
                
                // Test payment method validity
                const paymentMethod = await stripeAPI.stripe.paymentMethods.retrieve(pledge.payment_method_id);
                
                if (paymentMethod && paymentMethod.card) {
                    console.log(`   ✅ Valid: ${paymentMethod.card.brand} ending in ${paymentMethod.card.last4}`);
                    console.log(`      Expires: ${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`);
                    validMethods++;
                } else {
                    console.log(`   ❌ Invalid payment method`);
                    invalidMethods++;
                }
                
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                invalidMethods++;
            }
            
            console.log(''); // Empty line for readability
        }
        
        // Summary
        console.log('📊 Payment Method Summary:');
        console.log(`   ✅ Valid methods: ${validMethods}`);
        console.log(`   ❌ Invalid methods: ${invalidMethods}`);
        console.log(`   ⚠️  Need update: ${needsUpdate}`);
        console.log(`   📈 Success rate: ${((validMethods / pledges.length) * 100).toFixed(1)}%`);
        
        // Recommendations
        console.log('\n🎯 Recommendations:');
        
        if (invalidMethods > 0) {
            console.log(`   ❌ ${invalidMethods} pledges have invalid payment methods`);
            console.log('   💡 Contact these customers to update their payment methods');
        }
        
        if (needsUpdate > 0) {
            console.log(`   ⚠️  ${needsUpdate} pledges need payment method updates`);
            console.log('   💡 These are from the old system and need new payment methods');
        }
        
        if (validMethods === pledges.length) {
            console.log('   ✅ All payment methods are valid!');
        }
        
        // Monthly billing readiness
        console.log('\n💰 Monthly Billing Readiness:');
        const readyForBilling = validMethods;
        const notReady = invalidMethods + needsUpdate;
        
        console.log(`   ✅ Ready for billing: ${readyForBilling} pledges`);
        console.log(`   ❌ Not ready: ${notReady} pledges`);
        
        if (notReady > 0) {
            console.log('   ⚠️  Fix payment methods before running monthly billing');
        } else {
            console.log('   ✅ All pledges are ready for monthly billing');
        }
        
    } catch (error) {
        console.error('❌ Error validating payment methods:', error.message);
    }
}

// Run the validation
validatePaymentMethods();
