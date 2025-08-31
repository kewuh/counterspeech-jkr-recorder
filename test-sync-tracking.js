const SupabaseClient = require('./supabase-client');

async function testSyncTracking() {
    console.log('🧪 Testing sync tracking functionality...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Get the sync tracking record
        const { data: syncRecord, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', 'sync_tracking_last_run')
            .single();

        if (error) {
            console.error('❌ Error fetching sync record:', error.message);
            return;
        }

        if (syncRecord) {
            console.log('✅ Sync tracking record found:');
            console.log(`   🆔 ID: ${syncRecord.id}`);
            console.log(`   📝 Content: ${syncRecord.content}`);
            console.log(`   🏷️  Post Type: ${syncRecord.post_type}`);
            console.log(`   📅 Published: ${syncRecord.published_at}`);
            
            if (syncRecord.raw_data) {
                console.log('\n📊 Raw data:');
                console.log(`   🕐 Last cron run: ${syncRecord.raw_data.last_cron_run}`);
                console.log(`   📋 Job type: ${syncRecord.raw_data.job_type}`);
                console.log(`   ✅ Status: ${syncRecord.raw_data.status}`);
                
                if (syncRecord.raw_data.start_time && syncRecord.raw_data.end_time) {
                    console.log(`   🕐 Start time: ${syncRecord.raw_data.start_time}`);
                    console.log(`   🕐 End time: ${syncRecord.raw_data.end_time}`);
                    console.log(`   ⏱️  Duration: ${syncRecord.raw_data.duration_ms}ms`);
                }
            }

            // Test the frontend logic
            console.log('\n🧪 Testing frontend logic...');
            const lastSyncTime = syncRecord.raw_data?.last_cron_run || syncRecord.published_at;
            console.log(`   📅 Last sync time: ${lastSyncTime}`);
            
            const syncDate = new Date(lastSyncTime);
            console.log(`   📅 Formatted: ${syncDate.toLocaleString()}`);
            
            // Calculate time since last sync
            const now = new Date();
            const timeSinceSync = now.getTime() - syncDate.getTime();
            const minutesSinceSync = Math.floor(timeSinceSync / (1000 * 60));
            
            console.log(`   ⏰ Time since last sync: ${minutesSinceSync} minutes ago`);
            
        } else {
            console.log('❌ No sync tracking record found');
        }

    } catch (error) {
        console.error('❌ Error testing sync tracking:', error.message);
    }
}

testSyncTracking().catch(console.error);
