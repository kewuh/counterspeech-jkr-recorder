const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

async function fixDatabaseSchema() {
    console.log('🔧 Fixing database schema...');
    
    if (!config.supabase || !config.supabase.url || !config.supabase.anonKey) {
        console.log('❌ Supabase not configured');
        return;
    }
    
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    try {
        // Add payment_method_id column to pledges table
        console.log('📝 Adding payment_method_id column to pledges table...');
        
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE pledges 
                ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR;
                
                COMMENT ON COLUMN pledges.payment_method_id IS 'Stripe Payment Method ID for charging pledges';
            `
        });
        
        if (error) {
            console.log('❌ Error adding column:', error.message);
            console.log('💡 You may need to run this SQL manually in your Supabase dashboard:');
            console.log(`
                ALTER TABLE pledges ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR;
                COMMENT ON COLUMN pledges.payment_method_id IS 'Stripe Payment Method ID for charging pledges';
            `);
        } else {
            console.log('✅ payment_method_id column added successfully!');
        }
        
        // Check the table structure
        console.log('\n📋 Checking pledges table structure...');
        const { data: columns, error: columnsError } = await supabase
            .from('pledges')
            .select('*')
            .limit(1);
            
        if (columnsError) {
            console.log('❌ Error checking table structure:', columnsError.message);
        } else {
            console.log('✅ Pledges table is accessible');
        }
        
    } catch (error) {
        console.error('❌ Error fixing schema:', error.message);
    }
}

// Run the fix
fixDatabaseSchema();
