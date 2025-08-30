const TwitterAPIClient = require('./twitter-api');
const SupabaseClient = require('./supabase-client');
const JunkipediaAPI = require('./junkipedia-api');

class NewReplyDetector {
    constructor() {
        this.twitter = new TwitterAPIClient();
        this.supabase = new SupabaseClient();
        this.junkipedia = new JunkipediaAPI();
    }

    /**
     * Check for new reply tweets and fetch their context
     */
    async checkForNewReplies() {
        console.log('🔍 Checking for new reply tweets...\n');
        
        try {
            // Get the latest post timestamp from our database
            const { data: latestPost, error: latestError } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('published_at')
                .order('published_at', { ascending: false })
                .limit(1);
                
            if (latestError) {
                console.error('❌ Error getting latest post:', latestError.message);
                return;
            }
            
            const lastProcessedTime = latestPost?.[0]?.published_at;
            console.log(`📅 Last processed post: ${lastProcessedTime || 'None'}`);
            
            // Fetch new posts from Junkipedia (this doesn't use Twitter API)
            console.log('📡 Fetching new posts from Junkipedia...');
            const newPosts = await this.junkipedia.getPosts({
                limit: 50,
                'channel_ids[]': '10595539'
            });
            
            if (!newPosts.data || newPosts.data.length === 0) {
                console.log('📝 No new posts found');
                return;
            }
            
            console.log(`📊 Found ${newPosts.data.length} posts from Junkipedia`);
            
            // Filter for reply tweets that are newer than our last processed post
            const newReplyTweets = newPosts.data.filter(post => {
                const isReply = post.attributes?.post_data?.in_reply_to_status_id_str;
                const isNewer = !lastProcessedTime || new Date(post.attributes?.published_at) > new Date(lastProcessedTime);
                return isReply && isNewer;
            });
            
            if (newReplyTweets.length === 0) {
                console.log('📝 No new reply tweets found');
                return;
            }
            
            console.log(`🎯 Found ${newReplyTweets.length} new reply tweets to process`);
            
            // Process each new reply tweet (this will use Twitter API)
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            
            for (const post of newReplyTweets) {
                try {
                    const originalTweetId = post.attributes?.post_data?.in_reply_to_status_id_str;
                    
                    console.log(`\n📝 Processing new reply tweet:`);
                    console.log(`   💬 Reply: ${post.attributes?.search_data_fields?.sanitized_text?.substring(0, 100)}...`);
                    console.log(`   🔗 Original tweet ID: ${originalTweetId}`);
                    
                    // Check if we already have this reply context
                    const existingContext = await this.supabase.supabase
                        .from('reply_contexts')
                        .select('id')
                        .eq('reply_tweet_id', post.id)
                        .single();
                        
                    if (existingContext.data) {
                        console.log(`   ✅ Reply context already exists, skipping`);
                        continue;
                    }
                    
                    // Fetch original tweet from Twitter API (single API call)
                    console.log(`   🔍 Fetching original tweet from Twitter API...`);
                    const originalTweet = await this.twitter.getOriginalTweet(originalTweetId);
                    
                    if (originalTweet && originalTweet.data) {
                        // Store the reply context
                        await this.storeReplyContext(post, originalTweet);
                        successCount++;
                        console.log(`   ✅ Successfully processed and stored`);
                    } else {
                        console.log(`   ❌ Original tweet not accessible`);
                        errorCount++;
                    }
                    
                    processedCount++;
                    
                    // Rate limiting - wait between requests
                    if (processedCount % 3 === 0) {
                        console.log(`   ⏳ Waiting 3 seconds for rate limiting...`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                    
                } catch (error) {
                    console.error(`   ❌ Error processing post ${post.id}:`, error.message);
                    errorCount++;
                }
            }
            
            console.log(`\n✅ New reply processing complete!`);
            console.log(`   📊 Total processed: ${processedCount}`);
            console.log(`   ✅ Successful: ${successCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            
        } catch (error) {
            console.error('❌ Error in checkForNewReplies:', error.message);
        }
    }

    /**
     * Store reply context in database
     */
    async storeReplyContext(post, originalTweet) {
        const replyContextData = {
            reply_context_id: `junkipedia_${post.id}`,
            reply_tweet_id: post.id,
            reply_tweet_text: post.attributes?.search_data_fields?.sanitized_text,
            reply_tweet_created_at: post.attributes?.published_at,
            reply_tweet_metrics: post.attributes?.engagement_data || {},
            original_tweet_id: originalTweet.data.id,
            original_tweet_text: originalTweet.data.text,
            original_tweet_created_at: originalTweet.data.created_at,
            original_tweet_metrics: originalTweet.data.public_metrics || {},
            original_user_username: originalTweet.includes?.users?.[0]?.username || null,
            original_user_name: originalTweet.includes?.users?.[0]?.name || null,
            conversation_id: originalTweet.data.conversation_id || null,
            platform: 'twitter',
            raw_data: {
                reply_post: post,
                original_tweet: originalTweet.data,
                original_user: originalTweet.includes?.users?.[0] || null
            },
            inserted_at: new Date().toISOString()
        };
        
        const { error } = await this.supabase.supabase
            .from('reply_contexts')
            .insert(replyContextData);
            
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }

    /**
     * Get recent reply contexts for AI analysis
     */
    async getRecentReplyContexts(limit = 10) {
        try {
            const { data, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .order('inserted_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                console.error('❌ Error getting recent reply contexts:', error.message);
                return [];
            }
            
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting recent reply contexts:', error.message);
            return [];
        }
    }
}

// CLI interface
async function main() {
    const detector = new NewReplyDetector();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'check':
            await detector.checkForNewReplies();
            break;
            
        case 'recent':
            const limit = parseInt(args[1]) || 10;
            const contexts = await detector.getRecentReplyContexts(limit);
            console.log(`📊 Recent ${contexts.length} reply contexts:`);
            contexts.forEach((context, i) => {
                console.log(`\n${i + 1}. Reply: ${context.reply_tweet_text?.substring(0, 80)}...`);
                if (context.original_tweet_text) {
                    console.log(`   Original: ${context.original_tweet_text?.substring(0, 80)}...`);
                }
            });
            break;
            
        default:
            console.log('🔍 New Reply Detector (Cron Job)');
            console.log('\nUsage:');
            console.log('  node cron-new-replies.js check           - Check for new reply tweets');
            console.log('  node cron-new-replies.js recent [limit]  - Show recent reply contexts');
            console.log('\nExamples:');
            console.log('  node cron-new-replies.js check           - Run cron job');
            console.log('  node cron-new-replies.js recent 5        - Show 5 recent contexts');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewReplyDetector;
