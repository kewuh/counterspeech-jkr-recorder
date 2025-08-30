const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');
const axios = require('axios');

class ComprehensiveAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async downloadImage(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const buffer = Buffer.from(response.data);
            const base64 = buffer.toString('base64');
            
            return { 
                base64, 
                mimeType: response.headers['content-type'] || 'image/jpeg' 
            };
        } catch (error) {
            console.error(`❌ Error downloading image ${url}:`, error.message);
            return null;
        }
    }

    async extractImages(tweet) {
        const images = [];
        const media = tweet.raw_data?.attributes?.post_data?.extended_entities?.media;
        
        if (media && media.length > 0) {
            for (const item of media) {
                if (item.type === 'photo') {
                    const imageUrl = item.media_url_https || item.url;
                    console.log(`   📥 Downloading image: ${imageUrl}`);
                    
                    const imageData = await this.downloadImage(imageUrl);
                    if (imageData) {
                        images.push(imageData);
                        console.log(`   ✅ Image downloaded successfully`);
                    }
                }
            }
        }
        
        return images;
    }

    async analyzeTweetComprehensive(tweet) {
        try {
            console.log(`🔍 Comprehensive analysis for tweet ${tweet.junkipedia_id}...`);
            console.log(`📝 Content: ${tweet.content.substring(0, 100)}...`);
            
            // Get stored articles
            const storedArticles = await this.supabase.getArticleContent(tweet.junkipedia_id);
            const articlesWithContent = storedArticles?.filter(article => 
                article.content && article.content.trim().length > 0 && article.word_count > 10
            ) || [];
            
            // Extract images
            const images = await this.extractImages(tweet);
            
            console.log(`   📄 Articles: ${articlesWithContent.length} with content`);
            console.log(`   🖼️ Images: ${images.length} downloaded`);
            
            // Prepare content parts for analysis
            const contentParts = [];
            
            // Build the prompt
            let prompt = `
Tweet Content: "${tweet.content}"
Tweet URL: ${tweet.url}
Published: ${tweet.published_at}

${articlesWithContent.length > 0 ? `Linked Articles (${articlesWithContent.length}):` : 'No linked articles found.'}
${articlesWithContent.map(article => 
    `Article: ${article.title}\nURL: ${article.url}\nContent: ${article.content.substring(0, 800)}...`
).join('\n\n')}

${images.length > 0 ? `This tweet contains ${images.length} image(s).` : 'This tweet contains no images.'}

IMPORTANT: Base your analysis ONLY on the actual content provided. Do NOT make assumptions about public figures, their identities, or their views. Do NOT reference external knowledge about specific people. Focus on the explicit content and implicit messaging in the provided text and images.

Please analyze this tweet comprehensively for potentially transphobic content. Consider:

TEXT ANALYSIS:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous

VISUAL ANALYSIS (if images present):
7. Visual content that may be harmful or discriminatory
8. Images that reinforce harmful stereotypes
9. Media that could incite violence or discrimination
10. How visual elements relate to transphobic narratives

ARTICLE ANALYSIS (if articles present):
11. How linked articles amplify or contradict the tweet's message
12. Whether articles contain transphobic content
13. The overall narrative being promoted through articles

COMBINED ANALYSIS:
14. How text, visual, and article content work together
15. The cumulative impact of all content types
16. Whether the combination creates a harmful narrative

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this content is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "text_analysis": "analysis of the tweet text content specifically",
  "visual_analysis": "analysis of any visual content and its relationship to transphobia",
  "article_analysis": "analysis of linked articles specifically",
  "combined_analysis": "how all content types work together",
  "articles_analyzed": ${articlesWithContent.length},
  "images_analyzed": ${images.length}
}
`;

            contentParts.push(prompt);
            
            // Add images to the analysis
            for (const image of images) {
                contentParts.push({
                    inlineData: {
                        data: image.base64,
                        mimeType: image.mimeType
                    }
                });
            }

            // Run the analysis
            const result = await this.model.generateContent(contentParts);
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
                    text_analysis: "Unable to analyze tweet content",
                    visual_analysis: "Unable to analyze visual content",
                    article_analysis: "Unable to analyze article content",
                    combined_analysis: "Unable to analyze combined content",
                    articles_analyzed: articlesWithContent.length,
                    images_analyzed: images.length
                };
            }
            
            // Store the analysis
            await this.storeAnalysis(tweet.junkipedia_id, analysis, articlesWithContent.length, images.length);
            
            console.log(`✅ Comprehensive analysis complete for tweet ${tweet.junkipedia_id}`);
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   📄 Articles analyzed: ${analysis.articles_analyzed}`);
            console.log(`   🖼️ Images analyzed: ${analysis.images_analyzed}`);
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Error analyzing tweet ${tweet.junkipedia_id}:`, error.message);
            return null;
        }
    }

    async storeAnalysis(tweetId, analysis, articleCount, imageCount) {
        try {
            const analysisData = {
                tweet_id: tweetId,
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns,
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations,
                text_analysis: analysis.text_analysis || null,
                visual_analysis: analysis.visual_analysis || null,
                article_analysis: analysis.article_analysis || null,
                combined_analysis: analysis.combined_analysis || null,
                articles_analyzed: articleCount,
                images_analyzed: imageCount,
                analyzed_at: new Date().toISOString(),
                raw_analysis: analysis
            };
            
            const { error } = await this.supabase.supabase
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

    async analyzeAllTweetsComprehensive() {
        try {
            console.log('🚀 Starting comprehensive analysis of all tweets...\n');
            
            // Initialize the analysis table
            await this.supabase.initializeAnalysisTable();
            
            // Get all tweets
            const { data: tweets, error } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .order('published_at', { ascending: false });
            
            if (error) throw error;
            
            console.log(`📊 Found ${tweets.length} tweets to analyze\n`);
            
            let analyzedCount = 0;
            let flaggedCount = 0;
            
            for (const tweet of tweets) {
                const analysis = await this.analyzeTweetComprehensive(tweet);
                
                if (analysis) {
                    analyzedCount++;
                    if (analysis.is_potentially_transphobic) {
                        flaggedCount++;
                        console.log(`🚨 FLAGGED: Tweet ${tweet.junkipedia_id}`);
                        console.log(`   📝 Content: ${tweet.content.substring(0, 100)}...`);
                        console.log(`   ⚠️  Concerns: ${analysis.concerns.join(', ')}`);
                        console.log(`   📊 Severity: ${analysis.severity}`);
                        console.log('');
                    }
                }
                
                // Add delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            console.log(`\n📊 Comprehensive Analysis Summary:`);
            console.log(`   ✅ Analyzed: ${analyzedCount} tweets`);
            console.log(`   🚨 Flagged: ${flaggedCount} tweets`);
            if (analyzedCount > 0) {
                console.log(`   📈 Flag rate: ${((flaggedCount / analyzedCount) * 100).toFixed(1)}%`);
            }
            
        } catch (error) {
            console.error('❌ Error analyzing tweets:', error);
        }
    }
}

// Run the comprehensive analysis
async function main() {
    const analyzer = new ComprehensiveAnalyzer();
    
    // Check if we have a Gemini API key
    if (!config.gemini?.apiKey) {
        console.log('❌ No Gemini API key found. Please add GEMINI_API_KEY to your .env file');
        console.log('📋 Get your API key from: https://makersuite.google.com/app/apikey');
        return;
    }
    
    // Analyze all tweets comprehensively
    await analyzer.analyzeAllTweetsComprehensive();
}

main().catch(console.error);
