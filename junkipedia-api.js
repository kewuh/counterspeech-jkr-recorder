const axios = require('axios');
const config = require('./config');

class JunkipediaAPI {
  constructor() {
    this.apiKey = config.junkipedia.apiKey;
    this.baseUrl = config.junkipedia.baseUrl;
    this.channelId = config.junkipedia.channelId;
    
    // Create axios instance with default headers
    this.client = axios.create({
      baseURL: 'https://www.junkipedia.org/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Junkipedia-Supabase-Connector/1.0.0',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Test API connection with different authentication methods
   */
  async testConnection() {
    console.log('🔍 Testing Junkipedia API connection...');
    
    const testUrls = [
      'https://www.junkipedia.org/api/v1',
      'https://junkipedia.org/api/v1',
      'https://api.junkipedia.org/v1'
    ];

    for (const baseUrl of testUrls) {
      console.log(`\n📡 Testing base URL: ${baseUrl}`);
      
      try {
        // Test with Bearer token
        const response = await axios.get(`${baseUrl}/channels/${this.channelId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000
        });
        console.log(`✅ Bearer token works! Status: ${response.status}`);
        return { success: true, baseUrl, method: 'bearer' };
      } catch (error) {
        console.log(`❌ Bearer token failed: ${error.message}`);
        
        try {
          // Test with API key in query parameter
          const response = await axios.get(`${baseUrl}/channels/${this.channelId}?api_key=${this.apiKey}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000
          });
          console.log(`✅ API key in query works! Status: ${response.status}`);
          return { success: true, baseUrl, method: 'query' };
        } catch (error2) {
          console.log(`❌ API key in query failed: ${error2.message}`);
        }
      }
    }
    
    return { success: false };
  }

  /**
   * Query posts from JK Rowling's channel
   * Based on Junkipedia API documentation, we'll use the Posts endpoint
   */
  async getChannelPosts(options = {}) {
    try {
      const {
        limit = 100,
        offset = 0,
        startDate,
        endDate,
        postType,
        platform,
        channel_id,
        q
      } = options;

      const params = {
        limit,
        offset,
      };

      // Only add optional parameters if they're explicitly provided
      if (postType) {
        params.post_type = postType;
      }
      if (platform) {
        params.platform = platform;
      }

      // Only add channel_ids[] if no other channel_id or search query is provided
      if (!channel_id && !q) {
        params['channel_ids[]'] = this.channelId;
      } else if (channel_id) {
        params['channel_ids[]'] = channel_id;
      }

      // Add search query if provided
      if (q) {
        params.q = q;
      }

      // Add date filters if provided
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      console.log(`🔍 Querying Junkipedia for posts...`);
      console.log(`📊 Parameters:`, params);

      const response = await this.client.get('/posts', { params });
      
      console.log(`✅ Successfully retrieved ${response.data.data?.length || 0} posts`);
      return response.data;
    } catch (error) {
      console.error('❌ Error querying Junkipedia API:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get specific post by ID
   */
  async getPost(postId) {
    try {
      const response = await this.client.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching post ${postId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo() {
    try {
      let response;
      try {
        response = await this.client.get(`/channels/${this.channelId}`);
      } catch (error) {
        if (error.code === 'ENOTFOUND' || error.response?.status === 404) {
          // Try alternative endpoint format
          console.log('🔄 Trying alternative channel endpoint format...');
          response = await this.client.get(`/v1/channels/${this.channelId}`);
        } else {
          throw error;
        }
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching channel info:`, error.message);
      throw error;
    }
  }

  /**
   * Search posts with text query
   */
  async searchPosts(query, options = {}) {
    try {
      const params = {
        q: query,
        'channel_ids[]': this.channelId,
        ...options
      };

      const response = await this.client.get('/posts/search', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error searching posts:', error.message);
      throw error;
    }
  }
}

module.exports = JunkipediaAPI;
