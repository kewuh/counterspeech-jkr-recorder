const TwitterAPIClient = require('./twitter-api');
const SupabaseClient = require('./supabase-client');

class ExistingReplyProcessor {
    constructor() {
        this.twitter = new TwitterAPIClient();
        this.supabase = new SupabaseClient();
    }

    /**
     * Process existing reply tweets from our database
     */
    async processExistingReplies() {
        console.log('🔍 Processing existing reply tweets from database...\n');
        
        try {
            // Get all posts from database that are replies
            const { data: posts, error } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .not('raw_data->attributes->post_data->in_reply_to_status_id_str', 'is', null);
                
            if (error) {
                console.error('❌ Error fetching posts:', error.message);
                return;
            }
            
            console.log(`📊 Found ${posts.length} reply tweets in database`);
            
            // Process each reply tweet
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            
            for (const post of posts) {
                try {
                    const replyTweetId = post.raw_data?.attributes?.post_data?.in_reply_to_status_id_str;
                    const originalTweetId = post.raw_data?.attributes?.post_data?.in_reply_to_status_id_str;
                    
                    if (!originalTweetId) {
                        console.log(`   ⏭️  No original tweet ID for post ${post.junkipedia_id}, skipping`);
                        continue;
                    }
                    
                    console.log(`\n📝 Processing reply tweet ${post.junkipedia_id}:`);
                    console.log(`   💬 Reply: ${post.content?.substring(0, 100)}...`);
                    console.log(`   🔗 Original tweet ID: ${originalTweetId}`);
                    
                    // Check if we already have this reply context
                    const existingContext = await this.supabase.supabase
                        .from('reply_contexts')
                        .select('id')
                        .eq('reply_tweet_id', post.junkipedia_id)
                        .single();
                        
                    if (existingContext.data) {
                        console.log(`   ✅ Reply context already exists, skipping`);
                        continue;
                    }
                    
                    // Fetch original tweet (single API call)
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
                    if (processedCount % 5 === 0) {
                        console.log(`   ⏳ Waiting 2 seconds for rate limiting...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    
                } catch (error) {
                    console.error(`   ❌ Error processing post ${post.junkipedia_id}:`, error.message);
                    errorCount++;
                }
            }
            
            console.log(`\n✅ Processing complete!`);
            console.log(`   📊 Total processed: ${processedCount}`);
            console.log(`   ✅ Successful: ${successCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            
        } catch (error) {
            console.error('❌ Error in processExistingReplies:', error.message);
        }
    }

    /**
     * Store reply context in database
     */
    async storeReplyContext(post, originalTweet) {
        const replyContextData = {
            reply_context_id: `junkipedia_${post.junkipedia_id}`,
            reply_tweet_id: post.junkipedia_id,
            reply_tweet_text: post.content,
            reply_tweet_created_at: post.published_at,
            reply_tweet_metrics: post.engagement_metrics || {},
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
     * Get statistics about processed replies
     */
    async getStats() {
        try {
            const { data, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*');
                
            if (error) {
                console.error('❌ Error getting stats:', error.message);
                return null;
            }
            
            console.log('📊 Reply Context Statistics:');
            console.log(`   📝 Total reply contexts: ${data.length}`);
            console.log(`   ✅ With original tweet: ${data.filter(r => r.original_tweet_id).length}`);
            console.log(`   ❌ Without original tweet: ${data.filter(r => !r.original_tweet_id).length}`);
            
            // Show some examples
            if (data.length > 0) {
                console.log('\n📝 Recent examples:');
                data.slice(0, 3).forEach((context, i) => {
                    console.log(`   ${i + 1}. Reply: ${context.reply_tweet_text?.substring(0, 60)}...`);
                    if (context.original_tweet_text) {
                        console.log(`      Original: ${context.original_tweet_text?.substring(0, 60)}...`);
                    }
                });
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ Error getting stats:', error.message);
            return null;
        }
    }
}

// CLI interface
async function main() {
    const processor = new ExistingReplyProcessor();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'process':
            await processor.processExistingReplies();
            break;
            
        case 'stats':
            await processor.getStats();
            break;
            
        default:
            console.log('🔍 Existing Reply Processor');
            console.log('\nUsage:');
            console.log('  node process-existing-replies.js process  - Process existing reply tweets');
            console.log('  node process-existing-replies.js stats     - Show statistics');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ExistingReplyProcessor;
