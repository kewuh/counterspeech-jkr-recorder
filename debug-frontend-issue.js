const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function debugFrontendIssue() {
    try {
        console.log('🔍 Debugging frontend issue...');
        
        // Find the UK totalitarianism tweet
        const { data: tweets, error } = await supabase
            .from('jk_rowling_posts')
            .select('*')
            .ilike('content', '%What the fuck has the UK become%')
            .limit(1);
        
        if (error || !tweets || tweets.length === 0) {
            console.log('❌ Tweet not found');
            return;
        }
        
        const tweet = tweets[0];
        console.log('📝 Main tweet:', {
            id: tweet.junkipedia_id,
            content: tweet.content,
            post_type: tweet.post_type
        });
        
        // Check the main tweet analysis
        console.log('\n🔍 Checking main tweet analysis...');
        const { data: mainAnalysis, error: mainError } = await supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', tweet.junkipedia_id)
            .single();
        
        if (mainError) {
            console.log('❌ No main tweet analysis found');
        } else {
            console.log('✅ Main tweet analysis found:');
            console.log('   Transphobic:', mainAnalysis.is_potentially_transphobic);
            console.log('   Media Analysis:', mainAnalysis.media_analysis?.substring(0, 100) + '...');
            console.log('   Images Analyzed:', mainAnalysis.images_analyzed);
        }
        
        // Check the quoted tweet analysis
        console.log('\n🔍 Checking quoted tweet analysis...');
        const quotedTweetId = '1962823252465565803';
        const { data: quotedAnalysis, error: quotedError } = await supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', `quoted_${quotedTweetId}`)
            .single();
        
        if (quotedError) {
            console.log('❌ No quoted tweet analysis found');
        } else {
            console.log('✅ Quoted tweet analysis found:');
            console.log('   Transphobic:', quotedAnalysis.is_potentially_transphobic);
            console.log('   Media Analysis:', quotedAnalysis.media_analysis?.substring(0, 100) + '...');
            console.log('   Images Analyzed:', quotedAnalysis.images_analyzed);
        }
        
        // Check reply context
        console.log('\n🔍 Checking reply context...');
        const { data: replyContext, error: contextError } = await supabase
            .from('reply_contexts')
            .select('*')
            .eq('reply_tweet_id', tweet.junkipedia_id)
            .single();
        
        if (contextError) {
            console.log('❌ No reply context found');
        } else {
            console.log('✅ Reply context found:');
            console.log('   Original tweet ID:', replyContext.original_tweet_id);
            console.log('   Original user: @' + replyContext.original_user_username);
        }
        
        console.log('\n🔍 Frontend Loading Issue Analysis:');
        
        // The frontend might be looking for analysis in the wrong place
        console.log('   🎯 Main tweet ID:', tweet.junkipedia_id);
        console.log('   🔗 Quoted tweet ID:', quotedTweetId);
        console.log('   📊 Analysis exists for main tweet:', !!mainAnalysis);
        console.log('   📊 Analysis exists for quoted tweet:', !!quotedAnalysis);
        console.log('   📥 Reply context exists:', !!replyContext);
        
        if (quotedAnalysis && quotedAnalysis.media_analysis !== 'No media content to analyze') {
            console.log('\n✅ Quoted tweet analysis is correct in database');
            console.log('   The issue is likely in the frontend loading logic');
            console.log('   Frontend needs to load the quoted tweet analysis');
        } else {
            console.log('\n❌ Quoted tweet analysis is still wrong in database');
            console.log('   Need to fix the database first');
        }
        
        // Check if there are multiple analyses for the same tweet
        console.log('\n🔍 Checking for duplicate analyses...');
        const { data: allAnalyses, error: allError } = await supabase
            .from('tweet_analysis')
            .select('*')
            .or(`tweet_id.eq.${tweet.junkipedia_id},tweet_id.eq.quoted_${quotedTweetId}`);
        
        if (!allError && allAnalyses) {
            console.log('📊 All analyses found:');
            allAnalyses.forEach((analysis, index) => {
                console.log(`   ${index + 1}. ID: ${analysis.tweet_id}`);
                console.log(`      Media Analysis: ${analysis.media_analysis?.substring(0, 50)}...`);
                console.log(`      Images Analyzed: ${analysis.images_analyzed}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugFrontendIssue().catch(console.error);
