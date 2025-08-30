const SupabaseClient = require('./supabase-client');

async function testArticleIntegration() {
    const supabase = new SupabaseClient();
    
    console.log('🔍 Testing Article Integration - Focused Analysis\n');
    
    try {
        // Get a few tweets that have articles
        const { data: tweets, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(5);
            
        if (error) throw error;
        
        console.log(`📊 Testing ${tweets.length} recent tweets\n`);
        
        for (const tweet of tweets) {
            console.log(`🔍 Tweet ${tweet.junkipedia_id}:`);
            console.log(`   📝 Content: ${tweet.content.substring(0, 100)}...`);
            
            // Check if this tweet has articles
            const { data: articles } = await supabase.supabase
                .from('article_content')
                .select('*')
                .eq('tweet_id', tweet.junkipedia_id);
                
            if (articles && articles.length > 0) {
                console.log(`   📄 Found ${articles.length} article(s):`);
                
                for (const article of articles) {
                    console.log(`      🔗 URL: ${article.url}`);
                    console.log(`      📊 Status: ${article.status}`);
                    console.log(`      📝 Title: ${article.title || 'No title'}`);
                    console.log(`      📏 Word count: ${article.word_count || 'Unknown'}`);
                    
                    // Check the actual content
                    if (article.content) {
                        console.log(`      ✅ Content available: ${article.content.substring(0, 50)}...`);
                    } else {
                        console.log(`      ❌ Content missing: ${article.content}`);
                    }
                    console.log('');
                }
            } else {
                console.log(`   📄 No articles found for this tweet`);
            }
            
            // Check if this tweet has analysis
            const { data: analysis } = await supabase.supabase
                .from('tweet_analysis')
                .select('*')
                .eq('tweet_id', tweet.junkipedia_id)
                .single();
                
            if (analysis) {
                console.log(`   🤖 Analysis exists:`);
                console.log(`      🚨 Flagged: ${analysis.is_potentially_transphobic}`);
                console.log(`      📊 Severity: ${analysis.severity}`);
                console.log(`      📄 Articles analyzed: ${analysis.articles_analyzed || 0}`);
                console.log(`      🔗 Combined analysis: ${analysis.combined_analysis ? 'Yes' : 'No'}`);
            } else {
                console.log(`   🤖 No analysis found`);
            }
            
            console.log('─'.repeat(80));
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testArticleIntegration().catch(console.error);
