const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkSchema() {
    try {
        console.log('🔍 Checking tweet_analysis table schema...');
        
        // Try to get a sample record to see the structure
        const { data: sample, error } = await supabase
            .from('tweet_analysis')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Error:', error.message);
            return;
        }
        
        if (sample && sample.length > 0) {
            console.log('✅ Sample record found. Available columns:');
            const columns = Object.keys(sample[0]);
            columns.forEach(col => {
                console.log(`   - ${col}: ${typeof sample[0][col]}`);
            });
        } else {
            console.log('❌ No sample records found');
        }
        
        // Also check reply_contexts table
        console.log('\n🔍 Checking reply_contexts table schema...');
        const { data: contextSample, error: contextError } = await supabase
            .from('reply_contexts')
            .select('*')
            .limit(1);
        
        if (contextError) {
            console.log('❌ Error with reply_contexts:', contextError.message);
        } else if (contextSample && contextSample.length > 0) {
            console.log('✅ Reply context sample found. Available columns:');
            const contextColumns = Object.keys(contextSample[0]);
            contextColumns.forEach(col => {
                console.log(`   - ${col}: ${typeof contextSample[0][col]}`);
            });
        } else {
            console.log('❌ No reply context records found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkSchema().catch(console.error);
