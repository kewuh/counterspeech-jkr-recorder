const axios = require('axios');

console.log('🧪 Junkipedia API Demo');
console.log('======================\n');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';

// Test different base URLs
const baseUrls = [
  'https://www.junkipedia.org/api/v1',
  'https://junkipedia.org/api/v1',
  'https://api.junkipedia.org/v1'
];

async function testEndpoint(baseUrl, endpoint) {
  try {
    console.log(`🔍 Testing: ${baseUrl}${endpoint}`);
    
    const response = await axios.get(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Junkipedia-Demo/1.0.0'
      },
      timeout: 10000
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log(`📊 Response data:`, JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function runDemo() {
  console.log('🚀 Testing Junkipedia API endpoints...\n');
  
  // Test channel info endpoint
  console.log('📡 Testing channel info endpoints:');
  for (const baseUrl of baseUrls) {
    await testEndpoint(baseUrl, `/channels/${CHANNEL_ID}`);
    console.log('');
  }
  
  // Test posts endpoint
  console.log('📝 Testing posts endpoints:');
  for (const baseUrl of baseUrls) {
    await testEndpoint(baseUrl, `/posts?channel_id=${CHANNEL_ID}&limit=5`);
    console.log('');
  }
  
  console.log('🎯 Demo completed!');
  console.log('💡 Check the output above to see which endpoints work.');
}

runDemo().catch(console.error);
