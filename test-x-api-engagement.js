const XRepostsAPI = require('./x-reposts-api');

async function testXAPIEngagement() {
    console.log('🧪 Testing X API engagement metrics capture...');
    
    const xApi = new XRepostsAPI();
    
    try {
        // Create a mock repost with realistic engagement data
        const mockRepost = {
            id: 'test_repost_id_123',
            text: 'This is a test repost with engagement metrics',
            created_at: new Date().toISOString(),
            public_metrics: {
                like_count: 1250,
                retweet_count: 340,
                reply_count: 89,
                quote_count: 45
            },
            referenced_tweets: [
                {
                    type: 'retweeted',
                    id: 'original_tweet_id_456'
                }
            ]
        };

        const mockOriginalTweet = {
            id: 'original_tweet_id_456',
            text: 'This is the original tweet that was reposted',
            author_id: 'original_author_789',
            author_username: 'original_author',
            author_name: 'Original Author',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            public_metrics: {
                like_count: 500,
                retweet_count: 120,
                reply_count: 30,
                quote_count: 15
            }
        };

        console.log('📝 Mock repost data:');
        console.log(`   🆔 Repost ID: ${mockRepost.id}`);
        console.log(`   📝 Text: ${mockRepost.text}`);
        console.log(`   ❤️  Likes: ${mockRepost.public_metrics.like_count}`);
        console.log(`   🔄 Retweets: ${mockRepost.public_metrics.retweet_count}`);
        console.log(`   💬 Replies: ${mockRepost.public_metrics.reply_count}`);
        console.log(`   📊 Quotes: ${mockRepost.public_metrics.quote_count}`);

        // Test the formatRepostForStorage method
        console.log('\n🔄 Testing formatRepostForStorage method...');
        const formattedRepost = xApi.formatRepostForStorage(mockRepost, mockOriginalTweet);

        console.log('✅ Formatted repost data:');
        console.log(`   🆔 Junkipedia ID: ${formattedRepost.junkipedia_id}`);
        console.log(`   📝 Content: ${formattedRepost.content}`);
        console.log(`   🏷️  Post Type: ${formattedRepost.post_type}`);
        console.log(`   ❤️  Likes: ${formattedRepost.engagement_metrics.likes}`);
        console.log(`   🔄 Retweets: ${formattedRepost.engagement_metrics.retweets}`);
        console.log(`   💬 Replies: ${formattedRepost.engagement_metrics.replies}`);
        console.log(`   📊 Quotes: ${formattedRepost.engagement_metrics.quotes}`);

        // Verify the engagement metrics are correctly mapped
        const metricsMatch = 
            formattedRepost.engagement_metrics.likes === mockRepost.public_metrics.like_count &&
            formattedRepost.engagement_metrics.retweets === mockRepost.public_metrics.retweet_count &&
            formattedRepost.engagement_metrics.replies === mockRepost.public_metrics.reply_count &&
            formattedRepost.engagement_metrics.quotes === mockRepost.public_metrics.quote_count;

        if (metricsMatch) {
            console.log('\n✅ Engagement metrics correctly mapped!');
        } else {
            console.log('\n❌ Engagement metrics mapping failed!');
        }

        // Test with zero engagement metrics
        console.log('\n🧪 Testing with zero engagement metrics...');
        const zeroEngagementRepost = {
            ...mockRepost,
            public_metrics: {
                like_count: 0,
                retweet_count: 0,
                reply_count: 0,
                quote_count: 0
            }
        };

        const formattedZeroRepost = xApi.formatRepostForStorage(zeroEngagementRepost, mockOriginalTweet);
        console.log('✅ Zero engagement repost:');
        console.log(`   ❤️  Likes: ${formattedZeroRepost.engagement_metrics.likes}`);
        console.log(`   🔄 Retweets: ${formattedZeroRepost.engagement_metrics.retweets}`);
        console.log(`   💬 Replies: ${formattedZeroRepost.engagement_metrics.replies}`);
        console.log(`   📊 Quotes: ${formattedZeroRepost.engagement_metrics.quotes}`);

        // Test with missing public_metrics
        console.log('\n🧪 Testing with missing public_metrics...');
        const noMetricsRepost = {
            ...mockRepost,
            public_metrics: null
        };

        const formattedNoMetricsRepost = xApi.formatRepostForStorage(noMetricsRepost, mockOriginalTweet);
        console.log('✅ No metrics repost (should default to 0):');
        console.log(`   ❤️  Likes: ${formattedNoMetricsRepost.engagement_metrics.likes}`);
        console.log(`   🔄 Retweets: ${formattedNoMetricsRepost.engagement_metrics.retweets}`);
        console.log(`   💬 Replies: ${formattedNoMetricsRepost.engagement_metrics.replies}`);
        console.log(`   📊 Quotes: ${formattedNoMetricsRepost.engagement_metrics.quotes}`);

    } catch (error) {
        console.error('❌ Error testing X API engagement:', error.message);
    }
}

testXAPIEngagement().catch(console.error);
