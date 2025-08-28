const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';

async function testDifferentApproaches() {
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
            name: 'Using page parameter', 
            params: { 'channel_ids[]': CHANNEL_ID, limit: 10, page: 1 } 
        },
        { 
            name: 'Using page parameter 2', 
            params: { 'channel_ids[]': CHANNEL_ID, limit: 10, page: 2 } 
        },
        { 
            name: 'Using cursor parameter', 
            params: { 'channel_ids[]': CHANNEL_ID, limit: 10, cursor: '10' } 
        },
        { 
            name: 'Using after parameter', 
            params: { 'channel_ids[]': CHANNEL_ID, limit: 10, after: '605760928' } 
        },
        { 
            name: 'Using before parameter', 
            params: { 'channel_ids[]': CHANNEL_ID, limit: 10, before: '603980444' } 
        },
        { 
            name: 'Different endpoint - search', 
            endpoint: '/posts/search',
            params: { 'channel_ids[]': CHANNEL_ID, limit: 10 } 
        },
        { 
            name: 'Channel posts endpoint', 
            endpoint: `/channels/${CHANNEL_ID}/posts`,
            params: { limit: 10 } 
        },
        { 
            name: 'With date range', 
            params: { 
                'channel_ids[]': CHANNEL_ID, 
                limit: 10, 
                start_date: '2025-08-01',
                end_date: '2025-08-31'
            } 
        },
    ];

    for (const test of tests) {
        console.log(`📡 Testing: ${test.name}`);
        console.log(`📊 Parameters:`, test.params);
        
        try {
            const endpoint = test.endpoint || '/posts';
            const response = await client.get(endpoint, { params: test.params });
            const tweets = response.data.data || [];
            
            console.log(`✅ Got ${tweets.length} tweets`);
            
            if (tweets.length > 0) {
                const firstTweet = tweets[0];
                const lastTweet = tweets[tweets.length - 1];
                
                console.log(`   📅 First tweet: ${firstTweet.attributes?.published_at}`);
                console.log(`   📅 Last tweet: ${lastTweet.attributes?.published_at}`);
                console.log(`   🆔 First ID: ${firstTweet.id}`);
                console.log(`   🆔 Last ID: ${lastTweet.id}`);
                
                // Check if these are different tweets
                if (firstTweet.id !== '605760928') {
                    console.log(`   🎉 NEW TWEETS FOUND!`);
                }
            }
            
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data:`, error.response.data);
            }
            console.log('');
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testDifferentApproaches().catch(console.error);
