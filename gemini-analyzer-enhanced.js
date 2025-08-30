const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

class EnhancedGeminiAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async analyzeTweetWithMedia(tweet) {
        try {
            console.log(`🔍 Analyzing tweet ${tweet.junkipedia_id} with media...`);
            
            // Prepare the tweet content
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            // Extract media content
            const mediaContent = this.extractMediaContent(tweet);
            
            // Create context about the tweet
            const context = `
Tweet Content: "${tweetContent}"
Tweet URL: ${tweetUrl}
Published: ${publishedAt}

${mediaContent ? `Media Content: ${mediaContent}` : 'No media content'}

Please analyze this tweet for potentially transphobic content. Consider:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous
7. Visual content that may be harmful or discriminatory
8. Images that reinforce harmful stereotypes
9. Media that could incite violence or discrimination

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this tweet is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "media_analysis": "analysis of any visual content if present"
}
`;

            const result = await this.model.generateContent(context);
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
                    media_analysis: "Unable to analyze media"
                };
            }
            
            // Store the analysis in the database
            await this.storeAnalysis(tweet.junkipedia_id, analysis);
            
            console.log(`✅ Analysis complete for tweet ${tweet.junkipedia_id}`);
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            if (analysis.media_analysis) {
                console.log(`   🖼️  Media analysis: ${analysis.media_analysis.substring(0, 100)}...`);
            }
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Error analyzing tweet ${tweet.junkipedia_id}:`, error.message);
            return null;
        }
    }

    extractMediaContent(tweet) {
        try {
            const rawData = tweet.raw_data;
            const postData = rawData?.attributes?.post_data;
            
            if (!postData) return null;
            
            let mediaDescription = [];
            
            // Check for extended entities (images, videos)
            if (postData.extended_entities?.media) {
                const media = postData.extended_entities.media;
                media.forEach((item, index) => {
                    if (item.type === 'photo') {
                        mediaDescription.push(`Image ${index + 1}: Photo`);
                        if (item.alt_text) {
                            mediaDescription.push(`Alt text: ${item.alt_text}`);
                        }
                    } else if (item.type === 'video') {
                        mediaDescription.push(`Video ${index + 1}: Video content`);
                        if (item.video_info?.variants) {
                            mediaDescription.push(`Video variants: ${item.video_info.variants.length} available`);
                        }
                    } else if (item.type === 'animated_gif') {
                        mediaDescription.push(`GIF ${index + 1}: Animated GIF`);
                    }
                });
            }
            
            // Check for entities (links, mentions)
            if (postData.entities) {
                if (postData.entities.urls) {
                    const urls = postData.entities.urls.map(url => url.expanded_url || url.url);
                    mediaDescription.push(`Links: ${urls.join(', ')}`);
                }
                
                if (postData.entities.user_mentions) {
                    const mentions = postData.entities.user_mentions.map(mention => `@${mention.screen_name}`);
                    mediaDescription.push(`Mentions: ${mentions.join(', ')}`);
                }
            }
            
            // Check for card content (preview cards)
            if (postData.card) {
                mediaDescription.push(`Card: ${postData.card.name || 'Unknown card type'}`);
                if (postData.card.binding_values) {
                    const cardData = postData.card.binding_values;
                    if (cardData.title?.string_value) {
                        mediaDescription.push(`Card title: ${cardData.title.string_value}`);
                    }
                    if (cardData.description?.string_value) {
                        mediaDescription.push(`Card description: ${cardData.description.string_value}`);
                    }
                }
            }
            
            return mediaDescription.length > 0 ? mediaDescription.join(' | ') : null;
            
        } catch (error) {
            console.error('❌ Error extracting media content:', error);
            return null;
        }
    }

    async analyzeReplyContext(tweet) {
        try {
            const rawData = tweet.raw_data;
            const postData = rawData?.attributes?.post_data;
            const searchData = rawData?.attributes?.search_data_fields;
            
            let replyContext = null;
            
            // Check for reply data
            if (postData?.in_reply_to_screen_name && postData?.in_reply_to_status_id_str) {
                replyContext = {
                    type: 'reply',
                    username: postData.in_reply_to_screen_name,
                    tweetId: postData.in_reply_to_status_id_str,
                    url: `https://twitter.com/${postData.in_reply_to_screen_name}/status/${postData.in_reply_to_status_id_str}`
                };
            } else if (searchData?.quoted_id) {
                replyContext = {
                    type: 'quote',
                    tweetId: searchData.quoted_id,
                    url: `https://twitter.com/i/status/${searchData.quoted_id}`
                };
            } else if (searchData?.shared_id) {
                replyContext = {
                    type: 'retweet',
                    tweetId: searchData.shared_id,
                    url: `https://twitter.com/i/status/${searchData.shared_id}`
                };
            }
            
            if (replyContext) {
                console.log(`   🔄 ${replyContext.type.toUpperCase()}: ${replyContext.url}`);
                
                // Try to get the original tweet content for context
                try {
                    const originalTweet = await this.getOriginalTweetContent(replyContext.tweetId);
                    if (originalTweet) {
                        return {
                            ...replyContext,
                            originalContent: originalTweet.content,
                            originalMedia: this.extractMediaContent(originalTweet)
                        };
                    }
                } catch (error) {
                    console.log(`   ⚠️  Could not fetch original tweet: ${error.message}`);
                }
            }
            
            return replyContext;
            
        } catch (error) {
            console.error('❌ Error analyzing reply context:', error);
            return null;
        }
    }

    async getOriginalTweetContent(tweetId) {
        try {
            // Try to find the original tweet in our database
            const tweets = await this.supabase.getAllPosts();
            const originalTweet = tweets.find(t => 
                t.junkipedia_id === tweetId || 
                t.url?.includes(tweetId) ||
                t.raw_data?.attributes?.post_data?.id_str === tweetId
            );
            
            return originalTweet || null;
            
        } catch (error) {
            console.error('❌ Error getting original tweet content:', error);
            return null;
        }
    }

    async analyzeAllTweetsWithMedia() {
        try {
            console.log('🚀 Starting enhanced Gemini analysis with media...\n');
            
            // Get all tweets from database
            const tweets = await this.supabase.getAllPosts();
            console.log(`📊 Found ${tweets.length} tweets to analyze`);
            
            let analyzedCount = 0;
            let flaggedCount = 0;
            
            for (const tweet of tweets) {
                // Analyze reply context first
                const replyContext = await this.analyzeReplyContext(tweet);
                
                // Analyze the tweet with media
                const analysis = await this.analyzeTweetWithMedia(tweet);
                
                if (analysis) {
                    analyzedCount++;
                    if (analysis.is_potentially_transphobic) {
                        flaggedCount++;
                        console.log(`🚨 FLAGGED: Tweet ${tweet.junkipedia_id}`);
                        console.log(`   📝 Content: ${tweet.content.substring(0, 100)}...`);
                        console.log(`   ⚠️  Concerns: ${analysis.concerns.join(', ')}`);
                        console.log(`   📊 Severity: ${analysis.severity}`);
                        if (replyContext) {
                            console.log(`   🔄 Context: ${replyContext.type} to ${replyContext.url}`);
                        }
                        console.log('');
                    }
                }
                
                // Add delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
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
                media_analysis: analysis.media_analysis || null,
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

// Run the enhanced analysis
async function main() {
    const analyzer = new EnhancedGeminiAnalyzer();
    
    // Check if we have a Gemini API key
    if (!config.gemini?.apiKey) {
        console.log('❌ No Gemini API key found. Please add GEMINI_API_KEY to your .env file');
        console.log('📋 Get your API key from: https://makersuite.google.com/app/apikey');
        return;
    }
    
    // Initialize the analysis table
    await analyzer.supabase.initializeAnalysisTable();
    
    // Analyze all tweets with media
    await analyzer.analyzeAllTweetsWithMedia();
}

main().catch(console.error);
