const SupabaseClient = require('./supabase-client');
const fs = require('fs');

async function setupDatabase() {
    const supabase = new SupabaseClient();
    
    try {
        console.log('🔧 Setting up database tables...\n');
        
        // Read the SQL file
        const sqlContent = fs.readFileSync('setup-complete-analysis.sql', 'utf8');
        
        // Split the SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.length === 0) {
                continue;
            }
            
            try {
                console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
                
                // Execute the SQL statement
                const { data, error } = await supabase.supabase.rpc('exec_sql', {
                    sql: statement + ';'
                });
                
                if (error) {
                    console.log(`⚠️  Statement ${i + 1} had an issue:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                    successCount++;
                }
                
            } catch (err) {
                console.log(`❌ Error executing statement ${i + 1}:`, err.message);
                errorCount++;
            }
        }
        
        console.log(`\n📊 Database Setup Summary:`);
        console.log(`   ✅ Successful: ${successCount} statements`);
        console.log(`   ❌ Errors: ${errorCount} statements`);
        
        if (errorCount > 0) {
            console.log('\n⚠️  Some statements failed. This might be because:');
            console.log('   - Tables already exist');
            console.log('   - Permissions issues');
            console.log('   - exec_sql function not available');
            console.log('\n📋 You may need to run the SQL manually in Supabase dashboard');
        } else {
            console.log('\n🎉 Database setup completed successfully!');
        }
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        console.log('\n📋 Please run the SQL manually in your Supabase dashboard:');
        console.log('   1. Go to your Supabase project dashboard');
        console.log('   2. Click on "SQL Editor" in the left sidebar');
        console.log('   3. Copy and paste the contents of setup-complete-analysis.sql');
        console.log('   4. Click "Run" to execute the SQL');
    }
}

setupDatabase().catch(console.error);
