const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';
const BASE_URL = 'https://www.junkipedia.org/api/v1';

async function testPostsEndpoint() {
  console.log('🧪 Testing JK Rowling Posts Endpoint');
  console.log('====================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test different query parameters
  const testQueries = [
    { limit: 5 },
    { limit: 10, channel_id: CHANNEL_ID },
    { limit: 5, channel_id: CHANNEL_ID, platform: 'twitter' },
    { limit: 5, channel_id: CHANNEL_ID, post_type: 'tweet' },
    { limit: 5, channel_id: CHANNEL_ID, platform: 'twitter', post_type: 'tweet' },
    { limit: 5, channel_id: CHANNEL_ID, platform: 'twitter', post_type: 'all' },
    { limit: 5, channel_id: CHANNEL_ID, platform: 'twitter', post_type: 'all', offset: 0 },
    { limit: 5, channel_id: CHANNEL_ID, platform: 'twitter', post_type: 'all', offset: 0, start_date: '2024-01-01' },
    { limit: 5, channel_id: CHANNEL_ID, platform: 'twitter', post_type: 'all', offset: 0, end_date: '2025-12-31' },
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`🔍 Test ${i + 1}: Testing with parameters:`, query);
    
    try {
      const response = await client.get('/posts', { params: query });
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Posts found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        const firstPost = response.data.data[0];
        console.log(`📝 Sample post: ${firstPost.attributes?.search_data_fields?.sanitized_text || 'No text'}`);
        console.log(`📅 Published: ${firstPost.attributes?.published_at || 'No date'}`);
      }
      
      console.log(`📄 Response structure:`, Object.keys(response.data));
      console.log('');
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log('');
    }
  }

  console.log('🎯 Posts endpoint testing completed!');
}

testPostsEndpoint().catch(console.error);
