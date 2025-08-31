const GeminiAnalyzer = require('./gemini-analyzer');
const SupabaseClient = require('./supabase-client');

async function analyzeRepost() {
    console.log('🤖 Running AI analysis on the Nicola Sturgeon repost...');
    
    const analyzer = new GeminiAnalyzer();
    const supabase = new SupabaseClient();
    
    try {
        // Get the repost from database
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
        console.log(`   📅 Published: ${repost.published_at}`);

        // Check if analysis already exists
        const { data: existingAnalysis, error: analysisError } = await supabase.supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', repost.junkipedia_id)
            .single();

        if (analysisError && analysisError.code !== 'PGRST116') {
            console.error('❌ Error checking existing analysis:', analysisError.message);
            return;
        }

        if (existingAnalysis) {
            console.log('⚠️  Analysis already exists for this repost:');
            console.log(`   🚨 Potentially transphobic: ${existingAnalysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${existingAnalysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${existingAnalysis.severity}`);
            console.log(`   📝 Explanation: ${existingAnalysis.explanation.substring(0, 100)}...`);
            return;
        }

        // Run AI analysis
        console.log('\n🔍 Running AI analysis...');
        const analysis = await analyzer.analyzeTweet(repost);

        if (analysis) {
            console.log('✅ Analysis completed successfully!');
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   📝 Explanation: ${analysis.explanation.substring(0, 100)}...`);
            
            if (analysis.concerns && analysis.concerns.length > 0) {
                console.log(`   🚨 Concerns: ${analysis.concerns.join(', ')}`);
            }
        } else {
            console.error('❌ Analysis failed');
        }

    } catch (error) {
        console.error('❌ Error analyzing repost:', error.message);
    }
}

analyzeRepost().catch(console.error);
