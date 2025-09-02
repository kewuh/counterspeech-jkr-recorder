const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkCurrentState() {
    try {
        console.log('🔍 Checking current state of the updated tweet...');
        
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
        console.log('📝 Tweet details:');
        console.log('   ID:', tweet.junkipedia_id);
        console.log('   Content:', tweet.content);
        console.log('   Post Type:', tweet.post_type);
        console.log('   Published:', tweet.published_at);
        
        // Check if it has reply context
        console.log('\n🔍 Checking reply context...');
        const { data: replyContext, error: replyError } = await supabase
            .from('reply_contexts')
            .select('*')
            .eq('reply_tweet_id', tweet.junkipedia_id)
            .single();
        
        if (replyError) {
            console.log('❌ No reply context found');
        } else {
            console.log('✅ Reply context found:');
            console.log('   Original tweet ID:', replyContext.original_tweet_id);
            console.log('   Original user: @' + replyContext.original_user_username);
            console.log('   Original text preview:', replyContext.original_tweet_text?.substring(0, 100) + '...');
        }
        
        // Check if we have analysis for the quoted tweet
        console.log('\n🔍 Checking quoted tweet analysis...');
        const quotedTweetId = '1962823252465565803';
        const { data: quotedAnalysis, error: analysisError } = await supabase
            .from('tweet_analysis')
            .select('*')
            .eq('tweet_id', `quoted_${quotedTweetId}`)
            .single();
        
        if (analysisError) {
            console.log('❌ No analysis found for quoted tweet');
            console.log('   Expected analysis ID: quoted_' + quotedTweetId);
        } else {
            console.log('✅ Quoted tweet analysis found:');
            console.log('   Transphobic:', quotedAnalysis.is_potentially_transphobic);
            console.log('   Confidence:', quotedAnalysis.confidence_level);
            console.log('   Severity:', quotedAnalysis.severity);
            console.log('   Concerns count:', quotedAnalysis.concerns?.length || 0);
        }
        
        console.log('\n📊 Current Status:');
        console.log('   🎯 Tweet ID:', tweet.junkipedia_id);
        console.log('   📝 Post Type:', tweet.post_type);
        console.log('   📥 Context Available:', !!replyContext);
        console.log('   🤖 Analysis Available:', !analysisError);
        
        if (replyContext && !analysisError) {
            console.log('\n🎉 SUCCESS! The tweet is fully updated with:');
            console.log('   ✅ Quoted content context');
            console.log('   ✅ AI analysis of the quoted content');
            console.log('   🎨 Frontend will now show complete information');
        } else {
            console.log('\n⚠️  Still need to complete:');
            if (!replyContext) console.log('   ❌ Reply context storage');
            if (analysisError) console.log('   ❌ Quoted tweet analysis');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkCurrentState().catch(console.error);
