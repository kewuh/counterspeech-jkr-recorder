const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');
const axios = require('axios');

class VisualAnalysisTest {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

    async testVisualAnalysis() {
        console.log('🖼️ Testing Visual Analysis on Tweet with Images\n');
        
        try {
            // Get a tweet with images
            const { data: tweets } = await this.supabase.supabase
                .from('jk_rowling_posts')
                .select('*')
                .eq('junkipedia_id', '605760935')
                .single();
                
            if (!tweets) {
                console.log('❌ Tweet not found');
                return;
            }
            
            console.log(`🔍 Tweet ${tweets.junkipedia_id}:`);
            console.log(`📝 Content: ${tweets.content}\n`);
            
            // Extract images
            const media = tweets.raw_data?.attributes?.post_data?.extended_entities?.media;
            
            if (!media || media.length === 0) {
                console.log('❌ No images found in this tweet');
                return;
            }
            
            console.log(`📸 Found ${media.length} image(s)`);
            
            // Download the first image
            const imageUrl = media[0].media_url_https || media[0].url;
            console.log(`📥 Downloading image: ${imageUrl}`);
            
            const imageData = await this.downloadImage(imageUrl);
            
            if (!imageData) {
                console.log('❌ Failed to download image');
                return;
            }
            
            console.log(`✅ Image downloaded successfully (${imageData.base64.length} chars)\n`);
            
            // Analyze with image
            console.log('🤖 Running AI analysis with image...\n');
            
            const prompt = `
Tweet Content: "${tweets.content}"
Tweet URL: ${tweets.url}
Published: ${tweets.published_at}

This tweet contains an image. Please analyze BOTH the text content AND the visual content for potentially transphobic content.

Consider:
1. Language that denies trans people's identities
2. Misgendering or deadnaming
3. Harmful stereotypes about trans people
4. Content that could contribute to discrimination or violence
5. Rhetoric that questions trans rights or access to healthcare
6. Language that frames trans people as threats or dangerous
7. Visual content that may be harmful or discriminatory
8. Images that reinforce harmful stereotypes
9. Media that could incite violence or discrimination
10. How the image relates to or amplifies the text message

Pay special attention to the visual content in the image and how it relates to the text.

Provide your analysis in the following JSON format:
{
  "is_potentially_transphobic": true/false,
  "confidence_level": "high/medium/low",
  "concerns": ["list of specific concerns"],
  "explanation": "detailed explanation of why this tweet is concerning or not",
  "severity": "high/medium/low",
  "recommendations": ["suggestions for addressing concerns"],
  "visual_analysis": "detailed analysis of the visual content and its relationship to transphobia",
  "text_analysis": "analysis of the text content specifically",
  "combined_analysis": "how text and visual content work together"
}
`;

            const contentParts = [
                prompt,
                {
                    inlineData: {
                        data: imageData.base64,
                        mimeType: imageData.mimeType
                    }
                }
            ];

            const result = await this.model.generateContent(contentParts);
            const response = await result.response;
            const text = response.text();
            
            console.log('📊 AI Response:');
            console.log(text);
            
            // Parse JSON
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    console.log('\n✅ Successfully analyzed with image:');
                    console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                    console.log(`   📊 Confidence: ${analysis.confidence_level}`);
                    console.log(`   ⚠️  Severity: ${analysis.severity}`);
                    console.log(`   🖼️  Visual analysis: ${analysis.visual_analysis ? 'Yes' : 'No'}`);
                    console.log(`   📝  Text analysis: ${analysis.text_analysis ? 'Yes' : 'No'}`);
                    console.log(`   🔗  Combined analysis: ${analysis.combined_analysis ? 'Yes' : 'No'}`);
                }
            } catch (parseError) {
                console.log('\n❌ Error parsing JSON response');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }
}

// Run the test
async function main() {
    const test = new VisualAnalysisTest();
    await test.testVisualAnalysis();
}

main().catch(console.error);
