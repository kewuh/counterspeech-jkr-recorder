const SupabaseClient = require('./supabase-client');

async function debugSyncFrontend() {
    console.log('🔍 Debugging frontend sync reading...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Simulate the frontend getLastSyncTime function
        console.log('🧪 Testing getLastSyncTime logic...');
        
        const { data: syncRecord, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('published_at, raw_data')
            .eq('junkipedia_id', 'sync_tracking_last_run')
            .single();

        console.log('📊 Database query result:');
        console.log(`   Error: ${error ? error.message : 'None'}`);
        console.log(`   Record found: ${!!syncRecord}`);
        
        if (syncRecord) {
            console.log(`   Published at: ${syncRecord.published_at}`);
            console.log(`   Raw data: ${JSON.stringify(syncRecord.raw_data, null, 2)}`);
            
            // Test the frontend logic
            const lastSyncTime = syncRecord.raw_data?.last_cron_run || syncRecord.published_at;
            console.log(`\n🎯 Frontend logic result:`);
            console.log(`   Last sync time: ${lastSyncTime}`);
            
            if (lastSyncTime) {
                const syncDate = new Date(lastSyncTime);
                console.log(`   Formatted date: ${syncDate.toLocaleString()}`);
                
                // Test the formatDateTime function
                const formatted = formatDateTime(syncDate);
                console.log(`   formatDateTime result: ${formatted}`);
            }
        } else {
            console.log('❌ No sync record found - this would cause fallback to current time');
        }

    } catch (error) {
        console.error('❌ Error in debug:', error.message);
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

debugSyncFrontend().catch(console.error);
