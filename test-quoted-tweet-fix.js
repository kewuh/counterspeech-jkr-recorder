const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testQuotedTweetFix() {
    try {
        console.log('🧪 Testing the quoted tweet fix...');
        
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
        console.log('📝 Found tweet:', {
            id: tweet.junkipedia_id,
            content: tweet.content,
            post_type: tweet.post_type
        });
        
        // Test the new detection logic
        const isReply = tweet.raw_data?.attributes?.post_data?.in_reply_to_status_id_str;
        const isQuoted = tweet.raw_data?.attributes?.post_data?.quoted_status_id_str;
        
        console.log('\n🔍 Testing detection logic:');
        console.log('   Is Reply:', !!isReply);
        console.log('   Is Quoted:', !!isQuoted);
        
        if (isQuoted) {
            console.log('   ✅ Quoted tweet detected!');
            console.log('   📝 Quoted status ID:', isQuoted);
            
            // Check if we have reply context for this quoted tweet
            const { data: replyContext, error: replyError } = await supabase
                .from('reply_contexts')
                .select('*')
                .eq('tweet_id', tweet.junkipedia_id)
                .single();
            
            if (replyError) {
                console.log('   ❌ No reply context found - this needs to be fetched');
                console.log('   🔍 The quoted tweet context should be fetched for ID:', isQuoted);
            } else {
                console.log('   ✅ Reply context found:', replyContext);
            }
        }
        
        // Test the frontend detection logic
        console.log('\n🎨 Testing frontend detection:');
        if (tweet.raw_data?.attributes?.post_data?.quoted_status_id_str) {
            console.log('   ✅ Frontend will detect this as a quoted tweet');
            console.log('   🔗 Will show: "Quoting tweet" with link to:', tweet.raw_data.attributes.post_data.quoted_status_id_str);
        } else {
            console.log('   ❌ Frontend will NOT detect this as a quoted tweet');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testQuotedTweetFix().catch(console.error);
