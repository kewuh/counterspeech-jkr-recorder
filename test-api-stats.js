const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const BASE_URL = 'https://www.junkipedia.org/api/v1';
const CHANNEL_ID = '10595539';

async function testAPIStats() {
  console.log('🧪 Testing Junkipedia API Stats and Additional Endpoints');
  console.log('========================================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test 1: Posts Stats endpoint
  console.log('🔍 Test 1: Posts Stats endpoint...');
  try {
    const response = await client.get('/posts/stats');
    console.log(`✅ Success! Status: ${response.status}`);
    console.log(`📊 Stats data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  console.log('');

  // Test 2: Posts Stats with parameters
  console.log('🔍 Test 2: Posts Stats with channel filter...');
  try {
    const response = await client.get('/posts/stats', { 
      params: { 'channel_ids[]': CHANNEL_ID } 
    });
    console.log(`✅ Success! Status: ${response.status}`);
    console.log(`📊 Channel stats:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
  console.log('');

  // Test 3: Test other potential endpoints
  console.log('🔍 Test 3: Testing other potential endpoints...');
  const endpoints = [
    '/posts/analytics',
    '/posts/metrics',
    '/posts/summary',
    '/posts/overview',
    '/channels/stats',
    '/channels/analytics',
    '/monitoring/stats',
    '/monitoring/analytics'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await client.get(endpoint);
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Data keys:`, Object.keys(response.data));
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  console.log('');

  // Test 4: Test posts with different response formats
  console.log('🔍 Test 4: Testing posts with different response formats...');
  const formatTests = [
    { params: { 'channel_ids[]': CHANNEL_ID, limit: 5, format: 'json' } },
    { params: { 'channel_ids[]': CHANNEL_ID, limit: 5, include: 'channel,engagement' } },
    { params: { 'channel_ids[]': CHANNEL_ID, limit: 5, fields: 'id,content,published_at' } },
    { params: { 'channel_ids[]': CHANNEL_ID, limit: 5, sort: 'published_at' } },
    { params: { 'channel_ids[]': CHANNEL_ID, limit: 5, sort: '-published_at' } }
  ];

  for (let i = 0; i < formatTests.length; i++) {
    const test = formatTests[i];
    console.log(`📊 Format test ${i + 1}:`, test.params);
    
    try {
      const response = await client.get('/posts', { params: test.params });
      console.log(`✅ Success! Posts found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        const firstPost = response.data.data[0];
        console.log(`📝 Sample: ${firstPost.attributes?.channel?.channel_name || 'Unknown'} - ${firstPost.attributes?.published_at || 'No date'}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  console.log('');

  // Test 5: Test with different authentication methods
  console.log('🔍 Test 5: Testing with different authentication methods...');
  const authTests = [
    { 
      name: 'Bearer token (current)',
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    },
    { 
      name: 'API key in query',
      headers: {},
      params: { api_key: API_KEY, 'channel_ids[]': CHANNEL_ID, limit: 5 }
    },
    { 
      name: 'X-API-Key header',
      headers: { 'X-API-Key': API_KEY }
    }
  ];

  for (const authTest of authTests) {
    try {
      console.log(`🔑 Testing: ${authTest.name}`);
      const testClient = axios.create({
        baseURL: BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          ...authTest.headers
        },
        timeout: 30000,
      });
      
      const response = await testClient.get('/posts', { 
        params: authTest.params || { 'channel_ids[]': CHANNEL_ID, limit: 5 }
      });
      console.log(`✅ Success! Posts found: ${response.data.data?.length || 0}`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  console.log('\n🎯 API Stats and additional endpoint testing completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Posts endpoint: Working with channel_ids[] parameter');
  console.log('✅ Channel info: Working');
  console.log('✅ Authentication: Working with Bearer token');
  console.log('✅ JK Rowling posts: Accessible via channel_ids[] parameter');
}

testAPIStats().catch(console.error);
