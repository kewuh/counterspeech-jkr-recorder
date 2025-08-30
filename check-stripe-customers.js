const StripeAPI = require('./stripe-api');

async function checkStripeCustomers() {
    console.log('🔍 Checking Stripe Customers and Payments\n');
    
    const stripeAPI = new StripeAPI();
    
    if (!stripeAPI.stripe) {
        console.log('❌ Stripe not initialized');
        return;
    }
    
    try {
        // List all customers
        console.log('📋 Listing all customers...');
        const customers = await stripeAPI.stripe.customers.list({
            limit: 20
        });
        
        console.log(`✅ Found ${customers.data.length} customers:\n`);
        
        for (const customer of customers.data) {
            console.log(`👤 Customer: ${customer.email}`);
            console.log(`   ID: ${customer.id}`);
            console.log(`   Created: ${new Date(customer.created * 1000).toLocaleString()}`);
            
            // Get payment methods for this customer
            const paymentMethods = await stripeAPI.stripe.paymentMethods.list({
                customer: customer.id,
                type: 'card'
            });
            
            console.log(`   💳 Payment Methods: ${paymentMethods.data.length}`);
            
            // Get payment intents for this customer
            const paymentIntents = await stripeAPI.stripe.paymentIntents.list({
                customer: customer.id,
                limit: 10
            });
            
            console.log(`   💰 Payment Intents: ${paymentIntents.data.length}`);
            
            for (const intent of paymentIntents.data) {
                console.log(`      - Amount: £${(intent.amount / 100).toFixed(2)}`);
                console.log(`        Status: ${intent.status}`);
                console.log(`        Created: ${new Date(intent.created * 1000).toLocaleString()}`);
                if (intent.metadata.pledge_type) {
                    console.log(`        Type: ${intent.metadata.pledge_type}`);
                }
            }
            
            console.log(''); // Empty line for readability
        }
        
        // Check database pledges
        console.log('🗄️  Checking database pledges...');
        const stats = await stripeAPI.getPledgeStats();
        console.log('📊 Database Stats:', stats);
        
        if (stripeAPI.supabase) {
            const { data: pledges, error } = await stripeAPI.supabase
                .from('pledges')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) {
                console.log('❌ Error fetching pledges:', error);
            } else {
                console.log(`\n📋 Found ${pledges.length} pledges in database:`);
                pledges.forEach(pledge => {
                    console.log(`   - ${pledge.email}: £${pledge.monthly_limit} limit, £${pledge.per_post_amount} per post`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking customers:', error.message);
    }
}

// Run the check
checkStripeCustomers();
