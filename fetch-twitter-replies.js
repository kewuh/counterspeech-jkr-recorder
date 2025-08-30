const TwitterAPIClient = require('./twitter-api');
const SupabaseClient = require('./supabase-client');

class TwitterReplyFetcher {
    constructor() {
        this.twitter = new TwitterAPIClient();
        this.supabase = new SupabaseClient();
    }

    /**
     * Fetch and store Twitter reply data
     */
    async fetchAndStoreReplies(maxResults = 50) {
        console.log('🚀 Starting Twitter Reply Data Collection...\n');
        
        try {
            // Test connections
            console.log('🔍 Testing connections...');
            const twitterConnected = await this.twitter.testConnection();
            const supabaseConnected = await this.supabase.initializeTable();
            
            if (!twitterConnected || !supabaseConnected) {
                console.log('❌ Connection test failed');
                return;
            }
            
            console.log('✅ All connections successful\n');
            
            // Fetch reply contexts
            console.log(`📡 Fetching up to ${maxResults} reply contexts...`);
            const replyContexts = await this.twitter.getReplyContext(maxResults);
            
            if (replyContexts.length === 0) {
                console.log('📝 No reply contexts found');
                return;
            }
            
            console.log(`\n📊 Processing ${replyContexts.length} reply contexts...`);
            
            let storedCount = 0;
            let skippedCount = 0;
            
            for (const context of replyContexts) {
                try {
                    const stored = await this.storeReplyContext(context);
                    if (stored) {
                        storedCount++;
                    } else {
                        skippedCount++;
                    }
                } catch (error) {
                    console.error(`❌ Error processing reply ${context.reply_tweet.id}:`, error.message);
                    skippedCount++;
                }
            }
            
            console.log(`\n✅ Processing complete!`);
            console.log(`   📥 Stored: ${storedCount} reply contexts`);
            console.log(`   ⏭️  Skipped: ${skippedCount} (already exists or errors)`);
            console.log(`   📊 Total processed: ${replyContexts.length}`);
            
        } catch (error) {
            console.error('❌ Error in fetchAndStoreReplies:', error.message);
        }
    }

    /**
     * Store a reply context in the database
     */
    async storeReplyContext(context) {
        const replyTweet = context.reply_tweet;
        const originalTweet = context.original_tweet;
        const originalUser = context.original_user;
        
        // Create a unique identifier for this reply context
        const replyContextId = `twitter_reply_${replyTweet.id}`;
        
        // Check if this reply context already exists
        const existing = await this.supabase.supabase
            .from('reply_contexts')
            .select('id')
            .eq('reply_context_id', replyContextId)
            .single();
            
        if (existing.data) {
            console.log(`   ⏭️  Reply context ${replyContextId} already exists, skipping`);
            return false;
        }
        
        // Prepare the data for storage
        const replyContextData = {
            reply_context_id: replyContextId,
            reply_tweet_id: replyTweet.id,
            reply_tweet_text: replyTweet.text,
            reply_tweet_created_at: replyTweet.created_at,
            reply_tweet_metrics: replyTweet.public_metrics || {},
            original_tweet_id: originalTweet?.id || null,
            original_tweet_text: originalTweet?.text || null,
            original_tweet_created_at: originalTweet?.created_at || null,
            original_tweet_metrics: originalTweet?.public_metrics || {},
            original_user_username: originalUser?.username || null,
            original_user_name: originalUser?.name || null,
            conversation_id: replyTweet.conversation_id || null,
            platform: 'twitter',
            raw_data: {
                reply_tweet: replyTweet,
                original_tweet: originalTweet,
                original_user: originalUser
            },
            inserted_at: new Date().toISOString()
        };
        
        // Store in database
        const { data, error } = await this.supabase.supabase
            .from('reply_contexts')
            .insert(replyContextData)
            .select();
            
        if (error) {
            console.error(`   ❌ Error storing reply context ${replyContextId}:`, error.message);
            return false;
        }
        
        console.log(`   ✅ Stored reply context: ${replyTweet.text.substring(0, 50)}...`);
        return true;
    }

    /**
     * Get statistics about stored reply contexts
     */
    async getReplyStats() {
        try {
            console.log('📊 Getting reply context statistics...');
            
            const { data, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*');
                
            if (error) {
                console.error('❌ Error getting reply stats:', error.message);
                return null;
            }
            
            const stats = {
                total_reply_contexts: data.length,
                with_original_tweet: data.filter(r => r.original_tweet_id).length,
                without_original_tweet: data.filter(r => !r.original_tweet_id).length,
                platforms: [...new Set(data.map(r => r.platform))],
                date_range: {
                    earliest: data.length > 0 ? Math.min(...data.map(r => new Date(r.reply_tweet_created_at))) : null,
                    latest: data.length > 0 ? Math.max(...data.map(r => new Date(r.reply_tweet_created_at))) : null
                }
            };
            
            console.log('📊 Reply Context Statistics:');
            console.log(`   📝 Total reply contexts: ${stats.total_reply_contexts}`);
            console.log(`   ✅ With original tweet: ${stats.with_original_tweet}`);
            console.log(`   ❌ Without original tweet: ${stats.without_original_tweet}`);
            console.log(`   🌐 Platforms: ${stats.platforms.join(', ')}`);
            
            if (stats.date_range.earliest && stats.date_range.latest) {
                console.log(`   📅 Date range: ${stats.date_range.earliest.toDateString()} to ${stats.date_range.latest.toDateString()}`);
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting reply stats:', error.message);
            return null;
        }
    }
}

// CLI interface
async function main() {
    const fetcher = new TwitterReplyFetcher();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'fetch':
            const maxResults = parseInt(args[1]) || 50;
            await fetcher.fetchAndStoreReplies(maxResults);
            break;
            
        case 'stats':
            await fetcher.getReplyStats();
            break;
            
        default:
            console.log('🚀 Twitter Reply Fetcher');
            console.log('\nUsage:');
            console.log('  node fetch-twitter-replies.js fetch [maxResults]  - Fetch and store reply contexts');
            console.log('  node fetch-twitter-replies.js stats               - Show reply context statistics');
            console.log('\nExamples:');
            console.log('  node fetch-twitter-replies.js fetch 25            - Fetch 25 reply contexts');
            console.log('  node fetch-twitter-replies.js stats               - Show statistics');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TwitterReplyFetcher;
