const SupabaseClient = require('./supabase-client');
const axios = require('axios');
const cheerio = require('cheerio');

class ArticleFetcher {
    constructor() {
        this.supabase = new SupabaseClient();
    }

    async fetchArticleContent(tweetId, url) {
        try {
            // Check if article content already exists in database
            const existingArticle = await this.supabase.checkArticleExists(tweetId, url);
            if (existingArticle && existingArticle.status === 'success') {
                console.log(`📄 Article already exists: ${url}`);
                return true;
            }
            
            console.log(`📥 Fetching article: ${url}`);
            
            const response = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            
            // Remove script and style elements
            $('script, style, nav, header, footer, .ad, .advertisement, .sidebar').remove();
            
            // Extract main content
            let content = '';
            
            // Try common article selectors
            const selectors = [
                'article',
                '.article-content',
                '.post-content',
                '.entry-content',
                '.content',
                '.main-content',
                '[role="main"]',
                'main',
                '.story-body',
                '.article-body'
            ];
            
            for (const selector of selectors) {
                const element = $(selector);
                if (element.length > 0) {
                    content = element.text().trim();
                    if (content.length > 200) break; // Found substantial content
                }
            }
            
            // If no specific article content found, get body text
            if (!content || content.length < 200) {
                content = $('body').text().trim();
            }
            
            // Clean up the content
            content = content
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
                .trim();
            
            // Limit content length for database storage
            const maxLength = 15000;
            if (content.length > maxLength) {
                content = content.substring(0, maxLength) + '... [Content truncated]';
            }
            
            // Extract title
            const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
            
            // Extract meta description
            const description = $('meta[name="description"]').attr('content') || 
                              $('meta[property="og:description"]').attr('content') || '';
            
            const articleData = {
                title,
                description,
                content,
                url,
                wordCount: content.split(' ').length
            };
            
            // Store article content in database
            const stored = await this.supabase.storeArticleContent(tweetId, url, articleData);
            if (stored) {
                console.log(`💾 Article stored: "${title}" (${articleData.wordCount} words)`);
                return true;
            } else {
                console.warn(`⚠️ Failed to store article: ${url}`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ Error fetching article ${url}:`, error.message);
            
            // Store failed article fetch
            await this.supabase.storeFailedArticle(tweetId, url, error.message);
            return false;
        }
    }

    extractUrls(tweet) {
        const urls = [];
        
        try {
            // Check tweet content for URLs
            const content = tweet.content || '';
            const urlRegex = /https?:\/\/[^\s]+/g;
            const contentUrls = content.match(urlRegex) || [];
            urls.push(...contentUrls);
            
            // Check raw data for expanded URLs
            const rawData = tweet.raw_data;
            if (rawData?.attributes?.post_data?.entities?.urls) {
                const expandedUrls = rawData.attributes.post_data.entities.urls
                    .map(url => url.expanded_url || url.url)
                    .filter(url => url);
                urls.push(...expandedUrls);
            }
            
            // Remove duplicates
            return [...new Set(urls)];
            
        } catch (error) {
            console.error('❌ Error extracting URLs:', error);
            return [];
        }
    }

    async fetchAllArticles() {
        try {
            console.log('🚀 Starting article content fetching...\n');
            
            // Initialize the article content table
            await this.supabase.initializeArticleContentTable();
            
            // Get all tweets from database
            const tweets = await this.supabase.getAllPosts();
            console.log(`📊 Found ${tweets.length} tweets to process`);
            
            let processedCount = 0;
            let articlesFound = 0;
            let articlesStored = 0;
            let failedCount = 0;
            
            for (const tweet of tweets) {
                // Extract URLs from the tweet
                const urls = this.extractUrls(tweet);
                
                if (urls.length === 0) {
                    console.log(`📝 Tweet ${tweet.junkipedia_id}: No URLs found`);
                    processedCount++;
                    continue;
                }
                
                console.log(`🔗 Tweet ${tweet.junkipedia_id}: Found ${urls.length} URL(s)`);
                articlesFound += urls.length;
                
                // Fetch and store each article
                for (const url of urls) {
                    const success = await this.fetchArticleContent(tweet.junkipedia_id, url);
                    if (success) {
                        articlesStored++;
                    } else {
                        failedCount++;
                    }
                    
                    // Add delay to be respectful to servers
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                processedCount++;
                
                // Progress update every 10 tweets
                if (processedCount % 10 === 0) {
                    console.log(`\n📊 Progress: ${processedCount}/${tweets.length} tweets processed`);
                    console.log(`   📄 Articles found: ${articlesFound}`);
                    console.log(`   💾 Articles stored: ${articlesStored}`);
                    console.log(`   ❌ Failed: ${failedCount}\n`);
                }
            }
            
            console.log(`\n📊 Article Fetching Summary:`);
            console.log(`   ✅ Processed: ${processedCount} tweets`);
            console.log(`   🔗 URLs found: ${articlesFound}`);
            console.log(`   💾 Articles stored: ${articlesStored}`);
            console.log(`   ❌ Failed: ${failedCount}`);
            console.log(`   📈 Success rate: ${((articlesStored / articlesFound) * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error('❌ Error fetching articles:', error);
        }
    }
}

// Run the article fetcher
async function main() {
    const fetcher = new ArticleFetcher();
    await fetcher.fetchAllArticles();
}

main().catch(console.error);
