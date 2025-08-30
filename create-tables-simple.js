const SupabaseClient = require('./supabase-client');

async function createTables() {
    const supabase = new SupabaseClient();
    
    try {
        console.log('🔧 Creating database tables...');
        
        // Create reply_contexts table
        console.log('📋 Creating reply_contexts table...');
        const { error: replyContextsError } = await supabase.supabase
            .from('reply_contexts')
            .select('*')
            .limit(1);
        
        if (replyContextsError && replyContextsError.message.includes('relation "reply_contexts" does not exist')) {
            console.log('❌ reply_contexts table does not exist - you need to create it manually');
            console.log('📝 Please run the SQL in create-reply-contexts-table.sql in your Supabase dashboard');
        } else if (replyContextsError) {
            console.error('❌ Error checking reply_contexts table:', replyContextsError.message);
        } else {
            console.log('✅ reply_contexts table already exists');
        }
        
        // Create reply_analysis table
        console.log('📋 Creating reply_analysis table...');
        const { error: replyAnalysisError } = await supabase.supabase
            .from('reply_analysis')
            .select('*')
            .limit(1);
        
        if (replyAnalysisError && replyAnalysisError.message.includes('relation "reply_analysis" does not exist')) {
            console.log('❌ reply_analysis table does not exist - you need to create it manually');
            console.log('📝 Please run the SQL in create-reply-analysis-table.sql in your Supabase dashboard');
        } else if (replyAnalysisError) {
            console.error('❌ Error checking reply_analysis table:', replyAnalysisError.message);
        } else {
            console.log('✅ reply_analysis table already exists');
        }
        
        console.log('\n📋 To create the tables manually:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of create-reply-contexts-table.sql');
        console.log('4. Run the contents of create-reply-analysis-table.sql');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
}

createTables();
