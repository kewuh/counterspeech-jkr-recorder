const SupabaseClient = require('./supabase-client');

async function initReplyContexts() {
    console.log('🔧 Initializing reply contexts table...');
    
    const supabase = new SupabaseClient();
    
    try {
        await supabase.initializeReplyContextsTable();
        console.log('✅ Reply contexts table initialization complete');
    } catch (error) {
        console.error('❌ Error initializing reply contexts table:', error);
    }
}

initReplyContexts().catch(console.error);
