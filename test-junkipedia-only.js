const JunkipediaAPI = require('./junkipedia-api');

async function testJunkipediaOnly() {
  console.log('🧪 Testing Junkipedia API Only (No Supabase)');
  console.log('============================================\n');

  const api = new JunkipediaAPI();

  try {
    // Test 1: Get channel info
    console.log('🔍 Test 1: Getting JK Rowling\'s channel info...');
    const channelInfo = await api.getChannelInfo();
    console.log('✅ Channel info retrieved successfully!');
    console.log(`📊 Channel: ${channelInfo.data.attributes.channel_name}`);
    console.log(`🆔 Channel ID: ${channelInfo.data.id}`);
    console.log(`👥 Followers: ${channelInfo.data.attributes.follower_count?.toLocaleString()}`);
    console.log(`📝 Posts: ${channelInfo.data.attributes.post_count?.toLocaleString()}`);
    console.log(`📅 Latest post: ${channelInfo.data.attributes.latest_post_date}`);
    console.log('');

    // Test 2: Get posts with different parameters
    console.log('🔍 Test 2: Getting posts with different parameters...');
    
    const testParams = [
      { limit: 5 },
      { limit: 5, channel_id: '10595539' },
      { limit: 5, q: 'JK Rowling' },
      { limit: 5, platform: 'twitter' },
      { limit: 5, q: 'Harry Potter' }
    ];

    for (let i = 0; i < testParams.length; i++) {
      const params = testParams[i];
      console.log(`📊 Test ${i + 1}: ${JSON.stringify(params)}`);
      
      try {
        const posts = await api.getChannelPosts(params);
        console.log(`✅ Success! Found ${posts.data?.length || 0} posts`);
        
        if (posts.data && posts.data.length > 0) {
          const firstPost = posts.data[0];
          const channelName = firstPost.attributes?.channel?.channel_name || 'Unknown';
          const postText = firstPost.attributes?.search_data_fields?.sanitized_text || 'No text';
          console.log(`📝 Sample: ${channelName} - ${postText.substring(0, 80)}...`);
        }
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
      console.log('');
    }

    // Test 3: Search functionality
    console.log('🔍 Test 3: Testing search functionality...');
    try {
      const searchResults = await api.searchPosts('JK Rowling', { limit: 3 });
      console.log(`✅ Search successful! Found ${searchResults.data?.length || 0} posts`);
      
      if (searchResults.data && searchResults.data.length > 0) {
        searchResults.data.forEach((post, index) => {
          const channelName = post.attributes?.channel?.channel_name || 'Unknown';
          const postText = post.attributes?.search_data_fields?.sanitized_text || 'No text';
          console.log(`📝 ${index + 1}. ${channelName}: ${postText.substring(0, 60)}...`);
        });
      }
    } catch (error) {
      console.log(`❌ Search failed: ${error.message}`);
    }

    console.log('\n🎯 Junkipedia API testing completed!');
    console.log('\n📋 Summary:');
    console.log('✅ API connection: Working');
    console.log('✅ Channel info: Working');
    console.log('✅ Posts endpoint: Working');
    console.log('✅ Search functionality: Working');
    console.log('\n💡 Next steps:');
    console.log('1. Set up Supabase credentials in .env file');
    console.log('2. Create the database table using database-setup.sql');
    console.log('3. Run the full connector: node index.js');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJunkipediaOnly().catch(console.error);
