const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';
const BASE_URL = 'https://www.junkipedia.org/api/v1';

async function testReposts() {
  console.log('🔍 Testing Junkipedia API for Reposts');
  console.log('=====================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test different post types and parameters to find reposts
  const testQueries = [
    // Test all post types
    { limit: 20, channel_id: CHANNEL_ID, post_type: 'all' },
    { limit: 20, channel_id: CHANNEL_ID, post_type: 'tweet' },
    { limit: 20, channel_id: CHANNEL_ID, post_type: 'retweet' },
    { limit: 20, channel_id: CHANNEL_ID, post_type: 'repost' },
    { limit: 20, channel_id: CHANNEL_ID, post_type: 'quote' },
    { limit: 20, channel_id: CHANNEL_ID, post_type: 'reply' },
    
    // Test without post_type filter
    { limit: 20, channel_id: CHANNEL_ID },
    
    // Test with platform filter
    { limit: 20, channel_id: CHANNEL_ID, platform: 'twitter' },
    { limit: 20, channel_id: CHANNEL_ID, platform: 'twitter', post_type: 'all' },
    
    // Test recent posts (last 24 hours)
    { limit: 50, channel_id: CHANNEL_ID, start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    
    // Test with different date ranges
    { limit: 50, channel_id: CHANNEL_ID, start_date: '2025-01-01' },
    { limit: 50, channel_id: CHANNEL_ID, start_date: '2025-01-20' },
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`🔍 Test ${i + 1}: Testing with parameters:`, query);
    
    try {
      const response = await client.get('/posts', { params: query });
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Posts found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`📝 Analyzing posts for repost indicators...`);
        
        response.data.data.forEach((post, index) => {
          const postData = post.attributes?.search_data_fields || {};
          const text = postData.sanitized_text || '';
          const postType = post.post_type || 'unknown';
          const publishedAt = post.attributes?.published_at || 'unknown';
          
          console.log(`\n   Post ${index + 1}:`);
          console.log(`   📅 Published: ${publishedAt}`);
          console.log(`   🏷️  Post Type: ${postType}`);
          console.log(`   📝 Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
          
          // Look for repost indicators in the text
          if (text.toLowerCase().includes('repost') || 
              text.toLowerCase().includes('retweet') ||
              text.toLowerCase().includes('rt @') ||
              text.toLowerCase().includes('reposted')) {
            console.log(`   🔄 POTENTIAL REPOST DETECTED!`);
          }
          
          // Check for retweeted_status or similar fields
          if (postData.retweeted_status || postData.reposted_status || postData.shared_status) {
            console.log(`   🔄 REPOST DATA FOUND:`, postData.retweeted_status || postData.reposted_status || postData.shared_status);
          }
          
          // Check engagement metrics
          const engagement = post.attributes?.engagement_metrics || {};
          if (engagement.retweet_count > 0 || engagement.shares_count > 0) {
            console.log(`   📊 Engagement: RT: ${engagement.retweet_count || 0}, Shares: ${engagement.shares_count || 0}`);
          }
        });
      }
      
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

  // Test channel info to see what's available
  console.log('🔍 Testing Channel Info...');
  try {
    const channelResponse = await client.get(`/channels/${CHANNEL_ID}`);
    console.log(`✅ Channel Info Success!`);
    console.log(`📊 Channel Data:`, JSON.stringify(channelResponse.data, null, 2));
  } catch (error) {
    console.log(`❌ Channel Info Failed: ${error.message}`);
  }

  console.log('\n🎯 Repost testing completed!');
}

testReposts().catch(console.error);
