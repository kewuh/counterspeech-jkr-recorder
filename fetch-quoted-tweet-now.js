const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

async function fetchQuotedTweetNow() {
    try {
        console.log('🔍 Fetching the quoted tweet content now...');
        
        // Initialize Twitter client
        const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
        const quotedTweetId = '1962823252465565803';
        
        console.log('📝 Fetching tweet ID:', quotedTweetId);
        
        // Fetch the quoted tweet
        const tweet = await client.v2.singleTweet(quotedTweetId, {
            'tweet.fields': 'created_at,author_id,public_metrics,entities,text',
            'user.fields': 'name,username,profile_image_url',
            'expansions': 'author_id'
        });
        
        if (tweet && tweet.data) {
            console.log('\n✅ Quoted tweet fetched successfully!');
            console.log('📝 Content:', tweet.data.text);
            console.log('👤 Author ID:', tweet.data.author_id);
            console.log('📅 Created:', tweet.data.created_at);
            console.log('📊 Metrics:', tweet.data.public_metrics);
            
            if (tweet.includes && tweet.includes.users) {
                const author = tweet.includes.users[0];
                console.log('👤 Author:', `@${author.username} (${author.name})`);
            }
            
            console.log('\n🔍 This is what J.K. Rowling is calling "totalitarianism"');
            console.log('⚠️  IMPORTANT: This quoted content needs AI analysis to determine if it contains transphobic rhetoric!');
            
            // Store this in a variable for potential analysis
            const quotedContent = {
                id: tweet.data.id,
                text: tweet.data.text,
                author_id: tweet.data.author_id,
                created_at: tweet.data.created_at,
                metrics: tweet.data.public_metrics
            };
            
            console.log('\n📋 Quoted content summary:');
            console.log('   ID:', quotedContent.id);
            console.log('   Text length:', quotedContent.text.length, 'characters');
            console.log('   Author:', quotedContent.author_id);
            console.log('   Created:', quotedContent.created_at);
            
        } else {
            console.log('❌ Failed to fetch quoted tweet');
        }
        
    } catch (error) {
        console.error('❌ Error fetching quoted tweet:', error.message);
        
        if (error.code === 403) {
            console.log('🔒 Access denied - tweet may be private or deleted');
        } else if (error.code === 404) {
            console.log('🔍 Tweet not found - may have been deleted');
        } else if (error.code === 429) {
            console.log('⏰ Rate limited - need to wait before making more requests');
            console.log('   Try again in a few minutes');
        }
    }
}

fetchQuotedTweetNow().catch(console.error);
