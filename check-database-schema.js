const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

async function checkDatabaseSchema() {
    console.log('🔍 Checking Database Schema...\n');
    
    if (!config.supabase || !config.supabase.url || !config.supabase.anonKey) {
        console.log('❌ Supabase not configured');
        return;
    }
    
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
        // Try to select from pledges table to see what columns exist
        console.log('📋 Checking pledges table structure...');
        const { data: pledges, error } = await supabase
            .from('pledges')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Error accessing pledges table:', error.message);
            
            if (error.message.includes('setup_intent_id')) {
                console.log('\n💡 Missing setup_intent_id column!');
                console.log('   Run this SQL in your Supabase dashboard:');
                console.log('   ALTER TABLE pledges ADD COLUMN IF NOT EXISTS setup_intent_id VARCHAR;');
            }
            
            if (error.message.includes('transphobic_posts_count')) {
                console.log('\n💡 Missing transphobic_posts_count column!');
                console.log('   Run this SQL in your Supabase dashboard:');
                console.log('   ALTER TABLE pledges ADD COLUMN IF NOT EXISTS transphobic_posts_count INTEGER DEFAULT 0;');
            }
            
            if (error.message.includes('last_transphobic_post_date')) {
                console.log('\n💡 Missing last_transphobic_post_date column!');
                console.log('   Run this SQL in your Supabase dashboard:');
                console.log('   ALTER TABLE pledges ADD COLUMN IF NOT EXISTS last_transphobic_post_date TIMESTAMP WITH TIME ZONE;');
            }
            
        } else {
            console.log('✅ Pledges table is accessible');
            if (pledges && pledges.length > 0) {
                const pledge = pledges[0];
                console.log('📊 Available columns:');
                Object.keys(pledge).forEach(key => {
                    console.log(`   - ${key}: ${typeof pledge[key]}`);
                });
            }
        }
        
        // Check if transphobic_posts table exists
        console.log('\n📋 Checking transphobic_posts table...');
        const { data: transphobicPosts, error: tpError } = await supabase
            .from('transphobic_posts')
            .select('*')
            .limit(1);
            
        if (tpError) {
            console.log('❌ transphobic_posts table does not exist or is not accessible');
            console.log('   Run this SQL in your Supabase dashboard:');
            console.log(`
                CREATE TABLE IF NOT EXISTS transphobic_posts (
                    id SERIAL PRIMARY KEY,
                    pledge_id INTEGER REFERENCES pledges(id),
                    tweet_id VARCHAR NOT NULL,
                    post_number INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `);
        } else {
            console.log('✅ transphobic_posts table exists');
        }
        
    } catch (error) {
        console.error('❌ Error checking schema:', error.message);
    }
}

// Run the check
checkDatabaseSchema();
