const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');
const axios = require('axios');

class ComprehensiveTest {
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

    async testComprehensive() {
        console.log('🔍 Testing Comprehensive Analysis (Text + Images + Articles)\n');
        
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
            
            // Get stored articles
            const storedArticles = await this.supabase.getArticleContent(tweets.junkipedia_id);
            const articlesWithContent = storedArticles?.filter(article => 
                article.content && article.content.trim().length > 0 && article.word_count > 10
            ) || [];
            
            // Extract images
            const media = tweets.raw_data?.attributes?.post_data?.extended_entities?.media;
            const images = [];
            
            if (media && media.length > 0) {
                for (const item of media) {
                    if (item.type === 'photo') {
                        const imageUrl = item.media_url_https || item.url;
                        console.log(`📥 Downloading image: ${imageUrl}`);
                        
                        const imageData = await this.downloadImage(imageUrl);
                        if (imageData) {
                            images.push(imageData);
                            console.log(`✅ Image downloaded successfully`);
                        }
                    }
                }
            }
            
            console.log(`   📄 Articles: ${articlesWithContent.length} with content`);
            console.log(`   🖼️ Images: ${images.length} downloaded\n`);
            
            // Prepare content parts for analysis
            const contentParts = [];
            
            // Build the prompt
            let prompt = `
Tweet Content: "${tweets.content}"
Tweet URL: ${tweets.url}
Published: ${tweets.published_at}

${articlesWithContent.length > 0 ? `Linked Articles (${articlesWithContent.length}):` : 'No linked articles found.'}
${articlesWithContent.map(article => 
    `Article: ${article.title}\nURL: ${article.url}\nContent: ${article.content.substring(0, 800)}...`
).join('\n\n')}

${images.length > 0 ? `This tweet contains ${images.length} image(s).` : 'This tweet contains no images.'}

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

            console.log('🤖 Running comprehensive AI analysis...\n');
            
            // Run the analysis
            const result = await this.model.generateContent(contentParts);
            const response = await result.response;
            const text = response.text();
            
            console.log('📊 AI Response:');
            console.log(text);
            
            // Parse the JSON response
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    console.log('\n✅ Successfully analyzed comprehensively:');
                    console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                    console.log(`   📊 Confidence: ${analysis.confidence_level}`);
                    console.log(`   ⚠️  Severity: ${analysis.severity}`);
                    console.log(`   📄 Articles analyzed: ${analysis.articles_analyzed}`);
                    console.log(`   🖼️ Images analyzed: ${analysis.images_analyzed}`);
                    console.log(`   📝 Text analysis: ${analysis.text_analysis ? 'Yes' : 'No'}`);
                    console.log(`   🖼️ Visual analysis: ${analysis.visual_analysis ? 'Yes' : 'No'}`);
                    console.log(`   📄 Article analysis: ${analysis.article_analysis ? 'Yes' : 'No'}`);
                    console.log(`   🔗 Combined analysis: ${analysis.combined_analysis ? 'Yes' : 'No'}`);
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
    const test = new ComprehensiveTest();
    await test.testComprehensive();
}

main().catch(console.error);
