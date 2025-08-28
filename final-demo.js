const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const BASE_URL = 'https://www.junkipedia.org/api/v1';
const CHANNEL_ID = '10595539';

async function finalDemo() {
  console.log('🎉 FINAL DEMO: Junkipedia API Working with JK Rowling Posts');
  console.log('==========================================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  try {
    // 1. Get channel info
    console.log('🔍 1. Getting JK Rowling\'s channel information...');
    const channelResponse = await client.get(`/channels/${CHANNEL_ID}`);
    const channel = channelResponse.data.data.attributes;
    console.log(`✅ Channel: ${channel.channel_name}`);
    console.log(`👥 Followers: ${channel.follower_count?.toLocaleString()}`);
    console.log(`📝 Total Posts: ${channel.post_count?.toLocaleString()}`);
    console.log(`📅 Latest Post: ${channel.latest_post_date}`);
    console.log(`🔗 Bio: ${channel.bio}`);
    console.log('');

    // 2. Get recent posts
    console.log('🔍 2. Getting JK Rowling\'s recent posts...');
    const postsResponse = await client.get('/posts', {
      params: {
        'channel_ids[]': CHANNEL_ID,
        limit: 5,
        sort: '-published_at'
      }
    });
    
    console.log(`✅ Found ${postsResponse.data.data.length} recent posts:`);
    postsResponse.data.data.forEach((post, index) => {
      const postData = post.attributes;
      const text = postData.search_data_fields?.sanitized_text || 'No text';
      const publishedAt = postData.published_at;
      const engagement = postData.engagement_data;
      
      console.log(`\n📝 Post ${index + 1}:`);
      console.log(`   📅 Date: ${publishedAt}`);
      console.log(`   📄 Content: ${text.substring(0, 100)}...`);
      console.log(`   ❤️  Likes: ${engagement?.like_count || 0}`);
      console.log(`   🔄 Retweets: ${engagement?.retweet_count || 0}`);
      console.log(`   💬 Replies: ${engagement?.reply_count || 0}`);
    });
    console.log('');

    // 3. Get posts statistics
    console.log('🔍 3. Getting posts statistics...');
    const statsResponse = await client.get('/posts/stats', {
      params: { 'channel_ids[]': CHANNEL_ID }
    });
    
    const stats = statsResponse.data.posts.engagement_over_time;
    console.log(`✅ Posts activity over time:`);
    console.log(`   📊 Total posts in dataset: ${stats.doc_count}`);
    
    // Show recent activity
    const recentBuckets = stats.buckets.slice(-5);
    recentBuckets.forEach(bucket => {
      const date = bucket.key_as_string;
      const count = bucket.doc_count;
      if (count > 0) {
        console.log(`   📅 ${date}: ${count} posts`);
      }
    });
    console.log('');

    // 4. Test search functionality
    console.log('🔍 4. Testing search functionality...');
    const searchResponse = await client.get('/posts', {
      params: {
        'channel_ids[]': CHANNEL_ID,
        q: 'Strike',
        limit: 3
      }
    });
    
    console.log(`✅ Search results for "Strike": ${searchResponse.data.data.length} posts`);
    if (searchResponse.data.data.length > 0) {
      const firstResult = searchResponse.data.data[0];
      const text = firstResult.attributes.search_data_fields?.sanitized_text || 'No text';
      console.log(`   📝 Sample: ${text.substring(0, 80)}...`);
    }
    console.log('');

    // 5. Test date filtering
    console.log('🔍 5. Testing date filtering...');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const dateResponse = await client.get('/posts', {
      params: {
        'channel_ids[]': CHANNEL_ID,
        start_date: yesterday,
        end_date: today,
        limit: 5
      }
    });
    
    console.log(`✅ Posts from ${yesterday} to ${today}: ${dateResponse.data.data.length} posts`);
    console.log('');

    console.log('🎯 DEMO COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Summary:');
    console.log('✅ API Connection: Working');
    console.log('✅ Channel Info: Working');
    console.log('✅ Posts Retrieval: Working');
    console.log('✅ Statistics: Working');
    console.log('✅ Search: Working');
    console.log('✅ Date Filtering: Working');
    console.log('✅ JK Rowling Posts: Fully Accessible');
    
    console.log('\n🚀 Ready for Supabase Integration!');
    console.log('The Junkipedia API is working perfectly and ready to store data in Supabase.');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

finalDemo().catch(console.error);
