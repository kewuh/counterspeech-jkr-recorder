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

  /**
   * Initialize reply contexts table
   */
  async initializeReplyContextsTable() {
    try {
      console.log('🔧 Initializing reply contexts table...');
      
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS reply_contexts (
            id SERIAL PRIMARY KEY,
            original_post_id TEXT NOT NULL,
            interaction_type TEXT NOT NULL,
            original_tweet_id TEXT NOT NULL,
            original_author TEXT,
            original_content TEXT,
            original_published_at TIMESTAMP WITH TIME ZONE,
            original_url TEXT,
            twitter_url TEXT,
            not_found BOOLEAN DEFAULT FALSE,
            raw_data JSONB,
            created_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(original_post_id, original_tweet_id)
          );
        `
      });
      
      if (error) {
        console.error('❌ Error creating reply_contexts table:', error);
        // Fallback: try to create table manually
        console.log('📋 Please create the reply_contexts table manually in Supabase with this SQL:');
        console.log(`
CREATE TABLE reply_contexts (
  id SERIAL PRIMARY KEY,
  original_post_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  original_tweet_id TEXT NOT NULL,
  original_author TEXT,
  original_content TEXT,
  original_published_at TIMESTAMP WITH TIME ZONE,
  original_url TEXT,
  twitter_url TEXT,
  not_found BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at_db TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(original_post_id, original_tweet_id)
);
        `);
      } else {
        console.log('✅ Reply contexts table initialized successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing reply contexts table:', error);
    }
  }

  /**
   * Store reply context
   */
  async storeReplyContext(replyContext) {
    try {
      const { data, error } = await this.supabase
        .from('reply_contexts')
        .upsert([replyContext], { 
          onConflict: 'original_post_id,original_tweet_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('❌ Error storing reply context:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error storing reply context:', error);
      return false;
    }
  }

  /**
   * Get reply contexts for a post
   */
  async getReplyContexts(postId) {
    try {
      const { data, error } = await this.supabase
        .from('reply_contexts')
        .select('*')
        .eq('original_post_id', postId)
        .order('created_at_db', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error fetching reply contexts:', error.message);
      return [];
    }
  }

  /**
   * Get all reply contexts
   */
  async getAllReplyContexts() {
    try {
      const { data, error } = await this.supabase
        .from('reply_contexts')
        .select('*')
        .order('created_at_db', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error fetching all reply contexts:', error.message);
      return [];
    }
  }

  /**
   * Initialize tweet analysis table
   */
  async initializeAnalysisTable() {
    try {
      console.log('🔧 Initializing tweet analysis table...');
      
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS tweet_analysis (
            id SERIAL PRIMARY KEY,
            tweet_id TEXT UNIQUE NOT NULL,
            is_potentially_transphobic BOOLEAN NOT NULL,
            confidence_level TEXT NOT NULL,
            concerns TEXT[],
            explanation TEXT,
            severity TEXT NOT NULL,
            recommendations TEXT[],
            analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            raw_analysis JSONB
          );
        `
      });
      
      if (error) {
        console.error('❌ Error creating tweet_analysis table:', error);
        // Fallback: try to create table manually
        console.log('📋 Please create the tweet_analysis table manually in Supabase with this SQL:');
        console.log(`
CREATE TABLE tweet_analysis (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT UNIQUE NOT NULL,
  is_potentially_transphobic BOOLEAN NOT NULL,
  confidence_level TEXT NOT NULL,
  concerns TEXT[],
  explanation TEXT,
  severity TEXT NOT NULL,
  recommendations TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_analysis JSONB
);

-- Add RLS policies
ALTER TABLE tweet_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on tweet_analysis" ON tweet_analysis
  FOR ALL USING (true);
        `);
      } else {
        console.log('✅ Tweet analysis table initialized successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing tweet analysis table:', error);
    }
  }

  /**
   * Get tweet analysis
   */
  async getTweetAnalysis(tweetId) {
    try {
      const { data, error } = await this.supabase
        .from('tweet_analysis')
        .select('*')
        .eq('tweet_id', tweetId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error fetching tweet analysis:', error.message);
      return null;
    }
  }

          /**
         * Get all tweet analyses
         */
        async getAllTweetAnalyses() {
            try {
                const { data, error } = await this.supabase
                    .from('tweet_analysis')
                    .select('*')
                    .order('analyzed_at', { ascending: false });

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('❌ Error fetching all tweet analyses:', error.message);
                return [];
            }
        }

        /**
         * Store article content
         */
        async storeArticleContent(tweetId, url, articleData) {
            try {
                const articleContent = {
                    tweet_id: tweetId,
                    url: url,
                    title: articleData.title,
                    description: articleData.description,
                    content: articleData.content,
                    word_count: articleData.wordCount,
                    status: 'success',
                    fetched_at: new Date().toISOString()
                };

                const { data, error } = await this.supabase
                    .from('article_content')
                    .upsert([articleContent], {
                        onConflict: 'tweet_id,url',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error('❌ Error storing article content:', error);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('❌ Error storing article content:', error);
                return false;
            }
        }

        /**
         * Store failed article fetch
         */
        async storeFailedArticle(tweetId, url, errorMessage) {
            try {
                const failedArticle = {
                    tweet_id: tweetId,
                    url: url,
                    status: 'failed',
                    error_message: errorMessage,
                    fetched_at: new Date().toISOString()
                };

                const { data, error } = await this.supabase
                    .from('article_content')
                    .upsert([failedArticle], {
                        onConflict: 'tweet_id,url',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error('❌ Error storing failed article:', error);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('❌ Error storing failed article:', error);
                return false;
            }
        }

        /**
         * Get article content for a tweet
         */
        async getArticleContent(tweetId) {
            try {
                const { data, error } = await this.supabase
                    .from('article_content')
                    .select('*')
                    .eq('tweet_id', tweetId)
                    .eq('status', 'success');

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('❌ Error fetching article content:', error.message);
                return [];
            }
        }

        /**
         * Check if article content exists for a URL
         */
        async checkArticleExists(tweetId, url) {
            try {
                const { data, error } = await this.supabase
                    .from('article_content')
                    .select('id, status')
                    .eq('tweet_id', tweetId)
                    .eq('url', url)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
                return data;
            } catch (error) {
                console.error('❌ Error checking article existence:', error.message);
                return null;
            }
        }

        /**
         * Initialize article content table
         */
        async initializeArticleContentTable() {
            try {
                console.log('🔧 Initializing article content table...');

                const { error } = await this.supabase.rpc('exec_sql', {
                    sql: `
                        CREATE TABLE IF NOT EXISTS article_content (
                            id SERIAL PRIMARY KEY,
                            tweet_id TEXT NOT NULL,
                            url TEXT NOT NULL,
                            title TEXT,
                            description TEXT,
                            content TEXT,
                            word_count INTEGER,
                            fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                            status TEXT DEFAULT 'success',
                            error_message TEXT,
                            UNIQUE(tweet_id, url)
                        );
                    `
                });

                if (error) {
                    console.error('❌ Error creating article_content table:', error);
                    console.log('📋 Please create the article_content table manually in Supabase with this SQL:');
                    console.log(`
CREATE TABLE article_content (
    id SERIAL PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    content TEXT,
    word_count INTEGER,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success',
    error_message TEXT,
    UNIQUE(tweet_id, url)
);

-- Add RLS policies
ALTER TABLE article_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on article_content" ON article_content
    FOR ALL USING (true);
                    `);
                } else {
                    console.log('✅ Article content table initialized successfully');
                }
            } catch (error) {
                console.error('❌ Error initializing article content table:', error);
            }
        }
    }

module.exports = SupabaseClient;
