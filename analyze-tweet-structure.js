const SupabaseClient = require('./supabase-client');

async function analyzeTweetStructure() {
    console.log('🔍 Analyzing tweet structure to find reply/retweet data...\n');
    
    const supabase = new SupabaseClient();
    
    try {
        // Get a few tweets to analyze their structure
        const posts = await supabase.getAllPosts();
        
        if (posts.length === 0) {
            console.log('❌ No posts found in database');
            return;
        }
        
        console.log(`📊 Analyzing ${Math.min(5, posts.length)} tweets...\n`);
        
        // Analyze first 5 tweets in detail
        for (let i = 0; i < Math.min(5, posts.length); i++) {
            const post = posts[i];
            console.log(`\n📝 Tweet ${i + 1}:`);
            console.log(`   🆔 ID: ${post.junkipedia_id}`);
            console.log(`   📅 Date: ${post.published_at}`);
            console.log(`   📝 Content: ${post.content?.substring(0, 100)}...`);
            console.log(`   🔗 URL: ${post.url}`);
            console.log(`   📱 Platform: ${post.platform}`);
            console.log(`   📊 Post Type: ${post.post_type}`);
            
            // Analyze raw data structure
            const rawData = post.raw_data;
            console.log(`   🔍 Raw data analysis:`);
            
            // Check for reply-related fields
            const replyFields = [
                'reply_to',
                'in_reply_to',
                'parent_post',
                'quoted_post',
                'retweeted_post',
                'referenced_tweets',
                'conversation_id',
                'reply_to_user_id',
                'reply_to_status_id'
            ];
            
            replyFields.forEach(field => {
                if (rawData[field]) {
                    console.log(`      ✅ ${field}: ${JSON.stringify(rawData[field])}`);
                }
            });
            
            // Check attributes for reply data
            if (rawData.attributes) {
                const attrs = rawData.attributes;
                console.log(`   🔍 Attributes analysis:`);
                
                // Check for reply data in attributes
                if (attrs.post_data) {
                    const postData = attrs.post_data;
                    console.log(`      📊 post_data fields: ${Object.keys(postData).join(', ')}`);
                    
                    if (postData.reply_to) {
                        console.log(`      ✅ reply_to: ${JSON.stringify(postData.reply_to)}`);
                    }
                    if (postData.quoted_status) {
                        console.log(`      ✅ quoted_status: ${JSON.stringify(postData.quoted_status)}`);
                    }
                    if (postData.retweeted_status) {
                        console.log(`      ✅ retweeted_status: ${JSON.stringify(postData.retweeted_status)}`);
                    }
                }
                
                // Check search data fields
                if (attrs.search_data_fields) {
                    const searchData = attrs.search_data_fields;
                    console.log(`      🔍 search_data_fields: ${Object.keys(searchData).join(', ')}`);
                    
                    if (searchData.reply_to) {
                        console.log(`      ✅ reply_to: ${JSON.stringify(searchData.reply_to)}`);
                    }
                    if (searchData.quoted_post) {
                        console.log(`      ✅ quoted_post: ${JSON.stringify(searchData.quoted_post)}`);
                    }
                }
                
                // Check engagement data
                if (attrs.engagement_data) {
                    const engagement = attrs.engagement_data;
                    console.log(`      📈 engagement_data fields: ${Object.keys(engagement).join(', ')}`);
                }
            }
            
            // Check for any nested reply data
            const allKeys = Object.keys(rawData);
            const replyRelatedKeys = allKeys.filter(key => 
                key.toLowerCase().includes('reply') || 
                key.toLowerCase().includes('quote') || 
                key.toLowerCase().includes('retweet') ||
                key.toLowerCase().includes('parent') ||
                key.toLowerCase().includes('conversation')
            );
            
            if (replyRelatedKeys.length > 0) {
                console.log(`      🎯 Reply-related keys found: ${replyRelatedKeys.join(', ')}`);
            }
        }
        
        // Look for specific post types
        console.log(`\n📊 Post Type Analysis:`);
        const postTypes = {};
        posts.forEach(post => {
            const type = post.post_type || 'unknown';
            postTypes[type] = (postTypes[type] || 0) + 1;
        });
        
        Object.entries(postTypes).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} tweets`);
        });
        
        // Look for tweets with URLs that might be replies
        console.log(`\n🔗 URL Analysis:`);
        const tweetsWithUrls = posts.filter(post => post.url && post.url.includes('twitter.com'));
        console.log(`   Tweets with Twitter URLs: ${tweetsWithUrls.length}`);
        
        // Check for tweets that might be replies (contain @mentions at start)
        const possibleReplies = posts.filter(post => 
            post.content && post.content.trim().startsWith('@')
        );
        console.log(`   Possible replies (start with @): ${possibleReplies.length}`);
        
        if (possibleReplies.length > 0) {
            console.log(`   Example reply: ${possibleReplies[0].content?.substring(0, 100)}...`);
        }
        
    } catch (error) {
        console.error('❌ Error analyzing tweet structure:', error);
    }
}

analyzeTweetStructure().catch(console.error);
