const GeminiAnalyzer = require('./gemini-analyzer');
const SupabaseClient = require('./supabase-client');

async function testRepostAnalysis() {
    console.log('🧪 Testing repost AI analysis integration...');
    
    const analyzer = new GeminiAnalyzer();
    const supabase = new SupabaseClient();
    
    try {
        // Get the repost that was already analyzed
        const { data: repost, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', 'x_manual_nicola_sturgeon_repost')
            .single();

        if (error) {
            console.error('❌ Error fetching repost:', error.message);
            return;
        }

        if (!repost) {
            console.error('❌ Repost not found');
            return;
        }

        console.log('📝 Repost found:');
        console.log(`   🆔 ID: ${repost.id}`);
        console.log(`   📝 Content: ${repost.content.substring(0, 100)}...`);
        console.log(`   🏷️  Post Type: ${repost.post_type}`);

        // Check if analysis exists
        const { data: analysis, error: analysisError } = await supabase.supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', repost.junkipedia_id)
            .single();

        if (analysisError && analysisError.code !== 'PGRST116') {
            console.error('❌ Error checking analysis:', analysisError.message);
            return;
        }

        if (analysis) {
            console.log('\n✅ Analysis found:');
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   📝 Explanation: ${analysis.explanation.substring(0, 150)}...`);
            
            if (analysis.concerns && analysis.concerns.length > 0) {
                console.log(`   🚨 Concerns: ${analysis.concerns.join(', ')}`);
            }
            
            console.log(`   📅 Analyzed at: ${analysis.analyzed_at}`);
        } else {
            console.log('\n❌ No analysis found for this repost');
        }

        // Test the analyzer directly
        console.log('\n🧪 Testing analyzer directly...');
        const testAnalysis = await analyzer.analyzeTweet(repost);
        
        if (testAnalysis) {
            console.log('✅ Direct analysis test successful:');
            console.log(`   🚨 Potentially transphobic: ${testAnalysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${testAnalysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${testAnalysis.severity}`);
        } else {
            console.log('❌ Direct analysis test failed');
        }

    } catch (error) {
        console.error('❌ Error testing repost analysis:', error.message);
    }
}

testRepostAnalysis().catch(console.error);
