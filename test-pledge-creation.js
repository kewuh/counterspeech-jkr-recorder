const StripeAPI = require('./stripe-api');

async function testPledgeCreation() {
    console.log('🧪 Testing Pledge Creation\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Test creating a pledge
        console.log('📝 Testing pledge creation...');
        
        const testPledgeData = {
            email: 'test@example.com',
            monthlyLimit: 25,
            perPostAmount: 0.50,
            paymentMethodId: 'pm_test_1234567890' // Mock payment method ID
        };
        
        const result = await stripeAPI.createPledge(testPledgeData);
        
        if (result.success) {
            console.log('✅ Pledge creation test passed!');
            console.log('   Pledge ID:', result.pledgeId);
            console.log('   Customer ID:', result.customerId);
            console.log('   Payment Intent ID:', result.paymentIntentId);
        } else {
            console.log('❌ Pledge creation failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Check if it's the schema error
        if (error.message.includes('payment_method_id')) {
            console.log('\n💡 The payment_method_id column is still missing.');
            console.log('   Please run this SQL in your Supabase dashboard:');
            console.log('   ALTER TABLE pledges ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR;');
        }
    }
}

// Run the test
testPledgeCreation();
