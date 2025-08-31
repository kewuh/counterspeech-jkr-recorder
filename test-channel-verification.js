const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const BASE_URL = 'https://www.junkipedia.org/api/v1';

async function testChannelVerification() {
  console.log('🔍 Testing Channel Verification for JK Rowling');
  console.log('==============================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test different possible channel IDs for JK Rowling
  const possibleChannelIds = [
    '10595539', // Current ID
    '62513246', // Twitter ID from channel data
    'jk_rowling', // Username
    'J.K. Rowling', // Display name
  ];

  for (const channelId of possibleChannelIds) {
    console.log(`🔍 Testing Channel ID: ${channelId}`);
    
    try {
      // Test channel info
      const channelResponse = await client.get(`/channels/${channelId}`);
      console.log(`✅ Channel Info Success!`);
      const channelData = channelResponse.data.data?.attributes;
      
      if (channelData) {
        console.log(`   📝 Name: ${channelData.channel_name}`);
        console.log(`   🆔 Channel ID: ${channelData.id}`);
        console.log(`   🐦 Username: ${channelData.channel_uid}`);
        console.log(`   📅 Latest Post: ${channelData.latest_post_date}`);
        console.log(`   📊 Total Posts: ${channelData.post_count}`);
        console.log(`   👥 Followers: ${channelData.follower_count}`);
      }
      
      // Test posts for this channel
      const postsResponse = await client.get('/posts', { 
        params: { 
          limit: 5, 
          channel_id: channelId,
          start_date: '2025-08-29' // Start from the latest_post_date
        } 
      });
      
      console.log(`   📊 Posts found: ${postsResponse.data.data?.length || 0}`);
      
      if (postsResponse.data.data && postsResponse.data.data.length > 0) {
        postsResponse.data.data.forEach((post, index) => {
          const postData = post.attributes?.search_data_fields || {};
          const text = postData.sanitized_text || '';
          const author = postData.author || 'unknown';
          const publishedAt = post.attributes?.published_at || 'unknown';
          
          console.log(`   📝 Post ${index + 1}:`);
          console.log(`      👤 Author: ${author}`);
          console.log(`      📅 Published: ${publishedAt}`);
          console.log(`      📝 Text: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
        });
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

  // Test search for JK Rowling posts
  console.log('🔍 Testing Search for JK Rowling Posts...');
  try {
    const searchResponse = await client.get('/posts/search', { 
      params: { 
        q: 'JK Rowling',
        limit: 10
      } 
    });
    
    console.log(`✅ Search Success!`);
    console.log(`📊 Posts found: ${searchResponse.data.data?.length || 0}`);
    
    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      searchResponse.data.data.forEach((post, index) => {
        const postData = post.attributes?.search_data_fields || {};
        const text = postData.sanitized_text || '';
        const author = postData.author || 'unknown';
        const publishedAt = post.attributes?.published_at || 'unknown';
        
        console.log(`   📝 Post ${index + 1}:`);
        console.log(`      👤 Author: ${author}`);
        console.log(`      📅 Published: ${publishedAt}`);
        console.log(`      📝 Text: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Search Failed: ${error.message}`);
  }

  console.log('\n🎯 Channel verification completed!');
}

testChannelVerification().catch(console.error);
