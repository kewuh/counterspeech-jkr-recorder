const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testCleanAnalysis() {
    try {
        console.log('🧪 Testing cleaned up image analysis...');
        
        // Find the tweet
        const { data: tweets, error } = await supabase
            .from('jk_rowling_posts')
            .select('*')
            .ilike('content', '%These men really hate women%')
            .limit(1);
        
        if (error || !tweets || tweets.length === 0) {
            console.log('❌ Tweet not found');
            return;
        }
        
        const tweet = tweets[0];
        console.log('📝 Found tweet:', tweet.junkipedia_id);
        
        // Run the updated analysis
        const GeminiAnalyzer = require('./gemini-analyzer.js');
        const analyzer = new GeminiAnalyzer();
        
        console.log('🤖 Running cleaned up analysis...');
        const newAnalysis = await analyzer.analyzeTweet(tweet);
        
        if (newAnalysis) {
            console.log('✅ Analysis completed successfully!');
            console.log('   🚨 Is Transphobic:', newAnalysis.is_potentially_transphobic);
            console.log('   📊 Confidence:', newAnalysis.confidence_level);
            console.log('   ⚠️  Severity:', newAnalysis.severity);
            console.log('   📸 Images Analyzed:', newAnalysis.images_analyzed);
            
            console.log('\n📸 Media Analysis (should be clean text, not JSON):');
            console.log(newAnalysis.media_analysis);
            
            console.log('\n🔗 Combined Analysis:');
            console.log(newAnalysis.combined_analysis);
            
            // Check if media_analysis is now clean text instead of JSON
            if (typeof newAnalysis.media_analysis === 'string' && !newAnalysis.media_analysis.startsWith('{')) {
                console.log('\n✅ SUCCESS: Media analysis is now clean text, not JSON!');
            } else {
                console.log('\n❌ Media analysis is still JSON format');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testCleanAnalysis().catch(console.error);
