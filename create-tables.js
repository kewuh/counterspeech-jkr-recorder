const SupabaseClient = require('./supabase-client');
const fs = require('fs');

async function createTables() {
    const supabase = new SupabaseClient();
    
    try {
        console.log('🔧 Creating database tables...');
        
        // Read the SQL files
        const replyContextsSQL = fs.readFileSync('create-reply-contexts-table.sql', 'utf8');
        const replyAnalysisSQL = fs.readFileSync('create-reply-analysis-table.sql', 'utf8');
        
        // Create reply_contexts table
        console.log('📋 Creating reply_contexts table...');
        const { error: replyContextsError } = await supabase.supabase.rpc('exec_sql', {
            sql: replyContextsSQL
        });
        
        if (replyContextsError) {
            console.error('❌ Error creating reply_contexts table:', replyContextsError.message);
        } else {
            console.log('✅ reply_contexts table created successfully');
        }
        
        // Create reply_analysis table
        console.log('📋 Creating reply_analysis table...');
        const { error: replyAnalysisError } = await supabase.supabase.rpc('exec_sql', {
            sql: replyAnalysisSQL
        });
        
        if (replyAnalysisError) {
            console.error('❌ Error creating reply_analysis table:', replyAnalysisError.message);
        } else {
            console.log('✅ reply_analysis table created successfully');
        }
        
        console.log('🎉 All tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    }
}

createTables();
