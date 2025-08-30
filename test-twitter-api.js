const TwitterAPIClient = require('./twitter-api');

async function testTwitterAPI() {
    console.log('🧪 Testing Twitter API Integration\n');
    
    const twitter = new TwitterAPIClient();
    
    try {
        // Test connection
        console.log('1️⃣ Testing API Connection...');
        const connectionTest = await twitter.testConnection();
        
        if (!connectionTest) {
            console.log('❌ Connection failed. Please check your TWITTER_BEARER_TOKEN in .env file');
            console.log('🔗 Get your Bearer Token from: https://developer.twitter.com/en/portal/dashboard');
            return;
        }
        
        console.log('\n2️⃣ Fetching Recent Reply Tweets...');
        const replyTweets = await twitter.getReplyTweets(10); // Get 10 reply tweets
        
        if (replyTweets.length === 0) {
            console.log('📝 No reply tweets found in recent tweets');
            return;
        }
        
        console.log(`\n📊 Found ${replyTweets.length} reply tweets:`);
        
        // Display first few reply tweets
        for (let i = 0; i < Math.min(3, replyTweets.length); i++) {
            const tweet = replyTweets[i];
            console.log(`\n📝 Reply Tweet ${i + 1}:`);
            console.log(`   🆔 ID: ${tweet.id}`);
            console.log(`   📅 Date: ${tweet.created_at}`);
            console.log(`   📄 Content: ${tweet.text}`);
            
            // Show who she's replying to
            const originalTweetRef = tweet.referenced_tweets?.find(ref => ref.type === 'replied_to');
            if (originalTweetRef) {
                console.log(`   👤 Replying to tweet: ${originalTweetRef.id}`);
            }
        }
        
        console.log('\n3️⃣ Fetching Complete Reply Context...');
        const replyContexts = await twitter.getReplyContext(3); // Get context for 3 replies
        
        console.log(`\n📊 Retrieved context for ${replyContexts.length} reply tweets:`);
        
        for (let i = 0; i < replyContexts.length; i++) {
            const context = replyContexts[i];
            console.log(`\n🔄 Reply Context ${i + 1}:`);
            
            // Original tweet
            if (context.original_tweet) {
                console.log(`   📝 Original Tweet:`);
                console.log(`      👤 By: @${context.original_user?.username || 'unknown'}`);
                console.log(`      📄 Content: ${context.original_tweet.text}`);
                console.log(`      📅 Date: ${context.original_tweet.created_at}`);
            } else {
                console.log(`   ❌ Original tweet not accessible`);
            }
            
            // Reply tweet
            console.log(`   💬 JK Rowling's Reply:`);
            console.log(`      📄 Content: ${context.reply_tweet.text}`);
            console.log(`      📅 Date: ${context.reply_tweet.created_at}`);
        }
        
        console.log('\n✅ Twitter API test completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Add your TWITTER_BEARER_TOKEN to .env file');
        console.log('   2. Run this script again to test with real data');
        console.log('   3. Use the TwitterAPIClient in your analysis scripts');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure you have a Twitter Developer account');
        console.log('   2. Get your Bearer Token from the developer portal');
        console.log('   3. Add TWITTER_BEARER_TOKEN to your .env file');
        console.log('   4. Check your API access level and rate limits');
    }
}

// Run the test
testTwitterAPI();
