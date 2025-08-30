const JunkipediaAPI = require('./junkipedia-api');
const SupabaseClient = require('./supabase-client');

class ReplyContextFetcher {
    constructor() {
        this.junkipedia = new JunkipediaAPI();
        this.supabase = new SupabaseClient();
    }

    async fetchReplyContext() {
        console.log('🔍 Fetching reply context for JK Rowling\'s tweets...\n');
        
        try {
            // Get all posts from database
            const posts = await this.supabase.getAllPosts();
            console.log(`📊 Found ${posts.length} posts to analyze`);
            
            let replyCount = 0;
            let retweetCount = 0;
            let quoteCount = 0;
            
            // Analyze each post for reply/retweet/quote data
            for (const post of posts) {
                const rawData = post.raw_data;
                const postData = rawData?.attributes?.post_data;
                const searchData = rawData?.attributes?.search_data_fields;
                
                if (!postData) continue;
                
                // Check for reply data
                const replyToScreenName = postData.in_reply_to_screen_name;
                const replyToUserId = postData.in_reply_to_user_id_str;
                const replyToStatusId = postData.in_reply_to_status_id_str;
                const repliedId = searchData?.replied_id;
                const quotedId = searchData?.quoted_id;
                const sharedId = searchData?.shared_id;
                
                if (replyToScreenName && replyToStatusId) {
                    replyCount++;
                    console.log(`\n📝 Reply found in tweet ${post.junkipedia_id}:`);
                    console.log(`   👤 Replying to: @${replyToScreenName}`);
                    console.log(`   🆔 Reply to tweet ID: ${replyToStatusId}`);
                    console.log(`   📝 Content: ${post.content?.substring(0, 100)}...`);
                    
                    // Try to fetch the original tweet being replied to
                    await this.fetchOriginalTweet(replyToStatusId, post.junkipedia_id, 'reply');
                }
                
                if (quotedId) {
                    quoteCount++;
                    console.log(`\n💬 Quote found in tweet ${post.junkipedia_id}:`);
                    console.log(`   🆔 Quoted tweet ID: ${quotedId}`);
                    console.log(`   📝 Content: ${post.content?.substring(0, 100)}...`);
                    
                    // Try to fetch the quoted tweet
                    await this.fetchOriginalTweet(quotedId, post.junkipedia_id, 'quote');
                }
                
                if (sharedId) {
                    retweetCount++;
                    console.log(`\n🔄 Retweet found in tweet ${post.junkipedia_id}:`);
                    console.log(`   🆔 Retweeted tweet ID: ${sharedId}`);
                    console.log(`   📝 Content: ${post.content?.substring(0, 100)}...`);
                    
                    // Try to fetch the retweeted tweet
                    await this.fetchOriginalTweet(sharedId, post.junkipedia_id, 'retweet');
                }
            }
            
            console.log(`\n📊 Summary:`);
            console.log(`   📝 Replies: ${replyCount}`);
            console.log(`   💬 Quotes: ${quoteCount}`);
            console.log(`   🔄 Retweets: ${retweetCount}`);
            console.log(`   📊 Total interactions: ${replyCount + quoteCount + retweetCount}`);
            
        } catch (error) {
            console.error('❌ Error fetching reply context:', error);
        }
    }

    async fetchOriginalTweet(tweetId, originalPostId, interactionType) {
        try {
            console.log(`   🔍 Fetching original tweet ${tweetId}...`);
            
            // Try to fetch the original tweet using Junkipedia API
            const response = await this.junkipedia.searchPosts({
                q: `id:${tweetId}`,
                limit: 1
            });
            
            if (response.data && response.data.length > 0) {
                const originalTweet = response.data[0];
                console.log(`   ✅ Found original tweet:`);
                console.log(`      👤 Author: ${originalTweet.attributes?.channel?.channel_name || 'Unknown'}`);
                console.log(`      📝 Content: ${originalTweet.attributes?.search_data_fields?.sanitized_text?.substring(0, 100)}...`);
                console.log(`      📅 Date: ${originalTweet.attributes?.published_at}`);
                
                // Store the reply context in the database
                await this.storeReplyContext(originalPostId, originalTweet, interactionType);
            } else {
                console.log(`   ❌ Original tweet ${tweetId} not found in Junkipedia`);
                
                // Try to construct a Twitter URL for the original tweet
                const twitterUrl = `https://twitter.com/i/status/${tweetId}`;
                console.log(`   🔗 Twitter URL: ${twitterUrl}`);
                
                // Store minimal context
                await this.storeReplyContext(originalPostId, {
                    id: tweetId,
                    twitter_url: twitterUrl,
                    not_found: true
                }, interactionType);
            }
            
        } catch (error) {
            console.error(`   ❌ Error fetching tweet ${tweetId}:`, error.message);
        }
    }

    async storeReplyContext(originalPostId, originalTweet, interactionType) {
        try {
            // Create a reply context record
            const replyContext = {
                original_post_id: originalPostId,
                interaction_type: interactionType, // 'reply', 'quote', 'retweet'
                original_tweet_id: originalTweet.id,
                original_author: originalTweet.attributes?.channel?.channel_name || 'Unknown',
                original_content: originalTweet.attributes?.search_data_fields?.sanitized_text || originalTweet.content || 'Content not available',
                original_published_at: originalTweet.attributes?.published_at || originalTweet.published_at,
                original_url: originalTweet.attributes?.post_data?.url || originalTweet.url || `https://twitter.com/i/status/${originalTweet.id}`,
                twitter_url: `https://twitter.com/i/status/${originalTweet.id}`,
                not_found: originalTweet.not_found || false,
                raw_data: originalTweet
            };
            
            // Store using the new method
            const success = await this.supabase.storeReplyContext(replyContext);
            
            if (success) {
                console.log(`   ✅ Reply context stored successfully`);
            } else {
                console.log(`   ❌ Failed to store reply context`);
            }
            
        } catch (error) {
            console.error(`   ❌ Error storing reply context:`, error);
        }
    }
}

// Run the script
async function main() {
    const fetcher = new ReplyContextFetcher();
    await fetcher.fetchReplyContext();
}

main().catch(console.error);
