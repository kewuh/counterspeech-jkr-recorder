const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

async function checkPledges() {
    try {
        console.log('🔍 Checking pledges table...');
        
        // Get all pledges
        const { data: pledges, error } = await supabase
            .from('pledges')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ Error fetching pledges:', error);
            return;
        }
        
        console.log(`📊 Found ${pledges.length} total pledges`);
        
        if (pledges.length > 0) {
            console.log('\n📋 Recent pledges:');
            pledges.slice(0, 5).forEach((pledge, index) => {
                console.log(`${index + 1}. ${pledge.email || 'No email'} - £${pledge.monthly_limit} cap, ${pledge.per_post_amount * 100}p per post`);
                console.log(`   Public: ${pledge.public_pledge ? 'YES' : 'NO'}`);
                console.log(`   Name: ${pledge.name || 'Not provided'}`);
                console.log(`   Created: ${new Date(pledge.created_at).toLocaleString()}`);
                console.log('');
            });
        }
        
        // Check specifically for public pledges
        const { data: publicPledges, error: publicError } = await supabase
            .from('pledges')
            .select('*')
            .eq('public_pledge', true)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
            
        if (publicError) {
            console.error('❌ Error fetching public pledges:', publicError);
            return;
        }
        
        console.log(`👥 Found ${publicPledges.length} public pledges`);
        
        if (publicPledges.length > 0) {
            console.log('\n✅ Public pledges that should show up:');
            publicPledges.forEach((pledge, index) => {
                console.log(`${index + 1}. ${pledge.name || 'Anonymous'} - £${pledge.monthly_limit} cap, ${pledge.per_post_amount * 100}p per post`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPledges();
