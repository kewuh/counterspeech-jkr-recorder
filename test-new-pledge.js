const StripeAPI = require('./stripe-api');

async function testNewPledge() {
    console.log('🧪 Testing New Pledge Creation\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Test creating a new pledge with the updated system
        console.log('📝 Testing new pledge creation...');
        
        const testPledgeData = {
            email: 'test-monthly@example.com',
            monthlyLimit: 25,
            perPostAmount: 0.50,
            paymentMethodId: 'pm_test_1234567890' // Mock payment method ID
        };
        
        const result = await stripeAPI.createPledge(testPledgeData);
        
        if (result.success) {
            console.log('✅ New pledge creation test passed!');
            console.log('   Pledge ID:', result.pledgeId);
            console.log('   Customer ID:', result.customerId);
            console.log('   Setup Intent ID:', result.setupIntentId);
            
            // Check the database to verify the pledge was created correctly
            const { data: pledges, error } = await stripeAPI.supabase
                .from('pledges')
                .select('*')
                .eq('id', result.pledgeId)
                .single();
                
            if (error) {
                console.log('❌ Error fetching pledge from database:', error.message);
            } else {
                console.log('\n📊 Database verification:');
                console.log('   Email:', pledges.email);
                console.log('   Monthly Limit:', pledges.monthly_limit);
                console.log('   Per Post Amount:', pledges.per_post_amount);
                console.log('   Setup Intent ID:', pledges.setup_intent_id);
                console.log('   Payment Method ID:', pledges.payment_method_id);
                console.log('   Transphobic Posts Count:', pledges.transphobic_posts_count);
                console.log('   Status:', pledges.status);
            }
            
        } else {
            console.log('❌ New pledge creation failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Check if it's still a database constraint error
        if (error.message.includes('payment_intent_id') || error.message.includes('null value')) {
            console.log('\n💡 Database constraint issue still exists.');
            console.log('   Make sure you ran the SQL to fix constraints:');
            console.log('   ALTER TABLE pledges ALTER COLUMN payment_intent_id DROP NOT NULL;');
        }
    }
}

// Run the test
testNewPledge();
