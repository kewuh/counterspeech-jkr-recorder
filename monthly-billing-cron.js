const StripeAPI = require('./stripe-api');

async function processMonthlyBilling() {
    console.log('💰 Processing Monthly Billing...\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Process monthly charges for all pledges
        const result = await stripeAPI.processMonthlyCharges();
        
        if (result.success) {
            console.log(`✅ Monthly billing completed successfully!`);
            console.log(`📊 Processed ${result.results.length} pledges:\n`);
            
            let totalCharged = 0;
            let successfulCharges = 0;
            let failedCharges = 0;
            
            result.results.forEach(charge => {
                if (charge.success) {
                    console.log(`✅ ${charge.email}: £${charge.amount} (${charge.postCount} posts)`);
                    totalCharged += charge.amount;
                    successfulCharges++;
                } else {
                    console.log(`❌ ${charge.email}: ${charge.error}`);
                    failedCharges++;
                }
            });
            
            console.log(`\n📈 Summary:`);
            console.log(`   Total charged: £${totalCharged.toFixed(2)}`);
            console.log(`   Successful charges: ${successfulCharges}`);
            console.log(`   Failed charges: ${failedCharges}`);
            
        } else {
            console.log(`❌ Monthly billing failed: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Error in monthly billing:', error.message);
    }
}

// Run the monthly billing
processMonthlyBilling();
