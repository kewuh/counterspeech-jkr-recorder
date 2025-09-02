const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function investigateReply() {
    try {
        console.log('🔍 Investigating the UK totalitarianism tweet as a reply...');
        
        // Find the tweet by content
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
            published: tweet.published_at,
            post_type: tweet.post_type
        });
        
        // Check if it has reply context
        const { data: replyContext, error: replyError } = await supabase
            .from('reply_contexts')
            .select('*')
            .eq('tweet_id', tweet.junkipedia_id)
            .single();
        
        if (replyError) {
            console.log('❌ No reply context found in reply_contexts table');
        } else {
            console.log('✅ Reply context found:', replyContext);
        }
        
        // Check raw_data for reply information
        if (tweet.raw_data) {
            console.log('\n🔍 Checking raw_data for reply information...');
            
            if (tweet.raw_data.attributes?.post_data) {
                const postData = tweet.raw_data.attributes.post_data;
                console.log('Post data keys:', Object.keys(postData));
                
                // Check for reply fields
                if (postData.in_reply_to_status_id_str) {
                    console.log('✅ Reply to status ID:', postData.in_reply_to_status_id_str);
                } else {
                    console.log('❌ No in_reply_to_status_id_str found');
                }
                
                if (postData.in_reply_to_user_id_str) {
                    console.log('✅ Reply to user ID:', postData.in_reply_to_user_id_str);
                } else {
                    console.log('❌ No in_reply_to_user_id_str found');
                }
                
                if (postData.in_reply_to_screen_name) {
                    console.log('✅ Reply to screen name:', postData.in_reply_to_screen_name);
                } else {
                    console.log('❌ No in_reply_to_screen_name found');
                }
                
                // Check for quoted tweets
                if (postData.quoted_status_result) {
                    console.log('✅ Quoted status found:', postData.quoted_status_result);
                }
                
                if (postData.quoted_status_id_str) {
                    console.log('✅ Quoted status ID:', postData.quoted_status_id_str);
                }
            }
            
            if (tweet.raw_data.attributes?.search_data_fields) {
                const searchData = tweet.raw_data.attributes.search_data_fields;
                console.log('\n🔍 Search data fields:');
                console.log('Is reply:', searchData.is_reply);
                console.log('Replied ID:', searchData.replied_id);
                console.log('Root post ID:', searchData.root_post_id);
            }
        }
        
        // Check if the cron job should have fetched reply context
        console.log('\n🔍 Checking if reply context should have been fetched...');
        if (tweet.post_type === 'reply') {
            console.log('✅ Tweet is marked as reply type');
            console.log('❌ But no reply context was fetched - this suggests a bug in the cron job');
        } else {
            console.log('❌ Tweet is not marked as reply type - this is the problem!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

investigateReply().catch(console.error);
