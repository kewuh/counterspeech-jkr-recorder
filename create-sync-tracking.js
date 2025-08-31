const SupabaseClient = require('./supabase-client');

async function createSyncTracking() {
    console.log('🔄 Setting up sync tracking...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Create a sync_logs table to track when cron jobs run
        console.log('📋 Creating sync_logs table...');
        
        // First, let's check if the table exists by trying to insert a record
        const syncData = {
            job_type: 'cron_new_replies',
            status: 'completed',
            started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
            completed_at: new Date().toISOString(),
            posts_processed: 0,
            reposts_processed: 0,
            replies_processed: 0,
            articles_analyzed: 0,
            errors: []
        };

        const { data: syncLog, error } = await supabase.supabase
            .from('sync_logs')
            .insert([syncData])
            .select()
            .single();

        if (error) {
            console.log('❌ sync_logs table does not exist or has different schema');
            console.log('Error:', error.message);
            
            // Create the table using SQL
            console.log('\n📋 Creating sync_logs table with SQL...');
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS sync_logs (
                    id SERIAL PRIMARY KEY,
                    job_type VARCHAR(50) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    posts_processed INTEGER DEFAULT 0,
                    reposts_processed INTEGER DEFAULT 0,
                    replies_processed INTEGER DEFAULT 0,
                    articles_analyzed INTEGER DEFAULT 0,
                    errors JSONB DEFAULT '[]',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `;
            
            const { error: createError } = await supabase.supabase.rpc('exec_sql', { sql: createTableSQL });
            
            if (createError) {
                console.log('❌ Could not create table via RPC, trying direct insert again...');
                // Try the insert again
                const { data: retryLog, error: retryError } = await supabase.supabase
                    .from('sync_logs')
                    .insert([syncData])
                    .select()
                    .single();
                    
                if (retryError) {
                    console.error('❌ Still cannot create sync_logs table:', retryError.message);
                    return;
                } else {
                    console.log('✅ sync_logs table created and initial record inserted');
                }
            } else {
                console.log('✅ sync_logs table created successfully');
                
                // Insert the initial record
                const { data: initialLog, error: insertError } = await supabase.supabase
                    .from('sync_logs')
                    .insert([syncData])
                    .select()
                    .single();
                    
                if (insertError) {
                    console.error('❌ Error inserting initial sync log:', insertError.message);
                } else {
                    console.log('✅ Initial sync log created');
                }
            }
        } else {
            console.log('✅ sync_logs table exists and initial record inserted');
        }

        // Get the latest sync log
        const { data: latestSync, error: latestError } = await supabase.supabase
            .from('sync_logs')
            .select('*')
            .eq('job_type', 'cron_new_replies')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        if (latestError) {
            console.error('❌ Error fetching latest sync log:', latestError.message);
        } else if (latestSync) {
            console.log('\n📊 Latest sync log:');
            console.log(`   🕐 Completed: ${latestSync.completed_at}`);
            console.log(`   📊 Status: ${latestSync.status}`);
            console.log(`   📝 Posts processed: ${latestSync.posts_processed}`);
            console.log(`   🔄 Reposts processed: ${latestSync.reposts_processed}`);
            console.log(`   💬 Replies processed: ${latestSync.replies_processed}`);
            console.log(`   📄 Articles analyzed: ${latestSync.articles_analyzed}`);
        }

    } catch (error) {
        console.error('❌ Error setting up sync tracking:', error.message);
    }
}

createSyncTracking().catch(console.error);
