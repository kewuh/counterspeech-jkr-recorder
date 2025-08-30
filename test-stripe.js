const StripeAPI = require('./stripe-api');

async function testStripeIntegration() {
    console.log('🧪 Testing Stripe Integration...\n');
    
    const stripeAPI = new StripeAPI();
    
    try {
        // Test 1: Get pledge stats
        console.log('1. Testing pledge stats...');
        const stats = await stripeAPI.getPledgeStats();
        console.log('✅ Pledge stats:', stats);
        
        // Test 2: Create a test pledge (commented out to avoid charges)
        console.log('\n2. Testing pledge creation (simulated)...');
        console.log('⚠️  Pledge creation test skipped - requires real Stripe keys');
        console.log('   To test: Add your Stripe keys to .env and uncomment the test');
        
        // Uncomment this when you have real Stripe keys:
        /*
        const testPledge = await stripeAPI.createPledge({
            email: 'test@example.com',
            monthlyLimit: 25,
            perPostAmount: 2,
            organization: 'mermaids',
            paymentMethodId: 'pm_test_...' // You'll need a real payment method ID
        });
        console.log('✅ Test pledge created:', testPledge);
        */
        
        console.log('\n🎉 Stripe integration test completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Add your Stripe keys to .env file');
        console.log('2. Create the database tables using create-pledge-tables.sql');
        console.log('3. Test with real payment methods');
        console.log('4. Set up webhooks for production');
        
    } catch (error) {
        console.error('❌ Error testing Stripe integration:', error.message);
    }
}

// Run the test
testStripeIntegration();
