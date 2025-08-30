const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

class GeminiAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async analyzeTweet(tweet) {
        try {
            console.log(`🔍 Analyzing tweet ${tweet.junkipedia_id}...`);
            
            // Prepare the tweet content for analysis
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            // Create context about the tweet
            const context = `
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
  "recommendations": ["suggestions for addressing concerns"]
}
`;

            const result = await this.model.generateContent(context);
            const response = await result.response;
            const text = response.text();
            
            // Parse the JSON response
            let analysis;
            try {
                // Extract JSON from the response (it might have markdown formatting)
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('❌ Error parsing Gemini response:', parseError);
                // Create a fallback analysis
                analysis = {
                    is_potentially_transphobic: false,
                    confidence_level: "low",
                    concerns: ["Unable to parse analysis"],
                    explanation: "Error parsing Gemini response",
                    severity: "unknown",
                    recommendations: ["Manual review recommended"]
                };
            }
            
            // Store the analysis in the database
            await this.storeAnalysis(tweet.junkipedia_id, analysis);
            
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

    async analyzeAllTweets() {
        try {
            console.log('🚀 Starting Gemini analysis of all tweets...\n');
            
            // Get all tweets from database
            const tweets = await this.supabase.getAllPosts();
            console.log(`📊 Found ${tweets.length} tweets to analyze`);
            
            let analyzedCount = 0;
            let flaggedCount = 0;
            
            for (const tweet of tweets) {
                const analysis = await this.analyzeTweet(tweet);
                
                if (analysis) {
                    analyzedCount++;
                    if (analysis.is_potentially_transphobic) {
                        flaggedCount++;
                        console.log(`🚨 FLAGGED: Tweet ${tweet.junkipedia_id}`);
                        console.log(`   📝 Content: ${tweet.content.substring(0, 100)}...`);
                        console.log(`   ⚠️  Concerns: ${analysis.concerns.join(', ')}`);
                        console.log(`   📊 Severity: ${analysis.severity}\n`);
                    }
                }
                
                // Add delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log(`\n📊 Analysis Summary:`);
            console.log(`   ✅ Analyzed: ${analyzedCount} tweets`);
            console.log(`   🚨 Flagged: ${flaggedCount} tweets`);
            console.log(`   📈 Flag rate: ${((flaggedCount / analyzedCount) * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error('❌ Error analyzing tweets:', error);
        }
    }

    async storeAnalysis(tweetId, analysis) {
        try {
            const analysisData = {
                tweet_id: tweetId,
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns,
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations,
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

    async getAnalysisSummary() {
        try {
            const { data, error } = await this.supabase.supabase
                .from('tweet_analysis')
                .select('*')
                .order('analyzed_at', { ascending: false });
            
            if (error) throw error;
            
            const flaggedTweets = data.filter(analysis => analysis.is_potentially_transphobic);
            const highSeverity = flaggedTweets.filter(analysis => analysis.severity === 'high');
            const mediumSeverity = flaggedTweets.filter(analysis => analysis.severity === 'medium');
            const lowSeverity = flaggedTweets.filter(analysis => analysis.severity === 'low');
            
            console.log(`\n📊 Analysis Summary:`);
            console.log(`   📝 Total analyzed: ${data.length}`);
            console.log(`   🚨 Flagged tweets: ${flaggedTweets.length}`);
            console.log(`   🔴 High severity: ${highSeverity.length}`);
            console.log(`   🟡 Medium severity: ${mediumSeverity.length}`);
            console.log(`   🟢 Low severity: ${lowSeverity.length}`);
            
            if (flaggedTweets.length > 0) {
                console.log(`\n🚨 Flagged Tweets:`);
                flaggedTweets.forEach(analysis => {
                    console.log(`   📝 Tweet ${analysis.tweet_id}:`);
                    console.log(`      ⚠️  Severity: ${analysis.severity}`);
                    console.log(`      📊 Confidence: ${analysis.confidence_level}`);
                    console.log(`      💬 Concerns: ${analysis.concerns.join(', ')}`);
                });
            }
            
            return data;
            
        } catch (error) {
            console.error('❌ Error getting analysis summary:', error);
            return [];
        }
    }
}

// Run the analysis
async function main() {
    const analyzer = new GeminiAnalyzer();
    
    // Check if we have a Gemini API key
    if (!config.gemini?.apiKey) {
        console.log('❌ No Gemini API key found. Please add GEMINI_API_KEY to your .env file');
        console.log('📋 Get your API key from: https://makersuite.google.com/app/apikey');
        return;
    }
    
    // Initialize the analysis table
    await analyzer.supabase.initializeAnalysisTable();
    
    // Analyze all tweets
    await analyzer.analyzeAllTweets();
    
    // Show summary
    await analyzer.getAnalysisSummary();
}

main().catch(console.error);
