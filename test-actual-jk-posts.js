const axios = require('axios');

const API_KEY = 'hCzEWpaVgifMgURArfJNVurG';
const CHANNEL_ID = '10595539';
const BASE_URL = 'https://www.junkipedia.org/api/v1';

async function testActualJKPosts() {
  console.log('🔍 Testing for JK Rowling\'s Actual Posts');
  console.log('========================================\n');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test getting posts from the exact date range where JK Rowling last posted
  const testQueries = [
    // Test exact date range around her last post
    { 
      limit: 50, 
      channel_id: CHANNEL_ID, 
      start_date: '2025-08-29',
      end_date: '2025-08-29'
    },
    // Test broader range around her last post
    { 
      limit: 100, 
      channel_id: CHANNEL_ID, 
      start_date: '2025-08-28',
      end_date: '2025-08-30'
    },
    // Test without channel_id to see if we get different results
    { 
      limit: 50, 
      start_date: '2025-08-29',
      end_date: '2025-08-29'
    },
    // Test with author filter if available
    { 
      limit: 50, 
      channel_id: CHANNEL_ID,
      q: 'JK Rowling'
    },
    // Test with username filter
    { 
      limit: 50, 
      channel_id: CHANNEL_ID,
      q: '@jk_rowling'
    },
    // Test recent posts without date filter
    { 
      limit: 100, 
      channel_id: CHANNEL_ID
    },
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`🔍 Test ${i + 1}: Testing with parameters:`, query);
    
    try {
      const response = await client.get('/posts', { params: query });
      console.log(`✅ Success! Status: ${response.status}`);
      console.log(`📊 Posts found: ${response.data.data?.length || 0}`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log(`📝 Analyzing posts for JK Rowling content...`);
        
        let jkRowlingPosts = 0;
        
        response.data.data.forEach((post, index) => {
          const postData = post.attributes?.search_data_fields || {};
          const text = postData.sanitized_text || '';
          const author = postData.author || 'unknown';
          const publishedAt = post.attributes?.published_at || 'unknown';
          const postType = post.post_type || 'unknown';
          
          // Check if this looks like a JK Rowling post
          const isJKRowling = 
            author.toLowerCase().includes('rowling') ||
            author.toLowerCase().includes('jk') ||
            text.toLowerCase().includes('@jk_rowling') ||
            text.toLowerCase().includes('jk rowling') ||
            (text.length > 0 && !text.includes('@') && !text.includes('http')); // Original posts vs retweets
          
          if (isJKRowling) {
            jkRowlingPosts++;
            console.log(`\n   🔍 POTENTIAL JK ROWLING POST ${jkRowlingPosts}:`);
            console.log(`   📅 Published: ${publishedAt}`);
            console.log(`   🏷️  Post Type: ${postType}`);
            console.log(`   👤 Author: ${author}`);
            console.log(`   📝 Text: ${text}`);
            
            // Check for repost indicators
            if (text.toLowerCase().includes('repost') || 
                text.toLowerCase().includes('retweet') ||
                text.toLowerCase().includes('rt @') ||
                text.toLowerCase().includes('reposted')) {
              console.log(`   🔄 REPOST DETECTED!`);
            }
          }
        });
        
        console.log(`\n📊 Found ${jkRowlingPosts} potential JK Rowling posts out of ${response.data.data.length} total posts`);
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

  // Test the search endpoint specifically for JK Rowling
  console.log('🔍 Testing Search Endpoint for JK Rowling...');
  try {
    const searchResponse = await client.get('/posts/search', { 
      params: { 
        q: 'JK Rowling',
        limit: 20,
        start_date: '2025-08-29'
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
        console.log(`      📝 Text: ${text}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Search Failed: ${error.message}`);
  }

  console.log('\n🎯 Testing completed!');
}

testActualJKPosts().catch(console.error);
