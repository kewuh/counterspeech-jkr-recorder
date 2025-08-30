const { GoogleGenerativeAI } = require('@google/generative-ai');
const SupabaseClient = require('./supabase-client');
const config = require('./config');

async function testWorkingArticle() {
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const supabase = new SupabaseClient();
    
    console.log('🔍 Testing Article Integration with Working Content\n');
    
    try {
        // Find the tweet with the NY Post article
        const { data: articles } = await supabase.supabase
            .from('article_content')
            .select('*')
            .eq('url', 'https://nypost.com/2025/06/02/sports/olympic-boxer-imane-khelifs-leaked-lab-results-offer-new-evidence-about-her-biological-sex/');
            
        if (!articles || articles.length === 0) {
            console.log('❌ No NY Post article found');
            return;
        }
        
        const article = articles[0];
        console.log(`📄 Found article: ${article.title}`);
        console.log(`📏 Word count: ${article.word_count}`);
        console.log(`📝 Content preview: ${article.content.substring(0, 200)}...\n`);
        
        // Find the tweet that links to this article
        const { data: tweets } = await supabase.supabase
            .from('jk_rowling_posts')
            .select('*')
            .eq('junkipedia_id', article.tweet_id);
            
        if (!tweets || tweets.length === 0) {
            console.log('❌ No tweet found for this article');
            return;
        }
        
        const tweet = tweets[0];
        console.log(`🔍 Tweet ${tweet.junkipedia_id}:`);
        console.log(`📝 Content: ${tweet.content}\n`);
        
        // Test AI analysis with article content
        console.log('🤖 Testing AI analysis with article content...\n');
        
        const prompt = `
Tweet Content: "${tweet.content}"

Linked Article: "${article.title}"
Article Content: "${article.content.substring(0, 1000)}..."

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
  "explanation": "detailed explanation",
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
        
        // Try to parse JSON
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log('\n✅ Successfully parsed analysis:');
                console.log(`   🚨 Potentially transphobic: ${analysis.is_potentially_transphobic}`);
                console.log(`   📊 Confidence: ${analysis.confidence_level}`);
                console.log(`   ⚠️  Severity: ${analysis.severity}`);
                console.log(`   📄 Articles analyzed: ${analysis.articles_analyzed}`);
            }
        } catch (parseError) {
            console.log('\n❌ Error parsing JSON response');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testWorkingArticle().catch(console.error);
