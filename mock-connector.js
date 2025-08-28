const MockJunkipediaAPI = require('./mock-junkipedia-api');
const SupabaseClient = require('./supabase-client');

class MockJunkipediaSupabaseConnector {
  constructor() {
    this.junkipedia = new MockJunkipediaAPI();
    this.supabase = new SupabaseClient();
  }

  /**
   * Main function to fetch and store JK Rowling's posts (mock version)
   */
  async run(options = {}) {
    try {
      console.log('🚀 Starting Mock Junkipedia to Supabase connector...');
      console.log('📅 Target: JK Rowling\'s posts (Channel ID: 10595539)');
      console.log('🎭 Using MOCK DATA for testing purposes');
      
      // Initialize database
      const tableExists = await this.supabase.initializeTable();
      if (!tableExists) {
        console.log('❌ Please create the database table first. See the SQL above.');
        return;
      }

      // Fetch posts from Junkipedia (mock)
      const posts = await this.junkipedia.getChannelPosts(options);
      
      if (!posts || posts.length === 0) {
        console.log('📭 No posts found from Junkipedia');
        return;
      }

      console.log(`📊 Found ${posts.length} posts from Junkipedia (mock)`);
      
      // Store posts in Supabase
      const result = await this.supabase.insertPosts(posts);
      
      console.log('✅ Process completed successfully!');
      console.log(`📈 Summary: ${result.insertedCount} new posts inserted, ${result.skippedCount} duplicates skipped`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in main process:', error.message);
      throw error;
    }
  }

  /**
   * Fetch posts from a specific date range
   */
  async fetchPostsByDateRange(startDate, endDate, options = {}) {
    console.log(`📅 Fetching posts from ${startDate} to ${endDate}...`);
    
    const dateOptions = {
      ...options,
      startDate,
      endDate
    };
    
    return await this.run(dateOptions);
  }

  /**
   * Fetch recent posts (last N days)
   */
  async fetchRecentPosts(days = 7, options = {}) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    console.log(`📅 Fetching posts from the last ${days} days...`);
    
    return await this.fetchPostsByDateRange(startDate, endDate, options);
  }

  /**
   * Search and store posts with specific content
   */
  async searchAndStorePosts(query, options = {}) {
    try {
      console.log(`🔍 Searching for posts containing: "${query}"`);
      
      const posts = await this.junkipedia.searchPosts(query, options);
      
      if (!posts || posts.length === 0) {
        console.log('📭 No posts found matching the search query');
        return;
      }

      console.log(`📊 Found ${posts.length} posts matching the search query`);
      
      const result = await this.supabase.insertPosts(posts);
      
      console.log('✅ Search and store completed!');
      console.log(`📈 Summary: ${result.insertedCount} new posts inserted, ${result.skippedCount} duplicates skipped`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in search and store:', error.message);
      throw error;
    }
  }

  /**
   * Get statistics about stored posts
   */
  async getStats() {
    try {
      const posts = await this.supabase.getAllPosts();
      
      console.log('📊 Database Statistics:');
      console.log(`📝 Total posts stored: ${posts.length}`);
      
      if (posts.length > 0) {
        const latestPost = posts[0];
        const oldestPost = posts[posts.length - 1];
        
        console.log(`📅 Date range: ${oldestPost.published_at} to ${latestPost.published_at}`);
        
        // Count by platform
        const platformCounts = posts.reduce((acc, post) => {
          acc[post.platform] = (acc[post.platform] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📱 Posts by platform:', platformCounts);
      }
      
      return posts;
    } catch (error) {
      console.error('❌ Error getting stats:', error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const connector = new MockJunkipediaSupabaseConnector();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'recent':
        const days = parseInt(args[1]) || 7;
        await connector.fetchRecentPosts(days);
        break;
        
      case 'range':
        const startDate = args[1];
        const endDate = args[2];
        if (!startDate || !endDate) {
          console.log('❌ Usage: node mock-connector.js range <startDate> <endDate>');
          console.log('📅 Example: node mock-connector.js range 2024-01-01 2024-01-31');
          return;
        }
        await connector.fetchPostsByDateRange(startDate, endDate);
        break;
        
      case 'search':
        const query = args[1];
        if (!query) {
          console.log('❌ Usage: node mock-connector.js search <query>');
          console.log('🔍 Example: node mock-connector.js search "trans rights"');
          return;
        }
        await connector.searchAndStorePosts(query);
        break;
        
      case 'stats':
        await connector.getStats();
        break;
        
      case 'all':
      default:
        // Fetch all available posts
        await connector.run();
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = MockJunkipediaSupabaseConnector;
