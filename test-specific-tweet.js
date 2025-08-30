const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

async function testSpecificTweet() {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const supabase = new SupabaseClient();
    
    console.log('🔍 Testing Fixed Article Integration\n');
    
    try {
        // Get the specific tweet with NY Post article
        const { data: tweets } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', '603062907');
            
        if (!tweets || tweets.length === 0) {
            console.log('❌ Tweet not found');
            return;
        }
        
        const tweet = tweets[0];
        console.log(`🔍 Tweet ${tweet.junkipedia_id}:`);
        console.log(`📝 Content: ${tweet.content}\n`);
        
        // Get stored articles
        const storedArticles = await supabase.getArticleContent(tweet.junkipedia_id);
        
        if (!storedArticles || storedArticles.length === 0) {
            console.log('❌ No articles found');
            return;
        }
        
        // Filter articles with content
        const articlesWithContent = storedArticles.filter(article => 
            article.content && article.content.trim().length > 0 && article.word_count > 10
        );
        
        if (articlesWithContent.length === 0) {
            console.log('❌ No articles with meaningful content');
            return;
        }
        
        console.log(`✅ Found ${articlesWithContent.length} article(s) with content`);
        
        // Test with the NY Post article
        const article = articlesWithContent[0];
        console.log(`📄 Article: "${article.title}"`);
        console.log(`📏 Word count: ${article.word_count}`);
        console.log(`📝 Content preview: ${article.content.substring(0, 100)}...\n`);
        
        // Test AI analysis
        console.log('🤖 Testing AI analysis with article content...\n');
        
        const prompt = `
Tweet Content: "${tweet.content}"

Linked Article: "${article.title}"
Article Content: "${article.content.substring(0, 800)}..."

Please analyze this tweet AND the linked article for potentially transphobic content. Consider:
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
  "explanation": "brief explanation",
  "severity": "high/medium/low",
  "recommendations": ["suggestions"],
  "tweet_analysis": "analysis of tweet content",
  "article_analysis": "analysis of article content",
  "combined_analysis": "combined analysis of both",
  "articles_analyzed": 1
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('📊 AI Response:');
        console.log(text);
        
        // Parse JSON
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log('\n✅ Successfully analyzed with article content:');
                console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                console.log(`   📊 Confidence: ${analysis.confidence_level}`);
                console.log(`   ⚠️  Severity: ${analysis.severity}`);
                console.log(`   📄 Articles analyzed: ${analysis.articles_analyzed}`);
                console.log(`   🔗 Combined analysis: ${analysis.combined_analysis ? 'Yes' : 'No'}`);
            }
        } catch (parseError) {
            console.log('\n❌ Error parsing JSON response');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSpecificTweet().catch(console.error);
