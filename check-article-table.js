const SupabaseClient = require('./supabase-client');

async function checkArticleTable() {
    console.log('🔍 Checking article_content table structure...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Get a sample record to see the structure
        const { data: articles, error } = await supabase.supabase
            .from('article_content')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error accessing article_content table:', error.message);
            return;
        }
        
        if (articles && articles.length > 0) {
            const article = articles[0];
            console.log('✅ article_content table structure:');
            console.log('📊 Available columns:');
            Object.keys(article).forEach(key => {
                const value = article[key];
                const type = typeof value;
                const preview = value ? (typeof value === 'string' ? value.substring(0, 50) : JSON.stringify(value).substring(0, 50)) : 'null';
                console.log(`   - ${key}: ${type} (${preview}...)`);
            });
        } else {
            console.log('📝 Table exists but has no data');
            
            // Try to get column info by attempting to insert a minimal record
            console.log('\n🔍 Testing minimal insert to understand structure...');
            const testData = {
                tweet_id: 'test_tweet_id',
                url: 'https://example.com/test',
                title: 'Test Article',
                content: 'Test content',
                word_count: 2
            };
            
            const { data: testInsert, error: insertError } = await supabase.supabase
                .from('article_content')
                .insert([testData])
                .select()
                .single();
                
            if (insertError) {
                console.error('❌ Insert test failed:', insertError.message);
            } else {
                console.log('✅ Test insert successful');
                console.log('📊 Inserted record structure:');
                Object.keys(testInsert).forEach(key => {
                    console.log(`   - ${key}: ${typeof testInsert[key]}`);
                });
                
                // Clean up test record
                await supabase.supabase
                    .from('article_content')
                    .delete()
                    .eq('tweet_id', 'test_tweet_id');
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking article table:', error.message);
    }
}

checkArticleTable().catch(console.error);
