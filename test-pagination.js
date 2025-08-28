const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';

async function testPagination() {
    console.log('🔍 Testing Junkipedia API pagination...\n');
    
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
        { name: 'Default (no offset)', params: { 'channel_ids[]': CHANNEL_ID, limit: 10 } },
        { name: 'With offset 10', params: { 'channel_ids[]': CHANNEL_ID, limit: 10, offset: 10 } },
        { name: 'With offset 20', params: { 'channel_ids[]': CHANNEL_ID, limit: 10, offset: 20 } },
        { name: 'Higher limit', params: { 'channel_ids[]': CHANNEL_ID, limit: 50 } },
        { name: 'With sort', params: { 'channel_ids[]': CHANNEL_ID, limit: 10, sort: '-published_at' } },
        { name: 'Different sort', params: { 'channel_ids[]': CHANNEL_ID, limit: 10, sort: 'published_at' } },
    ];

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
            }
            
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            console.log('');
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testPagination().catch(console.error);
