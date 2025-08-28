const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const BASE_URL = 'https://www.junkipedia.org/api/v1';
const CHANNEL_ID = '10595539';

async function testJKRowlingSpecific() {
  console.log('🔍 Testing JK Rowling Posts Access');
  console.log('==================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test different approaches based on the web interface URL structure
  const testMethods = [
    {
      name: 'Channel IDs array parameter',
      params: { 'channel_ids[]': CHANNEL_ID, limit: 10 }
    },
    {
      name: 'Channel IDs array parameter (alternative)',
      params: { channel_ids: [CHANNEL_ID], limit: 10 }
    },
    {
      name: 'List IDs parameter (from web URL)',
      params: { 'list_ids[]': 'all-junkipedia', limit: 10 }
    },
    {
      name: 'Channel ID with list IDs',
      params: { 'channel_ids[]': CHANNEL_ID, 'list_ids[]': 'all-junkipedia', limit: 10 }
    },
    {
      name: 'Monitoring endpoint approach',
      params: { channel_id: CHANNEL_ID, limit: 10 }
    },
    {
      name: 'With platform specification',
      params: { 'channel_ids[]': CHANNEL_ID, platform: 'twitter', limit: 10 }
    },
    {
      name: 'With recent date filter',
      params: { 
        'channel_ids[]': CHANNEL_ID, 
        start_date: '2025-08-01',
        end_date: '2025-08-28',
        limit: 10 
      }
    },
    {
      name: 'With engagement filter',
      params: { 'channel_ids[]': CHANNEL_ID, min_engagement: 0, limit: 10 }
    },
    {
      name: 'With language filter',
      params: { 'channel_ids[]': CHANNEL_ID, language_code: 'EN', limit: 10 }
    },
    {
      name: 'Combined filters',
      params: { 
        'channel_ids[]': CHANNEL_ID, 
        platform: 'twitter',
        language_code: 'EN',
        start_date: '2025-08-01',
        limit: 10 
      }
    }
  ];

  for (let i = 0; i < testMethods.length; i++) {
    const method = testMethods[i];
    console.log(`🔍 Test ${i + 1}: ${method.name}`);
    console.log(`📊 Parameters:`, method.params);
    
    try {
      const response = await client.get('/posts', { params: method.params });
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Posts found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('📝 Sample posts:');
        response.data.data.slice(0, 3).forEach((post, index) => {
          const channelName = post.attributes?.channel?.channel_name || 'Unknown';
          const postText = post.attributes?.search_data_fields?.sanitized_text || 'No text';
          const publishedAt = post.attributes?.published_at || 'No date';
          console.log(`  ${index + 1}. ${channelName} (${publishedAt}): ${postText.substring(0, 80)}...`);
        });
      }
      
      // Check if we got JK Rowling's posts specifically
      if (response.data.data && response.data.data.length > 0) {
        const jkRowlingPosts = response.data.data.filter(post => 
          post.attributes?.channel?.channel_name === 'J.K. Rowling' ||
          post.attributes?.channel?.id === parseInt(CHANNEL_ID)
        );
        if (jkRowlingPosts.length > 0) {
          console.log(`🎉 Found ${jkRowlingPosts.length} JK Rowling posts!`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
    console.log('');
  }

  // Test alternative endpoints
  console.log('🔍 Testing alternative endpoints...');
  const alternativeEndpoints = [
    '/monitoring/posts',
    '/v1/monitoring/posts',
    '/posts/monitoring',
    '/channels/10595539/posts'
  ];

  for (const endpoint of alternativeEndpoints) {
    try {
      console.log(`📡 Testing endpoint: ${endpoint}`);
      const response = await client.get(endpoint, { params: { limit: 5 } });
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Posts found: ${response.data.data?.length || 0}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 JK Rowling specific testing completed!');
  console.log('\n💡 Insights:');
  console.log('- The web interface shows posts at: https://www.junkipedia.org/monitoring?channel_ids%5B%5D=10595539');
  console.log('- Channel ID 10595539 is confirmed to be JK Rowling');
  console.log('- API access might require different parameters or endpoints');
  console.log('- Consider checking API documentation for monitoring-specific endpoints');
}

testJKRowlingSpecific().catch(console.error);
