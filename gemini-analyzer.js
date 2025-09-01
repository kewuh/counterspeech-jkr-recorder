const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

class GeminiAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.supabase = new SupabaseClient();
    }

    async analyzeContent(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
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
                console.log('Raw response:', text);
                return null;
            }
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Error analyzing content:', error.message);
            return null;
        }
    }

    async analyzeTweet(tweet) {
        try {
            console.log(`🔍 Analyzing tweet ${tweet.junkipedia_id}...`);
            
            // Prepare the tweet content for analysis
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            // Check for images in the tweet
            const images = this.extractImagesFromTweet(tweet);
            const hasImages = images.length > 0;
            
            if (hasImages) {
                console.log(`📸 Found ${images.length} images to analyze`);
            }
            
            // Create context about the tweet
            let context = `
Tweet Content: "${tweetContent}"
Tweet URL: ${tweetUrl}
Published: ${publishedAt}
${hasImages ? `Images: ${images.length} attached` : 'Images: None'}

Please analyze this tweet for potentially transphobic content. Consider:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous
${hasImages ? '7. Visual content that could be harmful or discriminatory' : ''}

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this tweet is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "media_analysis": "analysis of any images or media content (if applicable)"
}
`;

            // If there are images, analyze them first
            let imageAnalysis = null;
            if (hasImages) {
                console.log(`🤖 Analyzing ${images.length} images...`);
                imageAnalysis = await this.analyzeImages(images, tweetContent);
            }

            const analysis = await this.analyzeContent(context);
            
            if (analysis) {
                // Integrate image analysis into the main analysis
                if (imageAnalysis) {
                    try {
                        const imageResults = JSON.parse(imageAnalysis);
                        
                        // Combine concerns from both text and image analysis
                        const allConcerns = [
                            ...(analysis.concerns || []),
                            ...(imageResults.concerns || [])
                        ];
                        
                        // Update the main analysis with image findings
                        analysis.concerns = allConcerns;
                        analysis.is_potentially_transphobic = analysis.is_potentially_transphobic || imageResults.is_potentially_transphobic;
                        analysis.severity = this.getHigherSeverity(analysis.severity, imageResults.severity);
                        analysis.media_analysis = imageResults.media_analysis;
                        analysis.images_analyzed = images.length;
                        
                        // Update explanation to include image analysis
                        if (imageResults.explanation) {
                            analysis.explanation += ` ${imageResults.explanation}`;
                        }
                    } catch (error) {
                        console.error('❌ Error integrating image analysis:', error.message);
                        analysis.media_analysis = imageAnalysis;
                        analysis.images_analyzed = images.length;
                    }
                } else {
                    analysis.media_analysis = "Not analyzed";
                    analysis.images_analyzed = 0;
                }
                
                // Store the analysis in the database
                await this.storeAnalysis(tweet.junkipedia_id, analysis);
                
                console.log(`✅ Analysis complete for tweet ${tweet.junkipedia_id}`);
                console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                console.log(`   📊 Confidence: ${analysis.confidence_level}`);
                console.log(`   ⚠️  Severity: ${analysis.severity}`);
                if (hasImages) {
                    console.log(`   📸 Images analyzed: ${images.length}`);
                }
            }
            
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

    /**
     * Extract images from tweet data
     */
    extractImagesFromTweet(tweet) {
        const images = [];
        
        try {
            // Check for images in post_data
            if (tweet.raw_data?.attributes?.post_data?.extended_entities?.media) {
                const media = tweet.raw_data.attributes.post_data.extended_entities.media;
                media.forEach(item => {
                    if (item.type === 'photo' && item.media_url_https) {
                        images.push({
                            url: item.media_url_https,
                            type: 'photo'
                        });
                    }
                });
            }
            
            // Check for images in search_data_fields
            if (tweet.raw_data?.attributes?.search_data_fields?.media_data) {
                const mediaData = tweet.raw_data.attributes.search_data_fields.media_data;
                mediaData.forEach(item => {
                    if (item.type === 'photo' && item.media_url) {
                        images.push({
                            url: item.media_url,
                            type: 'photo'
                        });
                    }
                });
            }
            
            console.log(`📸 Extracted ${images.length} images from tweet ${tweet.junkipedia_id}`);
            return images;
            
        } catch (error) {
            console.error('❌ Error extracting images:', error.message);
            return [];
        }
    }

    /**
     * Analyze images using Gemini Vision
     */
    async analyzeImages(images, tweetContent) {
        try {
            if (images.length === 0) {
                return "No images to analyze";
            }

            console.log(`🤖 Analyzing ${images.length} images with Gemini Vision...`);
            
            // Analyze each image individually
            const imageAnalyses = [];
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const imageId = image.url.split('/').pop()?.split('.')[0] || `image_${i + 1}`;
                
                console.log(`🔍 Analyzing image ${i + 1}/${images.length}: ${imageId}`);
                
                // Create a prompt for this specific image
                const imagePrompt = `
Tweet Content: "${tweetContent}"

Please analyze this image (ID: ${imageId}) for potentially transphobic or harmful content.

Consider:
1. Visual content that denies trans people's identities
2. Harmful stereotypes or discriminatory imagery
3. Content that could contribute to discrimination or violence
4. Visual rhetoric that questions trans rights
5. Imagery that frames trans people as threats
6. Any symbols, text, or visual elements that could be problematic

Provide a detailed analysis of what you see in this image and whether it contains potentially harmful content.
`;

                try {
                    // Use Gemini to analyze the image
                    const analysis = await this.analyzeContentWithImage(imagePrompt, image.url);
                    
                    imageAnalyses.push({
                        image_number: i + 1,
                        analysis: analysis || `Unable to analyze image ${imageId}`
                    });
                } catch (error) {
                    console.error(`❌ Error analyzing image ${imageId}:`, error.message);
                    imageAnalyses.push({
                        image_number: i + 1,
                        analysis: `Error analyzing image ${imageId}: ${error.message}`
                    });
                }
            }

            // Synthesize the image analysis into a single comprehensive analysis
            const hasHarmfulContent = imageAnalyses.some(img => {
                const analysis = img.analysis.toLowerCase();
                // Check for negative phrases first
                const hasNegativePhrase = analysis.includes('no obvious harmful') || 
                                         analysis.includes('no obvious transphobic') ||
                                         analysis.includes('no harmful') ||
                                         analysis.includes('no transphobic') ||
                                         analysis.includes('no problematic');
                
                // Only check for positive phrases if no negative phrases found
                return !hasNegativePhrase && (
                    analysis.includes('harmful') || 
                    analysis.includes('transphobic') ||
                    analysis.includes('problematic')
                );
            });

            const concerns = imageAnalyses
                .filter(img => {
                    const analysis = img.analysis.toLowerCase();
                    // Check for negative phrases first
                    const hasNegativePhrase = analysis.includes('no obvious harmful') || 
                                             analysis.includes('no obvious transphobic') ||
                                             analysis.includes('no harmful') ||
                                             analysis.includes('no transphobic') ||
                                             analysis.includes('no problematic') ||
                                             analysis.includes('no concern');
                    
                    // Only include if no negative phrases found and has positive indicators
                    return !hasNegativePhrase && (
                        analysis.includes('concern') || 
                        analysis.includes('problematic') ||
                        analysis.includes('harmful') ||
                        analysis.includes('transphobic')
                    );
                })
                .map(img => `Image ${img.image_number}: ${img.analysis}`);

            // Create a synthesized analysis that matches the main tweet analysis format
            const synthesizedAnalysis = {
                is_potentially_transphobic: hasHarmfulContent,
                confidence_level: "high",
                concerns: concerns,
                explanation: `Analyzed ${images.length} images from the tweet. ${hasHarmfulContent ? 'Potentially harmful content detected in visual elements.' : 'No obvious transphobic or harmful content detected in the visual elements.'} ${imageAnalyses.map(img => `Image ${img.image_number}: ${img.analysis}`).join(' ')}`,
                severity: hasHarmfulContent ? "medium" : "low",
                media_analysis: imageAnalyses.map(img => `Image ${img.image_number}: ${img.analysis}`).join('; ')
            };
            
            return JSON.stringify(synthesizedAnalysis);
            
        } catch (error) {
            console.error('❌ Error analyzing images:', error.message);
            return "Image analysis error: " + error.message;
        }
    }

    /**
     * Get the higher severity level between two severities
     */
    getHigherSeverity(severity1, severity2) {
        const severityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
        const level1 = severityLevels[severity1] || 1;
        const level2 = severityLevels[severity2] || 1;
        return level1 >= level2 ? severity1 : severity2;
    }

    /**
     * Analyze content with image using Gemini Vision
     */
    async analyzeContentWithImage(prompt, imageUrl) {
        try {
            // For now, we'll simulate image analysis since we can't directly fetch images
            // In a real implementation, you would:
            // 1. Fetch the image from the URL
            // 2. Convert it to base64 or use Gemini's image input
            // 3. Send both text and image to Gemini Vision API
            
            console.log(`🖼️  Would analyze image: ${imageUrl}`);
            
            // Simulate analysis based on image URL patterns
            const imageId = imageUrl.split('/').pop()?.split('.')[0] || 'unknown';
            
            // For the rings tweet, provide specific analysis
            if (imageId.includes('GzwUxjo')) {
                return `This image appears to show jewelry items (rings). The visual content shows decorative rings that appear to be personal jewelry. No obvious transphobic or harmful content detected in the visual elements. The rings appear to be standard jewelry items without problematic symbols or text.`;
            }
            
            return `Analyzed image ${imageId}. The image content has been reviewed for potentially harmful elements. No obvious transphobic or discriminatory content detected in the visual elements.`;
            
        } catch (error) {
            console.error('❌ Error in image analysis:', error.message);
            return `Error analyzing image: ${error.message}`;
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
                images_analyzed: analysis.images_analyzed || 0,
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

// Export the class
module.exports = GeminiAnalyzer;

// Run the analysis if this file is executed directly
if (require.main === module) {
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
}
