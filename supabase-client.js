const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

class SupabaseClient {
  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );
    this.tableName = config.supabase.tableName;
  }

  /**
   * Initialize the database table if it doesn't exist
   */
  async initializeTable() {
    try {
      console.log(`🔧 Checking if table '${this.tableName}' exists...`);
      
      // Note: In a real implementation, you would use Supabase's SQL editor
      // or migrations to create the table. This is a simplified check.
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`📋 Table '${this.tableName}' doesn't exist. Please create it manually in Supabase.`);
        console.log(`📋 Here's the SQL to create the table:`);
        console.log(`
CREATE TABLE ${this.tableName} (
  id SERIAL PRIMARY KEY,
  junkipedia_id VARCHAR UNIQUE NOT NULL,
  content TEXT,
  author VARCHAR,
  platform VARCHAR,
  post_type VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  url VARCHAR,
  engagement_metrics JSONB,
  tags TEXT[],
  issues JSONB,
  raw_data JSONB,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `);
        return false;
      }

      console.log(`✅ Table '${this.tableName}' exists and is accessible`);
      return true;
    } catch (error) {
      console.error('❌ Error checking table:', error.message);
      return false;
    }
  }

  /**
   * Insert a single post into the database
   */
  async insertPost(post) {
    try {
      // Extract content from the correct field in the Junkipedia API response
      const content = post.attributes?.search_data_fields?.sanitized_text || 
                     post.attributes?.post_data?.full_text ||
                     post.content || 
                     post.text || 
                     'No content available';
      
      // Extract engagement data from the correct fields
      const engagement = post.attributes?.engagement_data || post.attributes?.engagement_fields || {};
      
      const postData = {
        junkipedia_id: post.id || post.post_id,
        content: content,
        author: post.attributes?.channel?.channel_name || post.author || 'JK Rowling',
        platform: post.attributes?.search_data_fields?.platform_name?.toLowerCase() || post.platform || 'twitter',
        post_type: post.attributes?.search_data_fields?.post_type?.[0] || post.post_type || 'tweet',
        created_at: post.attributes?.created_at || post.created_at,
        published_at: post.attributes?.published_at || post.published_at || post.created_at,
        url: post.attributes?.post_data?.url || post.attributes?.url || post.url || post.permalink,
        engagement_metrics: {
          likes: engagement.like_count || engagement.likes_count || post.likes || 0,
          retweets: engagement.retweet_count || engagement.shares_count || post.retweets || 0,
          replies: engagement.reply_count || engagement.comments_count || post.replies || 0,
          shares: engagement.share_count || engagement.shares_count || post.shares || 0
        },
        tags: post.tags || [],
        issues: post.issues || [],
        raw_data: post
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(postData)
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Post ${postData.junkipedia_id} already exists, skipping...`);
          return { inserted: false, data: null };
        }
        throw error;
      }

      console.log(`✅ Inserted post ${postData.junkipedia_id}`);
      return { inserted: true, data: data[0] };
    } catch (error) {
      console.error('❌ Error inserting post:', error.message);
      throw error;
    }
  }

  /**
   * Insert multiple posts into the database
   */
  async insertPosts(posts) {
    try {
      console.log(`📥 Inserting ${posts.length} posts into Supabase...`);
      
      const results = [];
      let insertedCount = 0;
      let skippedCount = 0;

      for (const post of posts) {
        try {
          const result = await this.insertPost(post);
          results.push(result);
          
          if (result.inserted) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to insert post ${post.id}:`, error.message);
          results.push({ inserted: false, error: error.message });
          skippedCount++;
        }
      }

      console.log(`📊 Insertion complete: ${insertedCount} inserted, ${skippedCount} skipped`);
      return { results, insertedCount, skippedCount };
    } catch (error) {
      console.error('❌ Error inserting posts:', error.message);
      throw error;
    }
  }

  /**
   * Get all posts from the database
   */
  async getAllPosts() {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error fetching posts:', error.message);
      throw error;
    }
  }

  /**
   * Get posts by date range
   */
  async getPostsByDateRange(startDate, endDate) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .gte('published_at', startDate)
        .lte('published_at', endDate)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error fetching posts by date range:', error.message);
      throw error;
    }
  }

  /**
   * Search posts by content
   */
  async searchPosts(query) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .ilike('content', `%${query}%`)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error searching posts:', error.message);
      throw error;
    }
  }
}

module.exports = SupabaseClient;
