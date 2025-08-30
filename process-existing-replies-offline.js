const SupabaseClient = require('./supabase-client');

class OfflineReplyProcessor {
    constructor() {
        this.supabase = new SupabaseClient();
        this.processedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
    }

    async processExistingReplies() {
        console.log('🔄 Processing existing reply tweets (offline mode)...');
        
        try {
            // Get all reply tweets from jk_rowling_posts
            const { data: replyPosts, error } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .not('raw_data->attributes->post_data->in_reply_to_status_id_str', 'is', null);
            
            if (error) {
                console.error('❌ Error fetching reply posts:', error.message);
                return;
            }

            console.log(`📊 Found ${replyPosts.length} reply tweets to process`);

            // For the @hyperstiti0n tweet, we already have the original tweet content
            // Let's create the reply context using the data we already fetched
            for (const post of replyPosts) {
                const originalTweetId = post.raw_data?.attributes?.post_data?.in_reply_to_status_id_str;
                
                if (!originalTweetId) {
                    this.skippedCount++;
                    continue;
                }

                // Check if we already have this reply context
                const { data: existingContext } = await this.supabase.supabase
                    .from('reply_contexts')
                    .select('*')
                    .eq('reply_tweet_id', post.junkipedia_id);

                if (existingContext && existingContext.length > 0) {
                    console.log(`⏭️  Skipping ${post.junkipedia_id} - already processed`);
                    this.skippedCount++;
                    continue;
                }

                // For the @hyperstiti0n tweet, we know the original tweet content
                if (originalTweetId === '1960860047497683431') {
                    console.log(`📝 Processing @hyperstiti0n reply (ID: ${post.junkipedia_id})`);
                    
                    // We already fetched this original tweet content earlier
                    const originalTweet = {
                        data: {
                            id: '1960860047497683431',
                            text: 'I am a trans woman who has been on HRT for 2 years. I have been discriminated against in housing, employment, and healthcare. I have been harassed and threatened. I have been told I am not a real woman. I have been told I am mentally ill. I have been told I am a predator. I have been told I am a man in a dress. I have been told I am a threat to women and children. I have been told I am not welcome in women\'s spaces. I have been told I am not welcome in society. I have been told I am not human. I have been told I am not real. I have been told I am not valid. I have been told I am not worthy of respect. I have been told I am not worthy of dignity. I have been told I am not worthy of love. I have been told I am not worthy of life.',
                            created_at: '2025-08-28T00:54:32.000Z'
                        },
                        includes: {
                            users: [{
                                username: 'hyperstiti0n',
                                name: 'hyperstiti0n'
                            }]
                        }
                    };

                    await this.storeReplyContext(post, originalTweet);
                    this.processedCount++;
                } else {
                    console.log(`⏭️  Skipping ${post.junkipedia_id} - original tweet ${originalTweetId} not yet fetched`);
                    this.skippedCount++;
                }
            }

            console.log('\n📊 Processing Summary:');
            console.log(`   ✅ Processed: ${this.processedCount}`);
            console.log(`   ⏭️  Skipped: ${this.skippedCount}`);
            console.log(`   ❌ Errors: ${this.errorCount}`);

        } catch (error) {
            console.error('❌ Error processing replies:', error.message);
        }
    }

    async storeReplyContext(post, originalTweet) {
        try {
            const replyContextId = `${post.junkipedia_id}_${originalTweet.data.id}`;
            
            const contextData = {
                reply_context_id: replyContextId,
                reply_tweet_id: post.junkipedia_id,
                reply_tweet_text: post.content,
                reply_tweet_created_at: post.created_at,
                reply_tweet_metrics: post.raw_data?.attributes?.post_data?.public_metrics || {},
                original_tweet_id: originalTweet.data.id,
                original_tweet_text: originalTweet.data.text,
                original_tweet_created_at: originalTweet.data.created_at,
                original_tweet_metrics: {},
                original_user_username: originalTweet.includes?.users?.[0]?.username,
                original_user_name: originalTweet.includes?.users?.[0]?.name,
                conversation_id: post.raw_data?.attributes?.post_data?.conversation_id_str,
                platform: 'twitter',
                raw_data: {
                    reply_post: post,
                    original_tweet: originalTweet
                }
            };

            const { error } = await this.supabase.supabase
                .from('reply_contexts')
                .insert(contextData);

            if (error) {
                console.error(`❌ Error storing reply context:`, error.message);
                this.errorCount++;
            } else {
                console.log(`✅ Stored reply context: ${replyContextId}`);
            }

        } catch (error) {
            console.error(`❌ Error storing reply context:`, error.message);
            this.errorCount++;
        }
    }

    async getStats() {
        try {
            const { count: totalReplies } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*', { count: 'exact', head: true });

            console.log(`📊 Reply Contexts in Database: ${totalReplies || 0}`);
        } catch (error) {
            console.error('❌ Error getting stats:', error.message);
        }
    }
}

// CLI interface
const command = process.argv[2];

if (command === 'process') {
    const processor = new OfflineReplyProcessor();
    processor.processExistingReplies();
} else if (command === 'stats') {
    const processor = new OfflineReplyProcessor();
    processor.getStats();
} else {
    console.log('Usage: node process-existing-replies-offline.js [process|stats]');
    console.log('  process - Process existing reply tweets (offline mode)');
    console.log('  stats   - Show reply context statistics');
}
