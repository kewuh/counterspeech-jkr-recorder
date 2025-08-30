const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

class NewTweetAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async getNewTweets() {
        try {
            // Get tweets that don't have analysis yet
            const { data: tweets, error } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(10); // Only analyze 10 new tweets per run to respect rate limits

            if (error) throw error;

            // Filter out tweets that already have analysis
            const { data: existingAnalyses } = await this.supabase.supabase
                .from('tweet_analysis')
                .select('tweet_id');

            const analyzedTweetIds = new Set(existingAnalyses?.map(a => a.tweet_id) || []);
            const newTweets = tweets.filter(tweet => !analyzedTweetIds.has(tweet.junkipedia_id));

            return newTweets;
        } catch (error) {
            console.error('❌ Error getting new tweets:', error);
            return [];
        }
    }

    async analyzeTweet(tweet) {
        try {
            console.log(`🔍 Analyzing new tweet ${tweet.junkipedia_id}...`);
            
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            const prompt = `
Tweet Content: "${tweetContent}"
Tweet URL: ${tweetUrl}
Published: ${publishedAt}

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
            
            console.log(`✅ Analysis complete for tweet ${tweet.junkipedia_id}`);
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Error analyzing tweet ${tweet.junkipedia_id}:`, error.message);
            return null;
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

    async analyzeNewTweets() {
        try {
            console.log('🚀 Starting analysis of new tweets...\n');
            
            // Initialize the analysis table
            await this.supabase.initializeAnalysisTable();
            
            // Get new tweets that haven't been analyzed
            const newTweets = await this.getNewTweets();
            console.log(`📊 Found ${newTweets.length} new tweets to analyze`);
            
            if (newTweets.length === 0) {
                console.log('✅ No new tweets to analyze');
                return;
            }
            
            let analyzedCount = 0;
            let flaggedCount = 0;
            
            for (const tweet of newTweets) {
                const analysis = await this.analyzeTweet(tweet);
                
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
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            console.log(`\n📊 New Tweet Analysis Summary:`);
            console.log(`   ✅ Analyzed: ${analyzedCount} new tweets`);
            console.log(`   🚨 Flagged: ${flaggedCount} tweets`);
            if (analyzedCount > 0) {
                console.log(`   📈 Flag rate: ${((flaggedCount / analyzedCount) * 100).toFixed(1)}%`);
            }
            
        } catch (error) {
            console.error('❌ Error analyzing new tweets:', error);
        }
    }
}

// Run the new tweet analysis
async function main() {
    const analyzer = new NewTweetAnalyzer();
    
    // Check if we have a Gemini API key
    if (!config.gemini?.apiKey) {
        console.log('❌ No Gemini API key found. Please add GEMINI_API_KEY to your .env file');
        console.log('📋 Get your API key from: https://makersuite.google.com/app/apikey');
        return;
    }
    
    // Analyze only new tweets
    await analyzer.analyzeNewTweets();
}

main().catch(console.error);
