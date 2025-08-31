const SupabaseClient = require('./supabase-client');

async function checkPostsTable() {
    console.log('🔍 Checking jk_rowling_posts table structure...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Get a sample record to see the structure
        const { data: posts, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error accessing jk_rowling_posts table:', error.message);
            return;
        }
        
        if (posts && posts.length > 0) {
            const post = posts[0];
            console.log('✅ jk_rowling_posts table structure:');
            console.log('📊 Available columns:');
            Object.keys(post).forEach(key => {
                const value = post[key];
                const type = typeof value;
                const preview = value ? (typeof value === 'string' ? value.substring(0, 50) : JSON.stringify(value).substring(0, 50)) : 'null';
                console.log(`   - ${key}: ${type} (${preview}...)`);
            });
        } else {
            console.log('📝 Table exists but has no data');
            
            // Try to get column info by attempting to insert a minimal record
            console.log('\n🔍 Testing minimal insert to understand structure...');
            const testData = {
                junkipedia_id: 'test_id',
                content: 'test content',
                author: 'test author',
                platform: 'twitter',
                post_type: 'test',
                created_at: new Date().toISOString(),
                published_at: new Date().toISOString()
            };
            
            const { data: testInsert, error: insertError } = await supabase.supabase
                .from('jk_rowling_posts')
                .insert([testData])
                .select()
                .single();
                
            if (insertError) {
                console.error('❌ Insert test failed:', insertError.message);
                
                // Try to get table info from information_schema
                console.log('\n🔍 Trying to get table schema from information_schema...');
                const { data: schemaInfo, error: schemaError } = await supabase.supabase
                    .rpc('get_table_columns', { table_name: 'jk_rowling_posts' });
                    
                if (schemaError) {
                    console.log('❌ Could not get schema info:', schemaError.message);
                } else {
                    console.log('📊 Schema info:', schemaInfo);
                }
            } else {
                console.log('✅ Test insert successful');
                console.log('📊 Inserted record structure:');
                Object.keys(testInsert).forEach(key => {
                    console.log(`   - ${key}: ${typeof testInsert[key]}`);
                });
                
                // Clean up test record
                await supabase.supabase
                    .from('jk_rowling_posts')
                    .delete()
                    .eq('junkipedia_id', 'test_id');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking posts table:', error.message);
    }
}

checkPostsTable().catch(console.error);
