const TwitterAPIClient = require('./twitter-api');
const SupabaseClient = require('./supabase-client');
const JunkipediaAPI = require('./junkipedia-api');
const XRepostsAPI = require('./x-reposts-api');
const GeminiAnalyzer = require('./gemini-analyzer');

class NewReplyDetector {
    constructor() {
        this.twitter = new TwitterAPIClient();
        this.supabase = new SupabaseClient();
        this.junkipedia = new JunkipediaAPI();
        this.xReposts = new XRepostsAPI();
        this.analyzer = new GeminiAnalyzer();
    }

    /**
     * Check for new reply tweets and reposts, then fetch their context
     */
    async checkForNewContent() {
        console.log('🔍 Checking for new content (replies and reposts)...\n');
        
        const startTime = new Date();
        
        try {
            // Get the latest post timestamp from our database
            const { data: latestPost, error: latestError } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('published_at')
                .order('published_at', { ascending: false })
                .limit(1);
                
            if (latestError) {
                console.error('❌ Error getting latest post:', latestError.message);
                return;
            }
            
            const lastProcessedTime = latestPost?.[0]?.published_at;
            console.log(`📅 Last processed post: ${lastProcessedTime || 'None'}`);
            
            // Check for new reposts from X API (minimal API calls)
            console.log('\n🔄 Checking for new reposts from X API...');
            await this.checkForNewReposts(lastProcessedTime);
            
            // Check for new replies from Junkipedia (existing functionality)
            console.log('\n💬 Checking for new replies from Junkipedia...');
            await this.checkForNewReplies(lastProcessedTime);
            
            // Update sync tracking record
            await this.updateSyncTracking(startTime, new Date());
            
        } catch (error) {
            console.error('❌ Error in checkForNewContent:', error.message);
            // Update sync tracking even on error
            await this.updateSyncTracking(startTime, new Date(), 'error');
        }
    }

    /**
     * Check for new reposts from X API
     */
    async checkForNewReposts(lastProcessedTime) {
        try {
            const newReposts = await this.xReposts.checkForNewReposts(lastProcessedTime);
            
            if (newReposts.length === 0) {
                console.log('📝 No new reposts found');
                return;
            }
            
            console.log(`🔄 Found ${newReposts.length} new reposts to process`);
            
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            
            for (const repost of newReposts) {
                try {
                    console.log(`\n📝 Processing repost ${repost.id}:`);
                    console.log(`   📅 Created: ${repost.created_at}`);
                    console.log(`   📝 Text: ${repost.text.substring(0, 100)}...`);
                    
                    // Check if we already have this repost
                    const existingPost = await this.supabase.supabase
                        .from('jk_rowling_posts')
                        .select('id')
                        .eq('junkipedia_id', `x_${repost.id}`)
                        .single();
                        
                    if (existingPost.data) {
                        console.log(`   ✅ Repost already exists, skipping`);
                        continue;
                    }
                    
                    // Get detailed repost information (single API call)
                    console.log(`   🔍 Fetching repost details...`);
                    const repostDetails = await this.xReposts.getRepostDetails(repost.id);
                    
                    if (repostDetails) {
                        // Format and store the repost
                        const formattedRepost = this.xReposts.formatRepostForStorage(
                            repostDetails.repost,
                            repostDetails.originalTweet
                        );
                        
                        const storedRepost = await this.storeRepost(formattedRepost);
                        
                        // Extract and analyze linked articles
                        if (storedRepost) {
                            console.log(`   📄 Checking for linked articles...`);
                            await this.analyzeLinkedArticles(storedRepost);
                        }
                        
                        successCount++;
                        console.log(`   ✅ Successfully processed and stored`);
                    } else {
                        console.log(`   ❌ Could not fetch repost details`);
                        errorCount++;
                    }
                    
                    processedCount++;
                    
                } catch (error) {
                    console.error(`   ❌ Error processing repost ${repost.id}:`, error.message);
                    errorCount++;
                }
            }
            
            console.log(`\n📊 Repost processing summary:`);
            console.log(`   ✅ Successfully processed: ${successCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            console.log(`   📝 Total processed: ${processedCount}`);
            
        } catch (error) {
            console.error('❌ Error checking for new reposts:', error.message);
        }
    }

    /**
     * Analyze linked articles in a repost
     */
    async analyzeLinkedArticles(repost) {
        try {
            // Look for URLs in the repost content
            const urlRegex = /https?:\/\/[^\s]+/g;
            const urls = repost.content.match(urlRegex);
            
            if (!urls || urls.length === 0) {
                console.log(`      📄 No URLs found in repost content`);
                return;
            }

            console.log(`      📄 Found ${urls.length} URLs in repost`);
            
            for (const url of urls.slice(0, 3)) { // Limit to first 3 URLs
                try {
                    console.log(`      🔗 Analyzing article: ${url.substring(0, 50)}...`);
                    
                    // Fetch article content
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (!response.ok) {
                        console.log(`      ❌ Failed to fetch article (${response.status})`);
                        continue;
                    }
                    
                    const html = await response.text();
                    const textContent = this.extractTextFromHTML(html);
                    
                    if (!textContent || textContent.length < 100) {
                        console.log(`      ❌ Could not extract meaningful content`);
                        continue;
                    }

                    // Store article content
                    const articleData = {
                        tweet_id: repost.junkipedia_id,
                        url: url,
                        title: this.extractTitleFromHTML(html) || 'Unknown Title',
                        content: textContent,
                        word_count: textContent.split(/\s+/).length,
                        fetched_at: new Date().toISOString(),
                        status: 'success'
                    };

                    const { data: storedArticle, error: storeError } = await this.supabase.supabase
                        .from('article_content')
                        .insert([articleData])
                        .select()
                        .single();

                    if (storeError) {
                        console.log(`      ❌ Error storing article: ${storeError.message}`);
                        continue;
                    }

                    console.log(`      ✅ Stored article with ID: ${storedArticle.id}`);

                    // Analyze article content
                    const analysis = await this.analyzer.analyzeContent(`
Please analyze this article content for potentially transphobic content:

${textContent.substring(0, 3000)}

Consider:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this article is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"]
}
`);

                    if (analysis) {
                        // Update tweet analysis with article analysis
                        const { data: existingAnalysis } = await this.supabase.supabase
                            .from('tweet_analysis')
                            .select('*')
                            .eq('tweet_id', repost.junkipedia_id)
                            .single();

                        if (existingAnalysis) {
                            const updatedAnalysis = {
                                ...existingAnalysis,
                                article_analysis: analysis.explanation,
                                articles_analyzed: (existingAnalysis.articles_analyzed || 0) + 1,
                                combined_analysis: analysis.is_potentially_transphobic ? 
                                    'Both tweet and linked article analyzed. Article contains transphobic content.' :
                                    'Both tweet and linked article analyzed. No transphobic content found in either.'
                            };

                            await this.supabase.supabase
                                .from('tweet_analysis')
                                .update(updatedAnalysis)
                                .eq('tweet_id', repost.junkipedia_id);

                            console.log(`      ✅ Article analysis completed and stored`);
                        }
                    }

                } catch (articleError) {
                    console.log(`      ❌ Error analyzing article: ${articleError.message}`);
                }
            }
            
        } catch (error) {
            console.error(`   ❌ Error in analyzeLinkedArticles:`, error.message);
        }
    }

    /**
     * Extract text from HTML
     */
    extractTextFromHTML(html) {
        // Remove script and style elements
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Remove HTML tags
        html = html.replace(/<[^>]*>/g, ' ');
        
        // Decode HTML entities
        html = html.replace(/&nbsp;/g, ' ');
        html = html.replace(/&amp;/g, '&');
        html = html.replace(/&lt;/g, '<');
        html = html.replace(/&gt;/g, '>');
        html = html.replace(/&quot;/g, '"');
        html = html.replace(/&#39;/g, "'");
        
        // Clean up whitespace
        html = html.replace(/\s+/g, ' ').trim();
        
        return html;
    }

    /**
     * Extract title from HTML
     */
    extractTitleFromHTML(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
            return h1Match[1].trim();
        }
        
        return null;
    }

    /**
     * Update sync tracking record
     */
    async updateSyncTracking(startTime, endTime, status = 'completed') {
        try {
            console.log('🔄 Updating sync tracking record...');
            
            const { data: existingSync, error: checkError } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('id')
                .eq('junkipedia_id', 'sync_tracking_last_run')
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('❌ Error checking sync tracking record:', checkError.message);
                return;
            }

            const updateData = {
                published_at: endTime.toISOString(),
                raw_data: {
                    last_cron_run: endTime.toISOString(),
                    job_type: 'cron_new_replies',
                    status: status,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    duration_ms: endTime.getTime() - startTime.getTime()
                }
            };

            if (existingSync) {
                // Update existing record
                const { error: updateError } = await this.supabase.supabase
                    .from('jk_rowling_posts')
                    .update(updateData)
                    .eq('junkipedia_id', 'sync_tracking_last_run');

                if (updateError) {
                    console.error('❌ Error updating sync tracking:', updateError.message);
                } else {
                    console.log(`✅ Sync tracking updated - Last run: ${endTime.toISOString()}`);
                }
            } else {
                // Create new record
                const syncData = {
                    junkipedia_id: 'sync_tracking_last_run',
                    content: 'Last cron job execution time',
                    author: 'System',
                    platform: 'system',
                    post_type: 'sync_tracking',
                    created_at: endTime.toISOString(),
                    published_at: endTime.toISOString(),
                    url: 'system://sync-tracking',
                    engagement_metrics: { likes: 0, retweets: 0, replies: 0, quotes: 0 },
                    tags: [],
                    issues: [],
                    raw_data: updateData.raw_data
                };

                const { error: insertError } = await this.supabase.supabase
                    .from('jk_rowling_posts')
                    .insert([syncData]);

                if (insertError) {
                    console.error('❌ Error creating sync tracking:', insertError.message);
                } else {
                    console.log(`✅ Sync tracking created - Last run: ${endTime.toISOString()}`);
                }
            }

        } catch (error) {
            console.error('❌ Error in updateSyncTracking:', error.message);
        }
    }

    /**
     * Store repost in database
     */
    async storeRepost(formattedRepost) {
        try {
            const { data: insertedPost, error } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .insert([formattedRepost])
                .select()
                .single();

            if (error) {
                console.error('❌ Error storing repost:', error.message);
                throw error;
            }

            console.log(`   💾 Stored repost with ID: ${insertedPost.id}`);
            
            // Run AI analysis on the repost
            console.log(`   🤖 Running AI analysis on repost...`);
            try {
                const analysis = await this.analyzer.analyzeTweet(insertedPost);
                if (analysis) {
                    console.log(`   ✅ AI analysis completed for repost`);
                    console.log(`      🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                    console.log(`      📊 Confidence: ${analysis.confidence_level}`);
                } else {
                    console.log(`   ⚠️  AI analysis failed for repost`);
                }
            } catch (analysisError) {
                console.error(`   ❌ Error running AI analysis:`, analysisError.message);
            }
            
            return insertedPost;
            
        } catch (error) {
            console.error('❌ Error in storeRepost:', error.message);
            throw error;
        }
    }

    /**
     * Check for new reply tweets and fetch their context (existing functionality)
     */
    async checkForNewReplies(lastProcessedTime) {
        console.log('🔍 Checking for new reply tweets...\n');
        
        try {
            // Fetch new posts from Junkipedia (this doesn't use Twitter API)
            console.log('📡 Fetching new posts from Junkipedia...');
            const newPosts = await this.junkipedia.getChannelPosts({
                limit: 50,
                channel_id: '10595539'
            });
            
            if (!newPosts.data || newPosts.data.length === 0) {
                console.log('📝 No new posts found');
                return;
            }
            
            console.log(`📊 Found ${newPosts.data.length} posts from Junkipedia`);
            
            // Filter for reply tweets that are newer than our last processed post
            const newReplyTweets = newPosts.data.filter(post => {
                const isReply = post.attributes?.post_data?.in_reply_to_status_id_str;
                const isNewer = !lastProcessedTime || new Date(post.attributes?.published_at) > new Date(lastProcessedTime);
                return isReply && isNewer;
            });
            
            if (newReplyTweets.length === 0) {
                console.log('📝 No new reply tweets found');
                return;
            }
            
            console.log(`🎯 Found ${newReplyTweets.length} new reply tweets to process`);
            
            // Process each new reply tweet (this will use Twitter API)
            let processedCount = 0;
            let successCount = 0;
            let errorCount = 0;
            
            for (const post of newReplyTweets) {
                try {
                    const originalTweetId = post.attributes?.post_data?.in_reply_to_status_id_str;
                    
                    console.log(`\n📝 Processing new reply tweet:`);
                    console.log(`   💬 Reply: ${post.attributes?.search_data_fields?.sanitized_text?.substring(0, 100)}...`);
                    console.log(`   🔗 Original tweet ID: ${originalTweetId}`);
                    
                    // Check if we already have this reply context
                    const existingContext = await this.supabase.supabase
                        .from('reply_contexts')
                        .select('id')
                        .eq('reply_tweet_id', post.id)
                        .single();
                        
                    if (existingContext.data) {
                        console.log(`   ✅ Reply context already exists, skipping`);
                        continue;
                    }
                    
                    // Fetch original tweet from Twitter API (single API call)
                    console.log(`   🔍 Fetching original tweet from Twitter API...`);
                    const originalTweet = await this.twitter.getOriginalTweet(originalTweetId);
                    
                    if (originalTweet && originalTweet.data) {
                        // Store the reply context
                        await this.storeReplyContext(post, originalTweet);
                        successCount++;
                        console.log(`   ✅ Successfully processed and stored`);
                    } else {
                        console.log(`   ❌ Original tweet not accessible`);
                        errorCount++;
                    }
                    
                    processedCount++;
                    
                } catch (error) {
                    console.error(`   ❌ Error processing reply tweet:`, error.message);
                    errorCount++;
                }
            }
            
            console.log(`\n📊 Reply processing summary:`);
            console.log(`   ✅ Successfully processed: ${successCount}`);
            console.log(`   ❌ Errors: ${errorCount}`);
            console.log(`   📝 Total processed: ${processedCount}`);
            
        } catch (error) {
            console.error('❌ Error checking for new replies:', error.message);
        }
    }

    /**
     * Store reply context in database
     */
    async storeReplyContext(post, originalTweet) {
        const replyContextData = {
            reply_context_id: `junkipedia_${post.id}`,
            reply_tweet_id: post.id,
            reply_tweet_text: post.attributes?.search_data_fields?.sanitized_text,
            reply_tweet_created_at: post.attributes?.published_at,
            reply_tweet_metrics: post.attributes?.engagement_data || {},
            original_tweet_id: originalTweet.data.id,
            original_tweet_text: originalTweet.data.text,
            original_tweet_created_at: originalTweet.data.created_at,
            original_tweet_metrics: originalTweet.data.public_metrics || {},
            original_user_username: originalTweet.includes?.users?.[0]?.username || null,
            original_user_name: originalTweet.includes?.users?.[0]?.name || null,
            conversation_id: originalTweet.data.conversation_id || null,
            platform: 'twitter',
            raw_data: {
                reply_post: post,
                original_tweet: originalTweet.data,
                original_user: originalTweet.includes?.users?.[0] || null
            },
            inserted_at: new Date().toISOString()
        };
        
        const { error } = await this.supabase.supabase
            .from('reply_contexts')
            .insert(replyContextData);
            
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }

    /**
     * Get recent reply contexts for AI analysis
     */
    async getRecentReplyContexts(limit = 10) {
        try {
            const { data, error } = await this.supabase.supabase
                .from('reply_contexts')
                .select('*')
                .order('inserted_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                console.error('❌ Error getting recent reply contexts:', error.message);
                return [];
            }
            
            return data || [];
            
        } catch (error) {
            console.error('❌ Error getting recent reply contexts:', error.message);
            return [];
        }
    }
}

// CLI interface
async function main() {
    const detector = new NewReplyDetector();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'check':
            await detector.checkForNewContent();
            break;
            
        case 'recent':
            const limit = parseInt(args[1]) || 10;
            const contexts = await detector.getRecentReplyContexts(limit);
            console.log(`📊 Recent ${contexts.length} reply contexts:`);
            contexts.forEach((context, i) => {
                console.log(`\n${i + 1}. Reply: ${context.reply_tweet_text?.substring(0, 80)}...`);
                if (context.original_tweet_text) {
                    console.log(`   Original: ${context.original_tweet_text?.substring(0, 80)}...`);
                }
            });
            break;
            
        default:
            console.log('🔍 New Reply Detector (Cron Job)');
            console.log('\nUsage:');
            console.log('  node cron-new-replies.js check           - Check for new reply tweets');
            console.log('  node cron-new-replies.js recent [limit]  - Show recent reply contexts');
            console.log('\nExamples:');
            console.log('  node cron-new-replies.js check           - Run cron job');
            console.log('  node cron-new-replies.js recent 5        - Show 5 recent contexts');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = NewReplyDetector;
