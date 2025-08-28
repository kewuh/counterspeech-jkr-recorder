const config = require('./config');

class MockJunkipediaAPI {
  constructor() {
    this.apiKey = config.junkipedia.apiKey;
    this.baseUrl = config.junkipedia.baseUrl;
    this.channelId = config.junkipedia.channelId;
  }

  /**
   * Generate mock channel information
   */
  async getChannelInfo() {
    console.log('🔍 Mock: Getting channel information...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: this.channelId,
      name: 'JK Rowling',
      username: 'jk_rowling',
      platform: 'twitter',
      description: 'Author of the Harry Potter series',
      followers_count: 14000000,
      verified: true,
      created_at: '2009-03-01T00:00:00Z',
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate mock posts data
   */
  async getChannelPosts(options = {}) {
    const {
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      postType = 'all',
      platform = 'twitter'
    } = options;

    console.log(`🔍 Mock: Getting posts from channel ${this.channelId}...`);
    console.log(`📊 Parameters:`, { limit, offset, startDate, endDate, postType, platform });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock posts
    const mockPosts = [];
    const sampleContent = [
      "The truth is that the trans rights movement has been hijacked by a small but vocal minority who are determined to erase the reality of biological sex.",
      "I've been thinking about the importance of protecting women's spaces and the need for honest discussion about gender identity.",
      "The Harry Potter books are about the power of love and the importance of standing up for what's right, even when it's difficult.",
      "I believe in the importance of free speech and the right to express different viewpoints without fear of cancellation.",
      "Women's rights are human rights, and we must protect the hard-won gains of the feminist movement.",
      "The debate around gender identity is complex and requires thoughtful, respectful discussion from all sides.",
      "I stand with women who are speaking out about the importance of single-sex spaces and services.",
      "The right to free expression is fundamental to a democratic society.",
      "I believe in treating everyone with dignity and respect, while also acknowledging biological reality.",
      "The conversation about gender and sex is important and should be conducted with civility and respect."
    ];

    const sampleTags = [
      ['trans rights', 'women rights', 'free speech'],
      ['gender identity', 'feminism', 'debate'],
      ['harry potter', 'books', 'love'],
      ['free speech', 'cancellation', 'viewpoints'],
      ['women rights', 'feminism', 'human rights'],
      ['gender identity', 'debate', 'discussion'],
      ['women spaces', 'single-sex', 'rights'],
      ['free expression', 'democracy', 'rights'],
      ['dignity', 'respect', 'biology'],
      ['gender', 'sex', 'civility']
    ];

    for (let i = 0; i < Math.min(limit, 10); i++) {
      const postDate = new Date();
      postDate.setDate(postDate.getDate() - i * 2); // Posts every 2 days

      const post = {
        id: `mock_post_${Date.now()}_${i}`,
        content: sampleContent[i % sampleContent.length],
        author: 'JK Rowling',
        username: 'jk_rowling',
        platform: 'twitter',
        post_type: 'tweet',
        created_at: postDate.toISOString(),
        published_at: postDate.toISOString(),
        url: `https://twitter.com/jk_rowling/status/${Date.now()}_${i}`,
        engagement_metrics: {
          likes: Math.floor(Math.random() * 50000) + 1000,
          retweets: Math.floor(Math.random() * 10000) + 100,
          replies: Math.floor(Math.random() * 5000) + 50,
          shares: Math.floor(Math.random() * 2000) + 20
        },
        tags: sampleTags[i % sampleTags.length],
        issues: [],
        raw_data: {
          id: `mock_post_${Date.now()}_${i}`,
          text: sampleContent[i % sampleContent.length],
          author_id: this.channelId,
          created_at: postDate.toISOString(),
          public_metrics: {
            retweet_count: Math.floor(Math.random() * 10000) + 100,
            reply_count: Math.floor(Math.random() * 5000) + 50,
            like_count: Math.floor(Math.random() * 50000) + 1000,
            quote_count: Math.floor(Math.random() * 2000) + 20
          }
        }
      };

      mockPosts.push(post);
    }

    console.log(`✅ Mock: Successfully generated ${mockPosts.length} posts`);
    return mockPosts;
  }

  /**
   * Get specific post by ID
   */
  async getPost(postId) {
    console.log(`🔍 Mock: Getting post ${postId}...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: postId,
      content: "This is a mock post content for testing purposes.",
      author: 'JK Rowling',
      platform: 'twitter',
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      url: `https://twitter.com/jk_rowling/status/${postId}`,
      engagement_metrics: {
        likes: 15000,
        retweets: 2500,
        replies: 800,
        shares: 400
      },
      tags: ['mock', 'test'],
      issues: [],
      raw_data: {}
    };
  }

  /**
   * Search posts with text query
   */
  async searchPosts(query, options = {}) {
    console.log(`🔍 Mock: Searching for posts containing "${query}"...`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a subset of mock posts that might match the query
    const allPosts = await this.getChannelPosts({ limit: 5 });
    return allPosts.filter(post => 
      post.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Test API connection (mock version)
   */
  async testConnection() {
    console.log('🔍 Mock: Testing API connection...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { 
      success: true, 
      baseUrl: 'https://mock.junkipedia.org/api', 
      method: 'mock' 
    };
  }
}

module.exports = MockJunkipediaAPI;
