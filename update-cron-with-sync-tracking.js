const SupabaseClient = require('./supabase-client');

async function updateCronWithSyncTracking() {
    console.log('🔄 Adding sync tracking to cron job...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Create a simple sync tracking record in the existing jk_rowling_posts table
        // We'll use a special junkipedia_id to track sync times
        const syncData = {
            junkipedia_id: 'sync_tracking_last_run',
            content: 'Last cron job execution time',
            author: 'System',
            platform: 'system',
            post_type: 'sync_tracking',
            created_at: new Date().toISOString(),
            published_at: new Date().toISOString(),
            url: 'system://sync-tracking',
            engagement_metrics: {
                likes: 0,
                retweets: 0,
                replies: 0,
                quotes: 0
            },
            tags: [],
            issues: [],
            raw_data: {
                last_cron_run: new Date().toISOString(),
                job_type: 'cron_new_replies',
                status: 'completed'
            }
        };

        // Check if sync tracking record exists
        const { data: existingSync, error: checkError } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('id, published_at')
            .eq('junkipedia_id', 'sync_tracking_last_run')
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Error checking existing sync record:', checkError.message);
            return;
        }

        if (existingSync) {
            // Update existing sync record
            console.log('📝 Updating existing sync tracking record...');
            const { data: updatedSync, error: updateError } = await supabase.supabase
                .from('jk_rowling_posts')
                .update({
                    published_at: new Date().toISOString(),
                    raw_data: {
                        last_cron_run: new Date().toISOString(),
                        job_type: 'cron_new_replies',
                        status: 'completed'
                    }
                })
                .eq('junkipedia_id', 'sync_tracking_last_run')
                .select()
                .single();

            if (updateError) {
                console.error('❌ Error updating sync record:', updateError.message);
            } else {
                console.log('✅ Sync tracking record updated');
                console.log(`   🕐 Last run: ${updatedSync.published_at}`);
            }
        } else {
            // Create new sync tracking record
            console.log('📝 Creating new sync tracking record...');
            const { data: newSync, error: insertError } = await supabase.supabase
                .from('jk_rowling_posts')
                .insert([syncData])
                .select()
                .single();

            if (insertError) {
                console.error('❌ Error creating sync record:', insertError.message);
            } else {
                console.log('✅ Sync tracking record created');
                console.log(`   🕐 Last run: ${newSync.published_at}`);
            }
        }

    } catch (error) {
        console.error('❌ Error updating cron with sync tracking:', error.message);
    }
}

updateCronWithSyncTracking().catch(console.error);
