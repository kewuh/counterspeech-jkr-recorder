const SupabaseClient = require('./supabase-client');

async function checkCurrentSync() {
    console.log('🔍 Checking current sync tracking data...');
    
    const supabase = new SupabaseClient();
    
    try {
        const { data: syncRecord, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('published_at, raw_data')
            .eq('junkipedia_id', 'sync_tracking_last_run')
            .single();

        if (error || !syncRecord) {
            console.log('❌ No sync record found');
            return;
        }

        console.log('📊 Current sync record:');
        console.log(`   Published at: ${syncRecord.published_at}`);
        console.log(`   Raw data: ${JSON.stringify(syncRecord.raw_data, null, 2)}`);
        
        const lastSyncTime = syncRecord.raw_data?.last_cron_run || syncRecord.published_at;
        console.log(`\n🎯 Last cron run: ${lastSyncTime}`);
        
        const now = new Date();
        console.log(`🕐 Current time: ${now.toISOString()}`);
        
        const timeDiff = now - new Date(lastSyncTime);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        console.log(`⏱️ Time since last cron: ${hoursDiff.toFixed(2)} hours`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkCurrentSync().catch(console.error);
