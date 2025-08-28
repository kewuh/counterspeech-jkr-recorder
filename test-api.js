const JunkipediaAPI = require('./junkipedia-api');

async function testJunkipediaAPI() {
  console.log('🧪 Comprehensive Junkipedia API Test');
  console.log('====================================\n');

  const api = new JunkipediaAPI();

  // Test 1: Connection test
  console.log('🔍 Test 1: Connection Test');
  console.log('==========================');
  const connectionResult = await api.testConnection();
  
  if (connectionResult.success) {
    console.log(`✅ Connection successful!`);
    console.log(`📡 Base URL: ${connectionResult.baseUrl}`);
    console.log(`🔑 Method: ${connectionResult.method}`);
  } else {
    console.log('❌ All connection attempts failed');
    console.log('\n💡 Possible issues:');
    console.log('   - API key might be invalid or expired');
    console.log('   - API endpoints might have changed');
    console.log('   - Network connectivity issues');
    console.log('   - API might require different authentication');
  }

  console.log('\n🔍 Test 2: Channel Info Test');
  console.log('============================');
  try {
    const channelInfo = await api.getChannelInfo();
    console.log('✅ Channel info retrieved successfully!');
    console.log('📊 Channel data:', JSON.stringify(channelInfo, null, 2));
  } catch (error) {
    console.log('❌ Failed to get channel info:', error.message);
  }

  console.log('\n🔍 Test 3: Posts Test');
  console.log('=====================');
  try {
    const posts = await api.getChannelPosts({ limit: 5 });
    console.log('✅ Posts retrieved successfully!');
    console.log(`📊 Found ${posts.length} posts`);
    if (posts.length > 0) {
      console.log('📝 Sample post:', JSON.stringify(posts[0], null, 2));
    }
  } catch (error) {
    console.log('❌ Failed to get posts:', error.message);
  }

  console.log('\n🎯 Test completed!');
  console.log('\n📋 Next steps:');
  if (connectionResult.success) {
    console.log('✅ API connection is working! You can proceed with the main script.');
  } else {
    console.log('❌ API connection failed. Please check:');
    console.log('   1. Your API key is correct');
    console.log('   2. You have access to the Junkipedia API');
    console.log('   3. The API endpoints are accessible');
    console.log('   4. Your network connection is working');
  }
}

testJunkipediaAPI().catch(console.error);
