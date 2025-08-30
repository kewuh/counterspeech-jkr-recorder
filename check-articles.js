const SupabaseClient = require('./supabase-client');

async function checkArticles() {
    const supabase = new SupabaseClient();
    
    console.log('📄 Checking Article Content\n');
    
    try {
        const { data: articles, error } = await supabase.supabase
            .from('article_content')
            .select('*')
            .eq('status', 'success')
            .limit(5);
            
        if (error) throw error;
        
        console.log(`📊 Found ${articles.length} articles with 'success' status\n`);
        
        articles.forEach((article, index) => {
            console.log(`${index + 1}. URL: ${article.url}`);
            console.log(`   Title: ${article.title || 'No title'}`);
            console.log(`   Word count: ${article.word_count || 'Unknown'}`);
            console.log(`   Content length: ${article.content ? article.content.length : 0} characters`);
            
            if (article.content && article.content.length > 0) {
                console.log(`   ✅ Content: ${article.content.substring(0, 100)}...`);
            } else {
                console.log(`   ❌ Content: NULL or empty`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkArticles().catch(console.error);
