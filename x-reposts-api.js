const axios = require('axios');
const config = require('./config');

class XRepostsAPI {
    constructor() {
        this.bearerToken = config.twitter.bearerToken;
        this.userId = '62513246'; // JK Rowling's Twitter user ID
        this.client = axios.create({
            baseURL: 'https://api.twitter.com/2',
            headers: {
                'Authorization': `Bearer ${this.bearerToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }

    /**
     * Get JK Rowling's recent timeline including reposts
     * Minimizes API calls by fetching all timeline items in one call
     */
    async getRecentTimeline(maxResults = 100) {
        try {
            console.log('🔍 Fetching JK Rowling\'s recent timeline from X API...');
            
            const params = {
                max_results: maxResults,
                'tweet.fields': 'created_at,author_id,referenced_tweets,public_metrics,entities,context_annotations',
                'user.fields': 'name,username,profile_image_url',
                expansions: 'author_id,referenced_tweets.id',
                exclude: 'retweets,replies' // We want reposts, not retweets
            };

            const response = await this.client.get(`/users/${this.userId}/tweets`, { params });
            
            if (!response.data || !response.data.data) {
                console.log('📝 No tweets found in timeline');
                return { tweets: [], reposts: [] };
            }

            const tweets = response.data.data;
            console.log(`📊 Found ${tweets.length} tweets in timeline`);

            // Separate reposts from regular tweets
            const reposts = tweets.filter(tweet => {
                return tweet.referenced_tweets && 
                       tweet.referenced_tweets.some(ref => ref.type === 'retweeted');
            });

            const regularTweets = tweets.filter(tweet => {
                return !tweet.referenced_tweets || 
                       !tweet.referenced_tweets.some(ref => ref.type === 'retweeted');
            });

            console.log(`🔄 Found ${reposts.length} reposts out of ${tweets.length} total tweets`);

            return {
                tweets: regularTweets,
                reposts: reposts,
                includes: response.data.includes || {}
            };

        } catch (error) {
            console.error('❌ Error fetching timeline from X API:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Get only the latest repost (minimal API call)
     */
    async getLatestRepost() {
        try {
            console.log('🔍 Fetching JK Rowling\'s latest repost from X API...');
            
            const params = {
                max_results: 10, // Small number to minimize API usage
                'tweet.fields': 'created_at,author_id,referenced_tweets,public_metrics,entities',
                'user.fields': 'name,username,profile_image_url',
                expansions: 'author_id,referenced_tweets.id',
                exclude: 'retweets,replies'
            };

            const response = await this.client.get(`/users/${this.userId}/tweets`, { params });
            
            if (!response.data || !response.data.data) {
                console.log('📝 No tweets found');
                return null;
            }

            const tweets = response.data.data;
            
            // Find the first repost
            const latestRepost = tweets.find(tweet => {
                return tweet.referenced_tweets && 
                       tweet.referenced_tweets.some(ref => ref.type === 'retweeted');
            });

            if (latestRepost) {
                console.log(`🔄 Found latest repost: ${latestRepost.id}`);
                console.log(`📅 Created at: ${latestRepost.created_at}`);
                
                // Get the original tweet ID
                const originalTweetRef = latestRepost.referenced_tweets.find(ref => ref.type === 'retweeted');
                if (originalTweetRef) {
                    console.log(`🔗 Original tweet ID: ${originalTweetRef.id}`);
                }
            } else {
                console.log('📝 No reposts found in recent timeline');
            }

            return latestRepost;

        } catch (error) {
            console.error('❌ Error fetching latest repost:', error.message);
            throw error;
        }
    }

    /**
     * Get detailed information about a specific repost and its original tweet
     */
    async getRepostDetails(repostId) {
        try {
            console.log(`🔍 Fetching details for repost ${repostId}...`);
            
            const params = {
                'tweet.fields': 'created_at,author_id,referenced_tweets,public_metrics,entities,context_annotations',
                'user.fields': 'name,username,profile_image_url',
                expansions: 'author_id,referenced_tweets.id',
            };

            const response = await this.client.get(`/tweets/${repostId}`, { params });
            
            if (!response.data || !response.data.data) {
                console.log('📝 Repost not found');
                return null;
            }

            const repost = response.data.data;
            const includes = response.data.includes || {};

            // Get the original tweet if referenced
            let originalTweet = null;
            if (repost.referenced_tweets) {
                const originalTweetRef = repost.referenced_tweets.find(ref => ref.type === 'retweeted');
                if (originalTweetRef && includes.tweets) {
                    originalTweet = includes.tweets.find(tweet => tweet.id === originalTweetRef.id);
                }
            }

            return {
                repost: repost,
                originalTweet: originalTweet,
                includes: includes
            };

        } catch (error) {
            console.error('❌ Error fetching repost details:', error.message);
            throw error;
        }
    }

    /**
     * Check if we have new reposts since last check
     */
    async checkForNewReposts(lastProcessedTime) {
        try {
            console.log('🔍 Checking for new reposts...');
            
            const timeline = await this.getRecentTimeline(50);
            const reposts = timeline.reposts;

            if (reposts.length === 0) {
                console.log('📝 No reposts found');
                return [];
            }

            // Filter for new reposts
            const newReposts = reposts.filter(repost => {
                if (!lastProcessedTime) return true;
                return new Date(repost.created_at) > new Date(lastProcessedTime);
            });

            console.log(`🔄 Found ${newReposts.length} new reposts out of ${reposts.length} total reposts`);
            return newReposts;

        } catch (error) {
            console.error('❌ Error checking for new reposts:', error.message);
            throw error;
        }
    }

    /**
     * Format repost data for storage
     */
    formatRepostForStorage(repost, originalTweet = null) {
        return {
            junkipedia_id: `x_${repost.id}`,
            content: repost.text,
            author: 'J.K. Rowling',
            platform: 'twitter',
            post_type: 'repost',
            created_at: repost.created_at,
            published_at: repost.created_at,
            url: `https://twitter.com/jk_rowling/status/${repost.id}`,
            engagement_metrics: {
                likes: repost.public_metrics?.like_count || 0,
                retweets: repost.public_metrics?.retweet_count || 0,
                replies: repost.public_metrics?.reply_count || 0,
                quotes: repost.public_metrics?.quote_count || 0
            },
            tags: [],
            issues: [],
            raw_data: {
                id: repost.id,
                type: 'repost',
                attributes: {
                    id: repost.id,
                    published_at: repost.created_at,
                    search_data_fields: {
                        sanitized_text: repost.text
                    },
                    engagement_data: {
                        likes: repost.public_metrics?.like_count || 0,
                        retweets: repost.public_metrics?.retweet_count || 0,
                        replies: repost.public_metrics?.reply_count || 0,
                        quotes: repost.public_metrics?.quote_count || 0
                    },
                    post_data: {
                        referenced_tweets: repost.referenced_tweets || []
                    }
                },
                original_tweet: originalTweet ? {
                    id: originalTweet.id,
                    text: originalTweet.text,
                    author_id: originalTweet.author_id,
                    author_username: originalTweet.author_username || originalTweet.author_id,
                    author_name: originalTweet.author_name || originalTweet.author_id,
                    created_at: originalTweet.created_at,
                    public_metrics: originalTweet.public_metrics || {}
                } : null
            }
        };
    }
}

module.exports = XRepostsAPI;
