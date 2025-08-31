const SupabaseClient = require('./supabase-client');

async function checkUpdatedAnalysis() {
    console.log('🔍 Checking updated tweet analysis with article analysis...');
    
    const supabase = new SupabaseClient();
    
    try {
        // Get the updated tweet analysis
        const { data: analysis, error } = await supabase.supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', 'x_manual_nicola_sturgeon_repost')
            .single();

        if (error) {
            console.error('❌ Error fetching analysis:', error.message);
            return;
        }

        if (analysis) {
            console.log('✅ Updated tweet analysis found:');
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   📝 Explanation: ${analysis.explanation.substring(0, 150)}...`);
            
            if (analysis.article_analysis) {
                console.log(`\n📄 Article Analysis:`);
                console.log(`   ${analysis.article_analysis.substring(0, 200)}...`);
            }
            
            if (analysis.combined_analysis) {
                console.log(`\n🔄 Combined Analysis:`);
                console.log(`   ${analysis.combined_analysis}`);
            }
            
            if (analysis.articles_analyzed) {
                console.log(`\n📊 Articles Analyzed: ${analysis.articles_analyzed}`);
            }
        } else {
            console.log('❌ No analysis found');
        }

        // Also check the article content
        console.log('\n📄 Checking stored article content...');
        const { data: article, error: articleError } = await supabase.supabase
            .from('article_content')
            .select('*')
            .eq('tweet_id', 'x_manual_nicola_sturgeon_repost')
            .single();

        if (articleError) {
            console.error('❌ Error fetching article:', articleError.message);
        } else if (article) {
            console.log('✅ Article content found:');
            console.log(`   📰 Title: ${article.title}`);
            console.log(`   🔗 URL: ${article.url}`);
            console.log(`   📄 Word count: ${article.word_count}`);
            console.log(`   📝 Content preview: ${article.content.substring(0, 200)}...`);
        }

    } catch (error) {
        console.error('❌ Error checking updated analysis:', error.message);
    }
}

checkUpdatedAnalysis().catch(console.error);
