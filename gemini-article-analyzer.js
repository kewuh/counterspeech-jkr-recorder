const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');
const axios = require('axios');
const cheerio = require('cheerio');

class ArticleAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async fetchArticleContent(tweetId, url) {
        try {
            // Check if article content already exists in database
            const existingArticle = await this.supabase.checkArticleExists(tweetId, url);
            if (existingArticle && existingArticle.status === 'success') {
                console.log(`📄 Article already exists in database: ${url}`);
                return await this.supabase.getArticleContent(tweetId);
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
            
            // Limit content length to avoid token limits and database storage
            const maxLength = 15000; // Increased for database storage
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
                console.log(`💾 Article content stored in database: ${url}`);
            } else {
                console.warn(`⚠️ Failed to store article content: ${url}`);
            }
            
            return articleData;
            
        } catch (error) {
            console.error(`❌ Error fetching article ${url}:`, error.message);
            
            // Store failed article fetch
            await this.supabase.storeFailedArticle(tweetId, url, error.message);
            
            return null;
        }
    }

    async analyzeTweetWithArticles(tweet) {
        try {
            console.log(`🔍 Analyzing tweet ${tweet.junkipedia_id} with linked articles...`);
            
            // Get stored articles from database
            const storedArticles = await this.supabase.getArticleContent(tweet.junkipedia_id);
            
            if (!storedArticles || storedArticles.length === 0) {
                console.log(`   📝 No stored articles found for tweet`);
                return await this.analyzeTweetOnly(tweet);
            }
            
            // Filter out articles with no content (like Twitter images)
            const articlesWithContent = storedArticles.filter(article => 
                article.content && article.content.trim().length > 0 && article.word_count > 10
            );
            
            if (articlesWithContent.length === 0) {
                console.log(`   📝 No articles with meaningful content found`);
                return await this.analyzeTweetOnly(tweet);
            }
            
            console.log(`   📄 Found ${articlesWithContent.length} article(s) with content`);
            
            // Display article info
            for (const article of articlesWithContent) {
                console.log(`   📄 Article: "${article.title}" (${article.word_count} words)`);
            }
            
            // Analyze the combined content
            return await this.analyzeCombinedContent(tweet, articlesWithContent);
            
        } catch (error) {
            console.error(`❌ Error analyzing tweet ${tweet.junkipedia_id}:`, error.message);
            return null;
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

    async analyzeCombinedContent(tweet, articles) {
        try {
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            // Prepare article content
            let articleContent = '';
            if (articles.length > 0) {
                articleContent = articles.map(article => 
                    `Article: ${article.title}\nURL: ${article.url}\nContent: ${article.content.substring(0, 2000)}...`
                ).join('\n\n');
            }
            
            const prompt = `
Tweet Content: "${tweetContent}"
Tweet URL: ${tweetUrl}
Published: ${publishedAt}

${articles.length > 0 ? `Linked Articles (${articles.length}):\n${articleContent}` : 'No linked articles found.'}

Please analyze this tweet AND any linked articles for potentially transphobic content. Consider:

1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous
7. How the tweet content relates to the linked articles
8. Whether the articles amplify or contradict the tweet's message
9. The overall narrative being promoted

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this content is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "tweet_analysis": "analysis of the tweet content specifically",
  "article_analysis": "analysis of the linked articles specifically",
  "combined_analysis": "how tweet and articles work together",
  "articles_analyzed": ${articles.length}
}
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Parse the JSON response
            let analysis;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('❌ Error parsing Gemini response:', parseError);
                analysis = {
                    is_potentially_transphobic: false,
                    confidence_level: "low",
                    concerns: ["Unable to parse analysis"],
                    explanation: "Error parsing Gemini response",
                    severity: "unknown",
                    recommendations: ["Manual review recommended"],
                    tweet_analysis: "Unable to analyze tweet content",
                    article_analysis: "Unable to analyze article content",
                    combined_analysis: "Unable to analyze combined content",
                    articles_analyzed: articles.length
                };
            }
            
            // Store the analysis
            await this.storeAnalysis(tweet.junkipedia_id, analysis, articles.length);
            
            console.log(`✅ Article analysis complete for tweet ${tweet.junkipedia_id}`);
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   📄 Articles analyzed: ${articles.length}`);
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Error analyzing combined content:`, error.message);
            return null;
        }
    }

    async analyzeTweetOnly(tweet) {
        try {
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            const prompt = `
Tweet Content: "${tweetContent}"
Tweet URL: ${tweetUrl}
Published: ${publishedAt}

No linked articles found.

Please analyze this tweet for potentially transphobic content. Consider:
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
  "explanation": "detailed explanation of why this tweet is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "tweet_analysis": "analysis of the tweet content",
  "article_analysis": "No articles to analyze",
  "combined_analysis": "Tweet only analysis",
  "articles_analyzed": 0
}
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            let analysis;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('❌ Error parsing Gemini response:', parseError);
                analysis = {
                    is_potentially_transphobic: false,
                    confidence_level: "low",
                    concerns: ["Unable to parse analysis"],
                    explanation: "Error parsing Gemini response",
                    severity: "unknown",
                    recommendations: ["Manual review recommended"],
                    tweet_analysis: "Unable to analyze tweet content",
                    article_analysis: "No articles to analyze",
                    combined_analysis: "Tweet only analysis",
                    articles_analyzed: 0
                };
            }
            
            await this.storeAnalysis(tweet.junkipedia_id, analysis, 0);
            
            console.log(`✅ Tweet-only analysis complete for tweet ${tweet.junkipedia_id}`);
            return analysis;
            
        } catch (error) {
            console.error(`❌ Error analyzing tweet only:`, error.message);
            return null;
        }
    }

    async analyzeAllTweetsWithArticles() {
        try {
            console.log('🚀 Starting article-enhanced Gemini analysis...\n');
            
            // Get all tweets from database
            const tweets = await this.supabase.getAllPosts();
            console.log(`📊 Found ${tweets.length} tweets to analyze`);
            
            let analyzedCount = 0;
            let flaggedCount = 0;
            let totalArticles = 0;
            
            for (const tweet of tweets) {
                // Analyze the tweet with articles
                const analysis = await this.analyzeTweetWithArticles(tweet);
                
                if (analysis) {
                    analyzedCount++;
                    totalArticles += analysis.articles_analyzed || 0;
                    
                    if (analysis.is_potentially_transphobic) {
                        flaggedCount++;
                        console.log(`🚨 FLAGGED: Tweet ${tweet.junkipedia_id}`);
                        console.log(`   📝 Content: ${tweet.content.substring(0, 100)}...`);
                        console.log(`   ⚠️  Concerns: ${analysis.concerns.join(', ')}`);
                        console.log(`   📊 Severity: ${analysis.severity}`);
                        console.log(`   📄 Articles: ${analysis.articles_analyzed}`);
                        if (analysis.combined_analysis) {
                            console.log(`   🔗 Combined: ${analysis.combined_analysis.substring(0, 150)}...`);
                        }
                        console.log('');
                    }
                }
                
                // Add delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            console.log(`\n📊 Article-Enhanced Analysis Summary:`);
            console.log(`   ✅ Analyzed: ${analyzedCount} tweets`);
            console.log(`   🚨 Flagged: ${flaggedCount} tweets`);
            console.log(`   📈 Flag rate: ${((flaggedCount / analyzedCount) * 100).toFixed(1)}%`);
            console.log(`   📄 Total articles analyzed: ${totalArticles}`);
            
        } catch (error) {
            console.error('❌ Error analyzing tweets with articles:', error);
        }
    }

    async storeAnalysis(tweetId, analysis, articleCount = 0) {
        try {
            const analysisData = {
                tweet_id: tweetId,
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns,
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations,
                tweet_analysis: analysis.tweet_analysis || null,
                article_analysis: analysis.article_analysis || null,
                combined_analysis: analysis.combined_analysis || null,
                articles_analyzed: articleCount,
                analyzed_at: new Date().toISOString(),
                raw_analysis: analysis
            };
            
            const { data, error } = await this.supabase.supabase
                .from('tweet_analysis')
                .upsert([analysisData], { 
                    onConflict: 'tweet_id',
                    ignoreDuplicates: false 
                });
            
            if (error) {
                console.error('❌ Error storing analysis:', error);
            }
            
        } catch (error) {
            console.error('❌ Error storing analysis:', error);
        }
    }
}

// Run the article-enhanced analysis
async function main() {
    const analyzer = new ArticleAnalyzer();
    
    // Check if we have a Gemini API key
    if (!config.gemini?.apiKey) {
        console.log('❌ No Gemini API key found. Please add GEMINI_API_KEY to your .env file');
        console.log('📋 Get your API key from: https://makersuite.google.com/app/apikey');
        return;
    }
    
    // Initialize the tables
    await analyzer.supabase.initializeAnalysisTable();
    await analyzer.supabase.initializeArticleContentTable();
    
    // Analyze all tweets with articles
    await analyzer.analyzeAllTweetsWithArticles();
}

main().catch(console.error);
