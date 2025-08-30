const { TwitterApi } = require('twitter-api-v2');
const config = require('./config');
const TwitterAPITracker = require('./twitter-api-tracker');

class TwitterAPIClient {
    constructor() {
        // Initialize with Bearer Token for read-only access
        this.client = new TwitterApi(config.twitter.bearerToken);
        this.readOnlyClient = this.client.readOnly;
        this.tracker = new TwitterAPITracker();
    }

    /**
     * Test the Twitter API connection
     */
    async testConnection() {
        try {
            console.log('🔍 Testing Twitter API connection...');
            
            // Try to get JK Rowling's user info
            const user = await this.readOnlyClient.v2.userByUsername('jk_rowling');
            this.tracker.logAPICall('/users/by/username/jk_rowling', 'GET', true);
            
            if (user.data) {
                console.log('✅ Twitter API connection successful!');
                console.log(`👤 User: ${user.data.name} (@${user.data.username})`);
                console.log(`🆔 User ID: ${user.data.id}`);
                return true;
            } else {
                console.log('❌ No user data returned');
                return false;
            }
        } catch (error) {
            this.tracker.logAPICall('/users/by/username/jk_rowling', 'GET', false, error);
            console.error('❌ Twitter API connection failed:', error.message);
            return false;
        }
    }

    /**
     * Get JK Rowling's recent tweets including replies
     */
    async getRecentTweets(maxResults = 100) {
        try {
            console.log(`📡 Fetching up to ${maxResults} recent tweets from JK Rowling...`);
            
            // Get JK Rowling's user ID first
            const user = await this.readOnlyClient.v2.userByUsername('jk_rowling');
            this.tracker.logAPICall('/users/by/username/jk_rowling', 'GET', true);
            
            if (!user.data) {
                throw new Error('Could not find JK Rowling user');
            }

            const userId = user.data.id;
            
            // Get recent tweets including replies
            const tweets = await this.readOnlyClient.v2.userTimeline(userId, {
                max_results: maxResults,
                'tweet.fields': [
                    'created_at',
                    'conversation_id',
                    'in_reply_to_user_id',
                    'referenced_tweets',
                    'public_metrics',
                    'context_annotations',
                    'entities'
                ],
                'user.fields': ['username', 'name', 'profile_image_url'],
                'expansions': ['referenced_tweets.id', 'in_reply_to_user_id']
            });
            this.tracker.logAPICall(`/users/${userId}/tweets`, 'GET', true);

            console.log(`✅ Retrieved ${tweets.data?.length || 0} tweets`);
            return tweets;
        } catch (error) {
            this.tracker.logAPICall('/users/timeline', 'GET', false, error);
            console.error('❌ Error fetching tweets:', error.message);
            throw error;
        }
    }

    /**
     * Get reply tweets specifically
     */
    async getReplyTweets(maxResults = 100) {
        try {
            console.log(`📝 Fetching up to ${maxResults} reply tweets from JK Rowling...`);
            
            const tweets = await this.getRecentTweets(maxResults);
            const replyTweets = [];

            for (const tweet of tweets.data || []) {
                // Check if this is a reply tweet
                if (tweet.referenced_tweets && tweet.referenced_tweets.some(ref => ref.type === 'replied_to')) {
                    replyTweets.push(tweet);
                }
            }

            console.log(`✅ Found ${replyTweets.length} reply tweets`);
            return replyTweets;
        } catch (error) {
            console.error('❌ Error fetching reply tweets:', error.message);
            throw error;
        }
    }

    /**
     * Get the original tweet being replied to
     */
    async getOriginalTweet(tweetId) {
        try {
            console.log(`🔍 Fetching original tweet ${tweetId}...`);
            
            const tweet = await this.readOnlyClient.v2.singleTweet(tweetId, {
                'tweet.fields': [
                    'created_at',
                    'conversation_id',
                    'public_metrics',
                    'context_annotations',
                    'entities'
                ],
                'user.fields': ['username', 'name', 'profile_image_url']
            });
            this.tracker.logAPICall(`/tweets/${tweetId}`, 'GET', true);

            if (tweet.data) {
                console.log(`✅ Found original tweet by @${tweet.includes?.users?.[0]?.username || 'unknown'}`);
                return tweet;
            } else {
                console.log(`❌ Tweet ${tweetId} not found or not accessible`);
                return null;
            }
        } catch (error) {
            this.tracker.logAPICall(`/tweets/${tweetId}`, 'GET', false, error);
            console.error(`❌ Error fetching tweet ${tweetId}:`, error.message);
            return null;
        }
    }

    /**
     * Get complete reply context (reply + original tweet)
     */
    async getReplyContext(maxResults = 50) {
        try {
            console.log(`🔍 Fetching reply context for up to ${maxResults} tweets...`);
            
            const replyTweets = await this.getReplyTweets(maxResults);
            const replyContexts = [];

            for (const replyTweet of replyTweets) {
                // Find the original tweet ID from referenced_tweets
                const originalTweetRef = replyTweet.referenced_tweets?.find(ref => ref.type === 'replied_to');
                
                if (originalTweetRef) {
                    const originalTweet = await this.getOriginalTweet(originalTweetRef.id);
                    
                    replyContexts.push({
                        reply_tweet: replyTweet,
                        original_tweet: originalTweet?.data || null,
                        original_user: originalTweet?.includes?.users?.[0] || null
                    });
                }
            }

            console.log(`✅ Retrieved context for ${replyContexts.length} reply tweets`);
            return replyContexts;
        } catch (error) {
            console.error('❌ Error fetching reply context:', error.message);
            throw error;
        }
    }

    /**
     * Get usage statistics
     */
    async getUsageStats() {
        try {
            // Note: Twitter API v2 doesn't provide usage stats via API
            // This would need to be tracked manually or checked in the developer portal
            console.log('📊 Usage statistics are available in the Twitter Developer Portal');
            console.log('🔗 Visit: https://developer.twitter.com/en/portal/dashboard');
            return {
                note: 'Check developer portal for usage statistics',
                url: 'https://developer.twitter.com/en/portal/dashboard'
            };
        } catch (error) {
            console.error('❌ Error getting usage stats:', error.message);
            return null;
        }
    }
}

module.exports = TwitterAPIClient;
