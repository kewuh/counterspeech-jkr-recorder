const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';

async function testMoreTweets() {
    console.log('🔍 Testing different approaches to get more tweets...\n');
    
    const client = axios.create({
        baseURL: 'https://www.junkipedia.org/api/v1',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Junkipedia-Supabase-Connector/1.0.0',
        },
        timeout: 30000,
    });

    // Test different approaches
    const tests = [
        { 
            name: 'Earlier date range (July)', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-07-01',
                end_date: '2025-07-31'
            } 
        },
        { 
            name: 'June date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-06-01',
                end_date: '2025-06-30'
            } 
        },
        { 
            name: 'May date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-05-01',
                end_date: '2025-05-31'
            } 
        },
        { 
            name: 'April date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-04-01',
                end_date: '2025-04-30'
            } 
        },
        { 
            name: 'March date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-03-01',
                end_date: '2025-03-31'
            } 
        },
        { 
            name: 'February date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-02-01',
                end_date: '2025-02-28'
            } 
        },
        { 
            name: 'January date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-01-01',
                end_date: '2025-01-31'
            } 
        },
        { 
            name: 'December 2024', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2024-12-01',
                end_date: '2024-12-31'
            } 
        },
        { 
            name: 'November 2024', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2024-11-01',
                end_date: '2024-11-30'
            } 
        },
        { 
            name: 'October 2024', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2024-10-01',
                end_date: '2024-10-31'
            } 
        },
    ];

    let totalNewTweets = 0;

    for (const test of tests) {
        console.log(`📡 Testing: ${test.name}`);
        console.log(`📊 Parameters:`, test.params);
        
        try {
            const response = await client.get('/posts', { params: test.params });
            const tweets = response.data.data || [];
            
            console.log(`✅ Got ${tweets.length} tweets`);
            
            if (tweets.length > 0) {
                const firstTweet = tweets[0];
                const lastTweet = tweets[tweets.length - 1];
                
                console.log(`   📅 First tweet: ${firstTweet.attributes?.published_at}`);
                console.log(`   📅 Last tweet: ${lastTweet.attributes?.published_at}`);
                console.log(`   🆔 First ID: ${firstTweet.id}`);
                console.log(`   🆔 Last ID: ${lastTweet.id}`);
                
                totalNewTweets += tweets.length;
                console.log(`   🎉 Found ${tweets.length} tweets in this date range!`);
            }
            
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            console.log('');
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`📊 Summary: Found ${totalNewTweets} additional tweets across different date ranges`);
}

testMoreTweets().catch(console.error);
