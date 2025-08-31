const SupabaseClient = require('./supabase-client');

async function testFrontendSync() {
    console.log('🧪 Testing frontend sync logic...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Simulate the frontend getLastSyncTime function
        console.log('🔍 Testing getLastSyncTime function...');
        
        if (!supabase.supabase) {
            console.log('❌ Supabase client not initialized');
            return;
        }

        const { data: syncRecord, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('published_at, raw_data')
            .eq('junkipedia_id', 'sync_tracking_last_run')
            .single();

        if (error || !syncRecord) {
            console.log('❌ No sync record found or error:', error?.message);
            return;
        }

        // Test the frontend logic
        const lastSyncTime = syncRecord.raw_data?.last_cron_run || syncRecord.published_at;
        console.log('✅ Sync record found:');
        console.log(`   📅 Last sync time: ${lastSyncTime}`);
        
        if (lastSyncTime) {
            const syncDate = new Date(lastSyncTime);
            console.log(`   📅 Parsed date: ${syncDate.toISOString()}`);
            
            // Test the formatDateTime function
            const formatted = formatDateTime(syncDate);
            console.log(`   🕐 Formatted: ${formatted}`);
            
            // Test what the frontend should display
            console.log('\n🎯 Frontend should display:');
            console.log(`   Last Sync: ${formatted}`);
            
            // Compare with current time
            const now = new Date();
            const currentFormatted = formatDateTime(now);
            console.log(`   Current time: ${currentFormatted}`);
            
            if (formatted !== currentFormatted) {
                console.log('✅ SUCCESS: Frontend should show cron time, not current time!');
            } else {
                console.log('⚠️ WARNING: Frontend might be showing current time instead of cron time');
            }
        }

    } catch (error) {
        console.error('❌ Error testing frontend sync:', error.message);
    }
}

// Copy the formatDateTime function from the frontend
function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

testFrontendSync().catch(console.error);
