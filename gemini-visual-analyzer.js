const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class VisualGeminiAnalyzer {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.supabase = new SupabaseClient();
        this.imageCache = new Map();
    }

    async downloadImage(url, filename) {
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
            
            // Cache the image
            this.imageCache.set(filename, {
                base64,
                mimeType: response.headers['content-type'] || 'image/jpeg'
            });
            
            return { base64, mimeType: response.headers['content-type'] || 'image/jpeg' };
        } catch (error) {
            console.error(`❌ Error downloading image ${url}:`, error.message);
            return null;
        }
    }

    async analyzeTweetWithVisualContent(tweet) {
        try {
            console.log(`🔍 Analyzing tweet ${tweet.junkipedia_id} with visual content...`);
            
            // Prepare the tweet content
            const tweetContent = tweet.content;
            const tweetUrl = tweet.url;
            const publishedAt = tweet.published_at;
            
            // Extract and download images
            const images = await this.extractAndDownloadImages(tweet);
            
            // Create the prompt
            let prompt = `
Tweet Content: "${tweetContent}"
Tweet URL: ${tweetUrl}
Published: ${publishedAt}

${images.length > 0 ? `This tweet contains ${images.length} image(s).` : 'This tweet contains no images.'}

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

${images.length > 0 ? 'Pay special attention to the visual content in the images and how it relates to the text.' : ''}

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this tweet is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "visual_analysis": "detailed analysis of any visual content and its relationship to transphobia",
  "text_analysis": "analysis of the text content specifically",
  "combined_analysis": "how text and visual content work together"
}
`;

            // Prepare content parts
            const contentParts = [prompt];
            
            // Add images to the analysis
            for (const image of images) {
                contentParts.push({
                    inlineData: {
                        data: image.base64,
                        mimeType: image.mimeType
                    }
                });
            }
            
            // Generate content with images
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
                    visual_analysis: "Unable to analyze visual content",
                    text_analysis: "Unable to analyze text content",
                    combined_analysis: "Unable to analyze combined content"
                };
            }
            
            // Store the analysis in the database
            await this.storeAnalysis(tweet.junkipedia_id, analysis, images.length);
            
            console.log(`✅ Analysis complete for tweet ${tweet.junkipedia_id}`);
            console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
            console.log(`   📊 Confidence: ${analysis.confidence_level}`);
            console.log(`   ⚠️  Severity: ${analysis.severity}`);
            console.log(`   🖼️  Images analyzed: ${images.length}`);
            if (analysis.visual_analysis) {
                console.log(`   👁️  Visual analysis: ${analysis.visual_analysis.substring(0, 100)}...`);
            }
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Error analyzing tweet ${tweet.junkipedia_id}:`, error.message);
            return null;
        }
    }

    async extractAndDownloadImages(tweet) {
        try {
            const rawData = tweet.raw_data;
            const postData = rawData?.attributes?.post_data;
            
            if (!postData?.extended_entities?.media) {
                return [];
            }
            
            const media = postData.extended_entities.media;
            const images = [];
            
            for (const item of media) {
                if (item.type === 'photo' && item.media_url_https) {
                    const imageUrl = item.media_url_https;
                    const filename = `tweet_${tweet.junkipedia_id}_${item.id_str || Date.now()}.jpg`;
                    
                    console.log(`   📥 Downloading image: ${imageUrl}`);
                    
                    const imageData = await this.downloadImage(imageUrl, filename);
                    if (imageData) {
                        images.push({
                            ...imageData,
                            url: imageUrl,
                            altText: item.alt_text || 'No alt text provided',
                            filename
                        });
                    }
                }
            }
            
            return images;
            
        } catch (error) {
            console.error('❌ Error extracting images:', error);
            return [];
        }
    }

    async analyzeAllTweetsWithVisualContent() {
        try {
            console.log('🚀 Starting visual Gemini analysis...\n');
            
            // Get all tweets from database
            const tweets = await this.supabase.getAllPosts();
            console.log(`📊 Found ${tweets.length} tweets to analyze`);
            
            let analyzedCount = 0;
            let flaggedCount = 0;
            let totalImages = 0;
            
            for (const tweet of tweets) {
                // Analyze the tweet with visual content
                const analysis = await this.analyzeTweetWithVisualContent(tweet);
                
                if (analysis) {
                    analyzedCount++;
                    if (analysis.is_potentially_transphobic) {
                        flaggedCount++;
                        console.log(`🚨 FLAGGED: Tweet ${tweet.junkipedia_id}`);
                        console.log(`   📝 Content: ${tweet.content.substring(0, 100)}...`);
                        console.log(`   ⚠️  Concerns: ${analysis.concerns.join(', ')}`);
                        console.log(`   📊 Severity: ${analysis.severity}`);
                        if (analysis.visual_analysis) {
                            console.log(`   👁️  Visual concerns: ${analysis.visual_analysis.substring(0, 150)}...`);
                        }
                        console.log('');
                    }
                }
                
                // Add delay to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay for visual analysis
            }
            
            console.log(`\n📊 Visual Analysis Summary:`);
            console.log(`   ✅ Analyzed: ${analyzedCount} tweets`);
            console.log(`   🚨 Flagged: ${flaggedCount} tweets`);
            console.log(`   📈 Flag rate: ${((flaggedCount / analyzedCount) * 100).toFixed(1)}%`);
            console.log(`   🖼️  Total images processed: ${totalImages}`);
            
        } catch (error) {
            console.error('❌ Error analyzing tweets:', error);
        }
    }

    async storeAnalysis(tweetId, analysis, imageCount = 0) {
        try {
            const analysisData = {
                tweet_id: tweetId,
                is_potentially_transphobic: analysis.is_potentially_transphobic,
                confidence_level: analysis.confidence_level,
                concerns: analysis.concerns,
                explanation: analysis.explanation,
                severity: analysis.severity,
                recommendations: analysis.recommendations,
                visual_analysis: analysis.visual_analysis || null,
                text_analysis: analysis.text_analysis || null,
                combined_analysis: analysis.combined_analysis || null,
                image_count: imageCount,
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

    // Clean up downloaded images
    cleanup() {
        this.imageCache.clear();
    }
}

// Run the visual analysis
async function main() {
    const analyzer = new VisualGeminiAnalyzer();
    
    try {
        // Check if we have a Gemini API key
        if (!config.gemini?.apiKey) {
            console.log('❌ No Gemini API key found. Please add GEMINI_API_KEY to your .env file');
            console.log('📋 Get your API key from: https://makersuite.google.com/app/apikey');
            return;
        }
        
        // Initialize the analysis table
        await analyzer.supabase.initializeAnalysisTable();
        
        // Analyze all tweets with visual content
        await analyzer.analyzeAllTweetsWithVisualContent();
        
    } finally {
        // Clean up
        analyzer.cleanup();
    }
}

main().catch(console.error);
