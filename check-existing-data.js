const SupabaseClient = require('./supabase-client');

async function checkExistingData() {
    const supabase = new SupabaseClient();
    
    try {
        // Get the @hyperstiti0n reply tweet
        const { data: posts, error } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .ilike('content', '%hyperstiti0n%');
            
        if (error) {
            console.error('Error:', error.message);
            return;
        }
        
        if (posts.length === 0) {
            console.log('No @hyperstiti0n reply found');
            return;
        }
        
        const post = posts[0];
        console.log('📝 Found @hyperstiti0n reply tweet:');
        console.log('   Content:', post.content);
        console.log('   Junkipedia ID:', post.junkipedia_id);
        
        // Check for original tweet ID
        const originalTweetId = post.raw_data?.attributes?.post_data?.in_reply_to_status_id_str;
        console.log('   Original tweet ID:', originalTweetId);
        
        if (originalTweetId) {
            console.log('✅ We have the original tweet ID!');
            console.log('   We can create reply context without hitting Twitter API again');
            
            // Check if we already have this in reply_contexts
            const { data: existingContext } = await supabase.supabase
                .from('reply_contexts')
                .select('*')
                .eq('reply_tweet_id', post.junkipedia_id);
                
            if (existingContext && existingContext.length > 0) {
                console.log('✅ Reply context already exists in database');
                console.log('   Original tweet text:', existingContext[0].original_tweet_text);
            } else {
                console.log('❌ Reply context not yet created');
                console.log('   We need to run process-existing-replies.js');
            }
        } else {
            console.log('❌ No original tweet ID found in existing data');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkExistingData();
