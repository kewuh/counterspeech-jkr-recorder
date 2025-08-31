const axios = require('axios');
const config = require('./config');

async function testTwitterAPI() {
    console.log('🧪 Testing Twitter API Connection');
    console.log('================================\n');

    const bearerToken = config.twitter.bearerToken;
    const userId = '62513246'; // JK Rowling's Twitter user ID

    if (!bearerToken) {
        console.error('❌ No Twitter Bearer Token found in config');
        console.log('Please set TWITTER_BEARER_TOKEN in your .env file');
        return;
    }

    console.log(`🔑 Bearer Token: ${bearerToken.substring(0, 20)}...`);
    console.log(`👤 User ID: ${userId}`);

    const client = axios.create({
        baseURL: 'https://api.twitter.com/2',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
        },
        timeout: 30000,
    });

    try {
        // Test 1: Get user info
        console.log('\n🔍 Test 1: Getting user info...');
        const userResponse = await client.get(`/users/${userId}`);
        
        if (userResponse.data && userResponse.data.data) {
            const user = userResponse.data.data;
            console.log('✅ User info retrieved:');
            console.log(`   👤 Name: ${user.name}`);
            console.log(`   🐦 Username: ${user.username}`);
            console.log(`   📅 Created: ${user.created_at}`);
            console.log(`   📝 Description: ${user.description}`);
        }

        // Test 2: Get recent tweets
        console.log('\n🔍 Test 2: Getting recent tweets...');
        const tweetsResponse = await client.get(`/users/${userId}/tweets`, {
            params: {
                max_results: 10,
                'tweet.fields': 'created_at,author_id,referenced_tweets,public_metrics',
                'user.fields': 'name,username',
                expansions: 'author_id,referenced_tweets.id'
            }
        });

        if (tweetsResponse.data && tweetsResponse.data.data) {
            const tweets = tweetsResponse.data.data;
            console.log(`✅ Retrieved ${tweets.length} tweets:`);
            
            tweets.forEach((tweet, index) => {
                console.log(`\n   Tweet ${index + 1}:`);
                console.log(`   🆔 ID: ${tweet.id}`);
                console.log(`   📅 Created: ${tweet.created_at}`);
                console.log(`   📝 Text: ${tweet.text.substring(0, 100)}...`);
                
                if (tweet.referenced_tweets) {
                    console.log(`   🔗 Referenced tweets: ${tweet.referenced_tweets.length}`);
                    tweet.referenced_tweets.forEach(ref => {
                        console.log(`      Type: ${ref.type}, ID: ${ref.id}`);
                    });
                }
                
                if (tweet.public_metrics) {
                    console.log(`   📊 Metrics: ${JSON.stringify(tweet.public_metrics)}`);
                }
            });

            // Check for reposts
            const reposts = tweets.filter(tweet => 
                tweet.referenced_tweets && 
                tweet.referenced_tweets.some(ref => ref.type === 'retweeted')
            );

            console.log(`\n🔄 Found ${reposts.length} reposts out of ${tweets.length} tweets`);
            
            if (reposts.length > 0) {
                reposts.forEach((repost, index) => {
                    console.log(`\n   Repost ${index + 1}:`);
                    console.log(`   🆔 ID: ${repost.id}`);
                    console.log(`   📅 Created: ${repost.created_at}`);
                    console.log(`   📝 Text: ${repost.text.substring(0, 100)}...`);
                    
                    const originalTweetRef = repost.referenced_tweets.find(ref => ref.type === 'retweeted');
                    if (originalTweetRef) {
                        console.log(`   🔗 Original Tweet ID: ${originalTweetRef.id}`);
                    }
                });
            }
        }

    } catch (error) {
        console.error('❌ Twitter API Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }

    console.log('\n🎯 Test completed!');
}

testTwitterAPI().catch(console.error);
