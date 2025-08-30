const StripeAPI = require('./stripe-api');

async function fixPaymentMethods() {
    console.log('🔧 Fixing Payment Method Issues\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Get all active pledges
        const { data: pledges } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active');
            
        console.log(`📋 Found ${pledges.length} active pledges\n`);
        
        let validMethods = 0;
        let invalidMethods = 0;
        let missingMethods = 0;
        
        const invalidPledges = [];
        
        for (const pledge of pledges) {
            console.log(`🔍 Checking pledge: ${pledge.email}`);
            
            if (!pledge.payment_method_id) {
                console.log(`   ❌ Missing payment method ID`);
                missingMethods++;
                invalidPledges.push({
                    ...pledge,
                    issue: 'Missing payment method ID'
                });
            } else if (pledge.payment_method_id.startsWith('MIGRATED_')) {
                console.log(`   ⚠️  Migrated placeholder payment method`);
                invalidMethods++;
                invalidPledges.push({
                    ...pledge,
                    issue: 'Migrated placeholder - needs real payment method'
                });
            } else {
                try {
                    const paymentMethod = await stripeAPI.stripe.paymentMethods.retrieve(pledge.payment_method_id);
                    console.log(`   ✅ Valid payment method: ${paymentMethod.card.brand} ending in ${paymentMethod.card.last4}`);
                    validMethods++;
                } catch (error) {
                    console.log(`   ❌ Invalid payment method: ${error.message}`);
                    invalidMethods++;
                    invalidPledges.push({
                        ...pledge,
                        issue: 'Invalid payment method'
                    });
                }
            }
        }
        
        console.log(`\n📊 Payment Method Summary:`);
        console.log(`   ✅ Valid: ${validMethods}`);
        console.log(`   ❌ Invalid: ${invalidMethods}`);
        console.log(`   ❌ Missing: ${missingMethods}`);
        
        if (invalidPledges.length > 0) {
            console.log(`\n🚨 PLEDGES THAT NEED FIXING:`);
            invalidPledges.forEach((pledge, index) => {
                console.log(`\n${index + 1}. ${pledge.email}`);
                console.log(`   Issue: ${pledge.issue}`);
                console.log(`   Monthly Limit: £${pledge.monthly_limit}`);
                console.log(`   Per Post Amount: £${pledge.per_post_amount}`);
                console.log(`   Posts Count: ${pledge.transphobic_posts_count}`);
                console.log(`   Created: ${pledge.created_at}`);
            });
            
            console.log(`\n🔧 HOW TO FIX:`);
            console.log(`\nOption 1: Contact Customers (Recommended)`);
            console.log(`   • Email each customer asking them to update their payment method`);
            console.log(`   • Provide a link to update their pledge`);
            console.log(`   • Or ask them to create a new pledge`);
            
            console.log(`\nOption 2: Create New Test Pledges`);
            console.log(`   • Go to http://localhost:3000/pledge`);
            console.log(`   • Create new pledges with valid test cards`);
            console.log(`   • Use Stripe test cards: 4242 4242 4242 4242`);
            
            console.log(`\nOption 3: Delete Invalid Pledges`);
            console.log(`   • Run this SQL in Supabase:`);
            console.log(`   DELETE FROM pledges WHERE payment_method_id IS NULL OR payment_method_id LIKE 'MIGRATED_%';`);
            
            console.log(`\nOption 4: Update Minimum Charge Amounts`);
            console.log(`   • Increase per_post_amount to at least £0.30`);
            console.log(`   • Run this SQL in Supabase:`);
            console.log(`   UPDATE pledges SET per_post_amount = 0.30 WHERE per_post_amount < 0.30;`);
            
        } else {
            console.log(`\n🎉 All payment methods are valid!`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the fix
fixPaymentMethods();
