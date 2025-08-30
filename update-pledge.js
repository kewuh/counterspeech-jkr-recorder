const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

async function updatePledge() {
    try {
        console.log('🔍 Finding your recent pledge...');
        
        // Find the most recent pledge for your email
        const { data: pledges, error } = await supabase
            .from('pledges')
            .select('*')
            .eq('email', 'david.william.norton@gmail.com')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (error) {
            console.error('❌ Error fetching pledge:', error);
            return;
        }
        
        if (!pledges || pledges.length === 0) {
            console.log('❌ No pledge found for your email');
            return;
        }
        
        const pledge = pledges[0];
        console.log(`📋 Found pledge ID: ${pledge.id}`);
        console.log(`   Current name: ${pledge.name || 'Not set'}`);
        console.log(`   Current public: ${pledge.public_pledge || false}`);
        
        // Update the pledge
        const { data: updatedPledge, error: updateError } = await supabase
            .from('pledges')
            .update({
                name: 'David',
                public_pledge: true
            })
            .eq('id', pledge.id)
            .select();
            
        if (updateError) {
            console.error('❌ Error updating pledge:', updateError);
            return;
        }
        
        console.log('✅ Pledge updated successfully!');
        console.log(`   New name: ${updatedPledge[0].name}`);
        console.log(`   New public: ${updatedPledge[0].public_pledge}`);
        
        // Test the public pledgers endpoint
        console.log('\n🔍 Testing public pledgers endpoint...');
        const response = await fetch('http://localhost:3000/api/recent-public-pledgers');
        const result = await response.json();
        
        if (result.success && result.pledgers.length > 0) {
            console.log('✅ Public pledgers endpoint working!');
            result.pledgers.forEach((pledger, index) => {
                console.log(`${index + 1}. ${pledger.name} - £${pledger.monthlyLimit} cap, ${pledger.perPostAmount * 100}p per post`);
            });
        } else {
            console.log('❌ No public pledgers found or endpoint error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updatePledge();
