const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const BASE_URL = 'https://www.junkipedia.org/api/v1';

async function testSearchMethods() {
  console.log('🔍 Testing Search Methods for JK Rowling');
  console.log('========================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test different search methods
  const searchTests = [
    { method: 'Keyword search: "JK Rowling"', params: { q: 'JK Rowling', limit: 5 } },
    { method: 'Keyword search: "jk_rowling"', params: { q: 'jk_rowling', limit: 5 } },
    { method: 'Keyword search: "J.K. Rowling"', params: { q: 'J.K. Rowling', limit: 5 } },
    { method: 'Keyword search: "Harry Potter"', params: { q: 'Harry Potter', limit: 5 } },
    { method: 'Username search: jk_rowling', params: { username: 'jk_rowling', limit: 5 } },
    { method: 'Author search: jk_rowling', params: { author: 'jk_rowling', limit: 5 } },
    { method: 'Channel name search: "J.K. Rowling"', params: { channel_name: 'J.K. Rowling', limit: 5 } },
    { method: 'Platform Twitter + keyword', params: { platform: 'twitter', q: 'JK Rowling', limit: 5 } },
  ];

  for (let i = 0; i < searchTests.length; i++) {
    const test = searchTests[i];
    console.log(`🔍 Test ${i + 1}: ${test.method}`);
    console.log(`📊 Parameters:`, test.params);
    
    try {
      const response = await client.get('/posts', { params: test.params });
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Posts found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        const firstPost = response.data.data[0];
        const channelName = firstPost.attributes?.channel?.channel_name || 'Unknown';
        const postText = firstPost.attributes?.search_data_fields?.sanitized_text || 'No text';
        console.log(`📝 Sample post from ${channelName}: ${postText.substring(0, 100)}...`);
        console.log(`📅 Published: ${firstPost.attributes?.published_at || 'No date'}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
      console.log('');
    }
  }

  // Test getting all available channels to see if we can find JK Rowling
  console.log('🔍 Test: Getting available channels...');
  try {
    const response = await client.get('/channels', { params: { limit: 10, q: 'Rowling' } });
    console.log(`✅ Success! Status: ${response.status}`);
    console.log(`📊 Channels found: ${response.data.data?.length || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      response.data.data.forEach((channel, index) => {
        const channelName = channel.attributes?.channel_name || 'Unknown';
        const channelId = channel.id;
        console.log(`📺 Channel ${index + 1}: ${channelName} (ID: ${channelId})`);
      });
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }

  console.log('\n🎯 Search testing completed!');
}

testSearchMethods().catch(console.error);
